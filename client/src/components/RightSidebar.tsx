import { useQuery } from "@tanstack/react-query";
import { useEmailStore } from "@/store/emailStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, Mail, Reply, Clock, CheckSquare, Calendar, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function RightSidebar() {
  const { user, actionItems } = useEmailStore();

  const { data: templates } = useQuery({
    queryKey: ['/api/templates', user?.id],
    enabled: !!user?.id
  });

  const { data: userActionItems } = useQuery({
    queryKey: ['/api/action-items', user?.id],
    enabled: !!user?.id
  });

  const todayStats = {
    emailsRead: 24,
    repliesSent: 8,
    avgResponse: "2.3h"
  };

  const connectedApps = [
    { name: "Gmail", icon: "🟢", status: "connected" },
    { name: "Outlook", icon: "🟢", status: "connected" },
    { name: "Slack", icon: "⚫", status: "disconnected" }
  ];

  return (
    <aside className="w-80 bg-card border-l border-border p-4 overflow-y-auto hidden xl:block" data-testid="right-sidebar">
      <div className="space-y-6">
        {/* AI Assistant Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Bot className="w-4 h-4" />
              <span>AI Assistant</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="w-3 h-3 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">MailBot</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
              <p className="text-sm text-foreground mb-2">How can I help you with this email?</p>
            </div>
            
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-xs h-8 p-2"
                data-testid="ai-suggest-subject"
              >
                Suggest a better subject line
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-xs h-8 p-2"
                data-testid="ai-create-reminders"
              >
                Create follow-up reminders
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-xs h-8 p-2"
                data-testid="ai-generate-agenda"
              >
                Generate meeting agenda
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Today's Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-foreground">Emails Read</span>
              </div>
              <span className="text-sm font-medium text-foreground">{todayStats.emailsRead}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center space-x-2">
                <Reply className="w-4 h-4 text-green-500" />
                <span className="text-sm text-foreground">Replies Sent</span>
              </div>
              <span className="text-sm font-medium text-foreground">{todayStats.repliesSent}</span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-sm text-foreground">Avg Response</span>
              </div>
              <span className="text-sm font-medium text-foreground">{todayStats.avgResponse}</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Action Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {userActionItems?.slice(0, 3).map((item) => (
              <div key={item.id} className="p-2 bg-muted/50 rounded" data-testid={`action-item-${item.id}`}>
                <div className="flex items-start space-x-2">
                  <Checkbox className="mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                    <p className={cn(
                      "text-xs",
                      item.priority === "high" ? "text-red-600" : 
                      item.priority === "medium" ? "text-orange-600" : 
                      "text-muted-foreground"
                    )}>
                      Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "No due date"}
                    </p>
                  </div>
                </div>
              </div>
            )) || (
              // Default action items for demo
              <div className="space-y-2">
                <div className="p-2 bg-muted/50 rounded">
                  <div className="flex items-start space-x-2">
                    <Checkbox className="mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">Schedule team meeting</p>
                      <p className="text-xs text-muted-foreground">From: Project Deadline Email</p>
                      <p className="text-xs text-red-600">Due: Today</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-muted/50 rounded">
                  <div className="flex items-start space-x-2">
                    <Checkbox className="mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">Review budget proposal</p>
                      <p className="text-xs text-muted-foreground">From: Project Deadline Email</p>
                      <p className="text-xs text-orange-600">Due: Tomorrow</p>
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-muted/50 rounded">
                  <div className="flex items-start space-x-2">
                    <Checkbox className="mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">Follow up on campaign metrics</p>
                      <p className="text-xs text-muted-foreground">From: Q4 Campaign Review</p>
                      <p className="text-xs text-muted-foreground">Due: Friday</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Templates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates?.slice(0, 3).map((template) => (
              <Button
                key={template.id}
                variant="ghost"
                className="w-full justify-start p-2 h-auto"
                data-testid={`template-${template.id}`}
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{template.category}</p>
                </div>
              </Button>
            )) || (
              // Default templates
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start p-2 h-auto"
                  data-testid="template-meeting"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Meeting Request</p>
                    <p className="text-xs text-muted-foreground">Professional meeting scheduler</p>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start p-2 h-auto"
                  data-testid="template-followup"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Follow-up</p>
                    <p className="text-xs text-muted-foreground">Polite follow-up template</p>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start p-2 h-auto"
                  data-testid="template-thankyou"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Thank You</p>
                    <p className="text-xs text-muted-foreground">Appreciation and gratitude</p>
                  </div>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connected Apps */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Connected Apps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {connectedApps.map((app) => (
              <div 
                key={app.name} 
                className="flex items-center justify-between p-2 bg-muted/50 rounded"
                data-testid={`app-${app.name.toLowerCase()}`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-xs">
                    {app.name[0]}
                  </div>
                  <span className="text-sm text-foreground">{app.name}</span>
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  app.status === "connected" ? "bg-green-500" : "bg-gray-400"
                )} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
