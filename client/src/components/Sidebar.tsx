import { useState } from "react";
import { useEmailStore } from "@/store/emailStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Inbox, 
  Send, 
  FileText, 
  Trash2, 
  Sparkles, 
  CheckSquare, 
  BarChart3,
  Settings,
  ChevronDown,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, emailAccounts, activeAccount, isSidebarOpen } = useEmailStore();
  const [selectedSection, setSelectedSection] = useState("inbox");

  const navigationItems = [
    { id: "inbox", label: "Inbox", icon: Inbox, badge: 24, isActive: true },
    { id: "sent", label: "Sent", icon: Send },
    { id: "drafts", label: "Drafts", icon: FileText, badge: 3 },
    { id: "trash", label: "Trash", icon: Trash2 },
  ];

  const aiFeatures = [
    { id: "summaries", label: "Summaries", icon: Sparkles },
    { id: "action-items", label: "Action Items", icon: CheckSquare, badge: 7 },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  const categories = [
    { id: "urgent", label: "Urgent", color: "bg-red-500" },
    { id: "work", label: "Work", color: "bg-blue-500" },
    { id: "personal", label: "Personal", color: "bg-green-500" },
  ];

  return (
    <aside 
      className={cn(
        "w-64 bg-card border-r border-border flex flex-col transition-transform duration-300",
        !isSidebarOpen && "md:-translate-x-full",
        className
      )}
      data-testid="sidebar"
    >
      {/* Logo and Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Mail className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">MailAssist Pro</h1>
            <p className="text-xs text-muted-foreground">AI Email Assistant</p>
          </div>
        </div>
      </div>

      {/* Account Switcher */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Button
            variant="ghost"
            className="w-full justify-between p-3 h-auto bg-muted hover:bg-muted/80"
            data-testid="button-account-switcher"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.picture} />
                <AvatarFallback>
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email || 'No account'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {emailAccounts.length} account{emailAccounts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => (
          <Button
            key={item.id}
            variant={selectedSection === item.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start space-x-3 h-10",
              selectedSection === item.id && "bg-primary/10 text-primary hover:bg-primary/15"
            )}
            onClick={() => setSelectedSection(item.id)}
            data-testid={`nav-${item.id}`}
          >
            <item.icon className="w-4 h-4" />
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <Badge 
                variant={selectedSection === item.id ? "default" : "secondary"}
                className="ml-auto"
              >
                {item.badge}
              </Badge>
            )}
          </Button>
        ))}

        <div className="pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2 px-3">AI FEATURES</p>
          
          {aiFeatures.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="w-full justify-start space-x-3 h-10 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setSelectedSection(item.id)}
              data-testid={`ai-${item.id}`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <div className="pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2 px-3">ORGANIZATION</p>
          
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              className="w-full justify-start space-x-3 h-10 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setSelectedSection(category.id)}
              data-testid={`category-${category.id}`}
            >
              <div className={cn("w-3 h-3 rounded-full", category.color)} />
              <span>{category.label}</span>
            </Button>
          ))}
        </div>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start space-x-3 h-10 text-muted-foreground hover:text-foreground hover:bg-muted"
          data-testid="button-settings"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Button>
      </div>
    </aside>
  );
}
