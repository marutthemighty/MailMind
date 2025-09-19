import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEmailStore } from "@/store/emailStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCheck, RotateCcw, Lightbulb, Star } from "lucide-react";
import { getEmails } from "@/lib/gmail";
import { cn } from "@/lib/utils";
import { Email } from "@shared/schema";

export function EmailList() {
  const { 
    activeAccount, 
    emails, 
    setEmails, 
    selectedEmail, 
    setSelectedEmail 
  } = useEmailStore();
  
  const [filter, setFilter] = useState<"all" | "unread" | "urgent">("all");

  const { data: fetchedEmails, isLoading } = useQuery({
    queryKey: ['/api/emails', activeAccount?.id],
    enabled: !!activeAccount?.id,
  });

  useEffect(() => {
    if (fetchedEmails) {
      setEmails(fetchedEmails);
      if (!selectedEmail && fetchedEmails.length > 0) {
        setSelectedEmail(fetchedEmails[0]);
      }
    }
  }, [fetchedEmails, setEmails, selectedEmail, setSelectedEmail]);

  const filteredEmails = emails.filter(email => {
    switch (filter) {
      case "unread":
        return !email.isRead;
      case "urgent":
        return email.priority === "urgent" || email.priority === "high";
      default:
        return true;
    }
  });

  const getAvatarText = (from: string) => {
    const match = from.match(/(?:^|<)([^<>]*?)(?:>|$)/);
    const name = match ? match[1].trim() : from;
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getSenderName = (from: string) => {
    const match = from.match(/^([^<]+)/);
    return match ? match[1].trim() : from;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 border-l-red-500";
      case "high":
        return "bg-orange-500 border-l-orange-500";
      case "normal":
        return "bg-blue-500 border-l-blue-500";
      default:
        return "bg-gray-500 border-l-gray-500";
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "work":
        return "bg-blue-100 text-blue-700";
      case "personal":
        return "bg-green-100 text-green-700";
      case "customer_service":
        return "bg-red-100 text-red-700";
      case "marketing":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (isLoading) {
    return (
      <div className="w-96 bg-card border-r border-border flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading emails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-card border-r border-border flex flex-col" data-testid="email-list">
      {/* Email List Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Inbox</h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              title="Mark all as read"
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              title="Refresh"
              data-testid="button-refresh"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* AI Insights Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary">AI Insight</p>
              <p className="text-xs text-primary/80">
                You have {filteredEmails.filter(e => e.priority === "urgent").length} urgent emails 
                requiring immediate attention and {filteredEmails.filter(e => (e.actionItems as string[])?.length > 0).length} follow-ups overdue.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "flex-1 text-xs h-8",
              filter === "all" && "bg-card shadow-sm"
            )}
            onClick={() => setFilter("all")}
            data-testid="filter-all"
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "flex-1 text-xs h-8",
              filter === "unread" && "bg-card shadow-sm"
            )}
            onClick={() => setFilter("unread")}
            data-testid="filter-unread"
          >
            Unread
          </Button>
          <Button
            variant={filter === "urgent" ? "default" : "ghost"}
            size="sm"
            className={cn(
              "flex-1 text-xs h-8",
              filter === "urgent" && "bg-card shadow-sm"
            )}
            onClick={() => setFilter("urgent")}
            data-testid="filter-urgent"
          >
            Urgent
          </Button>
        </div>
      </div>

      {/* Email Items */}
      <div className="flex-1 overflow-y-auto">
        {filteredEmails.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No emails found</p>
          </div>
        ) : (
          filteredEmails.map((email) => (
            <div
              key={email.id}
              className={cn(
                "p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors",
                selectedEmail?.id === email.id && "bg-muted",
                email.priority === "urgent" && "bg-red-50 border-l-4 border-l-red-500",
                !email.isRead && "font-medium"
              )}
              onClick={() => setSelectedEmail(email)}
              data-testid={`email-item-${email.id}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={getPriorityColor(email.priority || "normal")}>
                      <span className="text-xs font-medium text-white">
                        {getAvatarText(email.from)}
                      </span>
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {getSenderName(email.from)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {email.receivedAt ? new Date(email.receivedAt).toLocaleTimeString() : 'Unknown time'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {email.category && (
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getCategoryBadge(email.category))}
                    >
                      {email.category}
                    </Badge>
                  )}
                  {email.isStarred && (
                    <Star className="w-3 h-3 text-accent fill-current" />
                  )}
                </div>
              </div>
              
              <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-1">
                {email.subject || 'No subject'}
              </h3>
              
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {email.snippet || email.body?.substring(0, 100) + '...' || 'No preview available'}
              </p>

              {/* AI Summary */}
              {email.aiSummary && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                  <div className="flex items-center space-x-2 mb-1">
                    <Lightbulb className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">AI Summary</span>
                  </div>
                  <p className="text-xs text-blue-600 line-clamp-2">{email.aiSummary}</p>
                </div>
              )}

              {/* Action Items */}
              {email.actionItems && Array.isArray(email.actionItems) && email.actionItems.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(email.actionItems as string[]).slice(0, 2).map((item, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="text-xs bg-accent/20 text-accent"
                    >
                      {item.length > 20 ? item.substring(0, 20) + '...' : item}
                    </Badge>
                  ))}
                  {(email.actionItems as string[]).length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{(email.actionItems as string[]).length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
