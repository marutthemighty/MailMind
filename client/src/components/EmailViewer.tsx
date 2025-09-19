import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmailStore } from "@/store/emailStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Reply, 
  Forward, 
  Archive, 
  Trash2, 
  Lightbulb, 
  Thermometer, 
  CheckSquare,
  Languages,
  Paperclip,
  Calendar,
  Mic,
  RotateCcw
} from "lucide-react";
import { generateReply, updateEmail } from "@/lib/gmail";
import { cn } from "@/lib/utils";
import { VoiceInput } from "./VoiceInput";

export function EmailViewer() {
  const { selectedEmail, updateEmail: updateEmailStore } = useEmailStore();
  const [replyText, setReplyText] = useState("");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [isComposingReply, setIsComposingReply] = useState(false);
  const [isVoiceInputOpen, setIsVoiceInputOpen] = useState(false);
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: (emailId: string) => updateEmail(emailId, { isRead: true }),
    onSuccess: (updatedEmail) => {
      updateEmailStore(updatedEmail.id, updatedEmail);
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
    }
  });

  const generateReplyMutation = useMutation({
    mutationFn: ({ originalEmail, originalSubject, context, tone }: {
      originalEmail: string;
      originalSubject: string;
      context: string;
      tone: string;
    }) => generateReply(originalEmail, originalSubject, context, tone),
    onSuccess: (reply) => {
      setReplyText(reply.body);
    }
  });

  // Mark as read when email is selected
  if (selectedEmail && !selectedEmail.isRead) {
    markAsReadMutation.mutate(selectedEmail.id);
  }

  const handleGenerateReply = () => {
    if (!selectedEmail) return;
    
    generateReplyMutation.mutate({
      originalEmail: selectedEmail.body || "",
      originalSubject: selectedEmail.subject || "",
      context: "Generate a professional response to this email",
      tone: selectedTone
    });
  };

  const getAvatarText = (from: string) => {
    const match = from.match(/(?:^|<)([^<>]*?)(?:>|$)/);
    const name = match ? match[1].trim() : from;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getSenderName = (from: string) => {
    const match = from.match(/^([^<]+)/);
    return match ? match[1].trim() : from;
  };

  const getSenderEmail = (from: string) => {
    const match = from.match(/<([^>]+)>/);
    return match ? match[1] : from;
  };

  const formatEmailBody = (body: string) => {
    // Basic HTML sanitization and formatting
    return body
      .replace(/\n/g, '<br>')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&lt;br&gt;/g, '<br>');
  };

  if (!selectedEmail) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-muted-foreground">Select an email to view</p>
          <p className="text-sm text-muted-foreground">Choose an email from the list to see its content and AI insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background" data-testid="email-viewer">
      {/* Email Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getAvatarText(selectedEmail.from)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-foreground line-clamp-2">
                {selectedEmail.subject || 'No subject'}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{getSenderName(selectedEmail.from)}</span>
                <span>•</span>
                <span>{getSenderEmail(selectedEmail.from)}</span>
                <span>•</span>
                <span>
                  {selectedEmail.receivedAt 
                    ? new Date(selectedEmail.receivedAt).toLocaleString()
                    : 'Unknown time'
                  }
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              title="Reply"
              onClick={() => setIsComposingReply(!isComposingReply)}
              data-testid="button-reply"
            >
              <Reply className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Forward" data-testid="button-forward">
              <Forward className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Archive" data-testid="button-archive">
              <Archive className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Delete" data-testid="button-delete">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* AI Analysis Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* AI Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-700">AI Summary</h3>
            </div>
            <p className="text-sm text-blue-600">
              {selectedEmail.aiSummary || "AI summary not available"}
            </p>
          </div>

          {/* Sentiment Analysis */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Thermometer className="w-4 h-4 text-yellow-600" />
              <h3 className="text-sm font-medium text-yellow-700">Sentiment</h3>
            </div>
            <p className="text-sm text-yellow-600">
              {selectedEmail.sentiment || "Neutral"} 
              {selectedEmail.sentimentScore && ` (${selectedEmail.sentimentScore}/5)`}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Priority: {selectedEmail.priority || "Normal"}
            </p>
          </div>

          {/* Action Items */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckSquare className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-medium text-green-700">Action Items</h3>
            </div>
            <div className="space-y-1">
              {selectedEmail.actionItems && Array.isArray(selectedEmail.actionItems) 
                ? (selectedEmail.actionItems as string[]).slice(0, 2).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input type="checkbox" className="w-3 h-3 text-green-600 rounded" />
                      <span className="text-sm text-green-600 line-clamp-1">{item}</span>
                    </div>
                  ))
                : <p className="text-sm text-green-600">No action items identified</p>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="prose max-w-none text-foreground">
          {selectedEmail.body ? (
            <div 
              dangerouslySetInnerHTML={{ 
                __html: formatEmailBody(selectedEmail.body) 
              }}
              data-testid="email-body"
            />
          ) : (
            <p className="text-muted-foreground">No email content available</p>
          )}
        </div>

        {/* Translation Option */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Languages className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Translate this email</span>
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select language..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* AI Reply Composer */}
      {isComposingReply && (
        <div className="bg-card border-t border-border p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">AI-Powered Reply</h3>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsVoiceInputOpen(true)}
                  data-testid="button-voice-input"
                >
                  <Mic className="w-4 h-4" />
                  Voice Input
                </Button>
              </div>
            </div>

            {/* AI Tone Selector */}
            <div className="flex space-x-2 mb-3">
              {["professional", "friendly", "formal", "empathetic"].map((tone) => (
                <Button
                  key={tone}
                  variant={selectedTone === tone ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedTone(tone)}
                  data-testid={`tone-${tone}`}
                >
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </Button>
              ))}
            </div>

            {/* Reply Text Area */}
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">AI-Generated Response</span>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleGenerateReply}
                    disabled={generateReplyMutation.isPending}
                    data-testid="button-regenerate-reply"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    {generateReplyMutation.isPending ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </div>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="AI-generated reply will appear here..."
                className="min-h-32 resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
                data-testid="textarea-reply"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" data-testid="button-attach">
                  <Paperclip className="w-4 h-4 mr-1" />
                  Attach
                </Button>
                <Button variant="ghost" size="sm" data-testid="button-schedule">
                  <Calendar className="w-4 h-4 mr-1" />
                  Schedule
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsComposingReply(false)}
                  data-testid="button-save-draft"
                >
                  Save Draft
                </Button>
                <Button 
                  size="sm"
                  disabled={!replyText.trim()}
                  data-testid="button-send-reply"
                >
                  Send Reply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Input Modal */}
      <VoiceInput
        isOpen={isVoiceInputOpen}
        onClose={() => setIsVoiceInputOpen(false)}
        onTranscript={(text) => setReplyText(prev => prev + " " + text)}
      />
    </div>
  );
}
