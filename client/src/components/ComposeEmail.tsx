import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEmailStore } from "@/store/emailStore";
import { VoiceInput } from "./VoiceInput";
import { 
  Send, 
  Paperclip, 
  Mic, 
  Smile, 
  Bold, 
  Italic, 
  Link,
  X,
  Calendar,
  Clock
} from "lucide-react";
import { sendEmail, generateReply, improveEmailWriting } from "@/lib/gmail";

interface ComposeEmailProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: {
    id: string;
    subject: string;
    from: string;
    body: string;
  };
}

export function ComposeEmail({ isOpen, onClose, replyTo }: ComposeEmailProps) {
  const { activeAccount } = useEmailStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [to, setTo] = useState(replyTo ? replyTo.from : "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : "");
  const [body, setBody] = useState("");
  const [tone, setTone] = useState("professional");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isVoiceInputOpen, setIsVoiceInputOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [scheduledSend, setScheduledSend] = useState<Date | null>(null);

  const sendEmailMutation = useMutation({
    mutationFn: () => {
      if (!activeAccount) throw new Error("No active account");
      return sendEmail(activeAccount.id, to, subject, body);
    },
    onSuccess: () => {
      toast({
        title: "Email sent successfully",
        description: "Your email has been delivered."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const generateAIReplyMutation = useMutation({
    mutationFn: ({ context, selectedTone }: { context: string; selectedTone: string }) => {
      if (!replyTo) throw new Error("No email to reply to");
      return generateReply(replyTo.body, replyTo.subject, context, selectedTone);
    },
    onSuccess: (reply) => {
      setBody(reply.body);
      setSubject(reply.subject);
    }
  });

  const improveEmailMutation = useMutation({
    mutationFn: ({ content, targetTone }: { content: string; targetTone: string }) => 
      improveEmailWriting(content, targetTone),
    onSuccess: (improved) => {
      setBody(improved.improvedContent);
    }
  });

  const handleClose = () => {
    setTo(replyTo ? replyTo.from : "");
    setCc("");
    setBcc("");
    setSubject(replyTo ? `Re: ${replyTo.subject}` : "");
    setBody("");
    setAttachments([]);
    setScheduledSend(null);
    onClose();
  };

  const handleSend = () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in recipient, subject, and message body.",
        variant: "destructive"
      });
      return;
    }

    sendEmailMutation.mutate();
  };

  const handleGenerateAI = () => {
    if (!replyTo) return;
    generateAIReplyMutation.mutate({
      context: "Generate a professional response to this email",
      selectedTone: tone
    });
  };

  const handleImproveWithAI = () => {
    if (!body.trim()) return;
    improveEmailMutation.mutate({
      content: body,
      targetTone: tone
    });
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="compose-email-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{replyTo ? "Reply" : "Compose Email"}</span>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsVoiceInputOpen(true)}
                  data-testid="button-voice-compose"
                >
                  <Mic className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClose}
                  data-testid="button-close-compose"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Recipients */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium w-12">To:</label>
                <Input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-1"
                  data-testid="input-to"
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  data-testid="button-cc-bcc"
                >
                  Cc/Bcc
                </Button>
              </div>

              {showCcBcc && (
                <>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium w-12">Cc:</label>
                    <Input
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="cc@example.com"
                      className="flex-1"
                      data-testid="input-cc"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium w-12">Bcc:</label>
                    <Input
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                      placeholder="bcc@example.com"
                      className="flex-1"
                      data-testid="input-bcc"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Subject */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium w-12">Subject:</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="flex-1"
                data-testid="input-subject"
              />
            </div>

            {/* AI Tone Selector */}
            <div className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">AI Tone:</span>
              <div className="flex space-x-2">
                {["professional", "friendly", "formal", "empathetic", "casual"].map((toneOption) => (
                  <Button
                    key={toneOption}
                    variant={tone === toneOption ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setTone(toneOption)}
                    data-testid={`tone-${toneOption}`}
                  >
                    {toneOption.charAt(0).toUpperCase() + toneOption.slice(1)}
                  </Button>
                ))}
              </div>
              <div className="flex space-x-2 ml-auto">
                {replyTo && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={handleGenerateAI}
                    disabled={generateAIReplyMutation.isPending}
                    data-testid="button-generate-ai"
                  >
                    {generateAIReplyMutation.isPending ? "Generating..." : "Generate AI Reply"}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleImproveWithAI}
                  disabled={improveEmailMutation.isPending || !body.trim()}
                  data-testid="button-improve-ai"
                >
                  {improveEmailMutation.isPending ? "Improving..." : "Improve with AI"}
                </Button>
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded border">
              <Button variant="ghost" size="sm" data-testid="button-bold">
                <Bold className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" data-testid="button-italic">
                <Italic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" data-testid="button-link">
                <Link className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" data-testid="button-emoji">
                <Smile className="w-4 h-4" />
              </Button>
              <div className="ml-auto flex items-center space-x-2">
                <input
                  type="file"
                  multiple
                  onChange={handleFileAttachment}
                  className="hidden"
                  id="file-attachment"
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => document.getElementById('file-attachment')?.click()}
                  data-testid="button-attach"
                >
                  <Paperclip className="w-4 h-4" />
                  Attach
                </Button>
                <Button variant="ghost" size="sm" data-testid="button-schedule">
                  <Calendar className="w-4 h-4" />
                  Schedule
                </Button>
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Attachments:</p>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="flex items-center space-x-2"
                      data-testid={`attachment-${index}`}
                    >
                      <span className="text-xs">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => removeAttachment(index)}
                        data-testid={`remove-attachment-${index}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Message Body */}
            <div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message here... You can also use voice input or AI assistance."
                className="min-h-64 resize-none"
                data-testid="textarea-compose-body"
              />
            </div>

            {/* Quoted Original (for replies) */}
            {replyTo && (
              <div className="border-l-4 border-muted pl-4 bg-muted/20 p-3 rounded">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Original message from {replyTo.from}:
                </p>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">{replyTo.subject}</p>
                  <div className="mt-2 line-clamp-3">
                    {replyTo.body.substring(0, 200)}...
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Save as draft functionality
                    toast({
                      title: "Draft saved",
                      description: "Your email has been saved as a draft."
                    });
                  }}
                  data-testid="button-save-draft"
                >
                  Save Draft
                </Button>
                {scheduledSend && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Scheduled for {scheduledSend.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  onClick={handleClose}
                  data-testid="button-cancel-compose"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSend}
                  disabled={sendEmailMutation.isPending || !to.trim() || !subject.trim() || !body.trim()}
                  className="flex items-center space-x-2"
                  data-testid="button-send-email"
                >
                  {sendEmailMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Input Modal */}
      <VoiceInput
        isOpen={isVoiceInputOpen}
        onClose={() => setIsVoiceInputOpen(false)}
        onTranscript={(text) => setBody(prev => prev + (prev ? " " : "") + text)}
      />
    </>
  );
}
