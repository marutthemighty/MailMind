import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEmailStore } from "@/store/emailStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  Search, 
  Bot, 
  Mic, 
  Plus,
  Bell
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { EmailList } from "./EmailList";
import { EmailViewer } from "./EmailViewer";
import { RightSidebar } from "./RightSidebar";
import { getEmailAccounts } from "@/lib/gmail";

export function EmailLayout() {
  const { 
    user, 
    emailAccounts, 
    setEmailAccounts, 
    activeAccount, 
    setActiveAccount,
    isSidebarOpen, 
    setSidebarOpen 
  } = useEmailStore();
  
  const isMobile = useIsMobile();

  // Fetch email accounts
  const { data: accounts } = useQuery({
    queryKey: ['/api/accounts', user?.id],
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (accounts) {
      setEmailAccounts(accounts);
      if (!activeAccount && accounts.length > 0) {
        setActiveAccount(accounts[0]);
      }
    }
  }, [accounts, setEmailAccounts, activeAccount, setActiveAccount]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar className={isMobile && !isSidebarOpen ? "hidden" : ""} />
      
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              data-testid="button-toggle-sidebar"
            >
              <Menu className="w-4 h-4" />
            </Button>
            
            <div className="relative">
              <Input
                type="search"
                placeholder="Search emails or ask AI..."
                className="w-80 pl-10 pr-4 bg-muted border-input"
                data-testid="input-search"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* AI Assistant Toggle */}
            <Button
              variant="secondary"
              className="flex items-center space-x-2"
              data-testid="button-ai-assistant"
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm font-medium">AI Assistant</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </Button>

            {/* Voice Controls */}
            <Button variant="ghost" size="sm" title="Voice Commands" data-testid="button-voice">
              <Mic className="w-4 h-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" title="Notifications" data-testid="button-notifications">
              <Bell className="w-4 h-4" />
            </Button>

            {/* Compose Email */}
            <Button className="flex items-center space-x-2" data-testid="button-compose">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Compose</span>
            </Button>

            {/* User Menu */}
            <Avatar className="w-8 h-8 cursor-pointer" data-testid="avatar-user">
              <AvatarImage src={user?.picture} />
              <AvatarFallback>
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Email Content Area */}
        <div className="flex-1 flex overflow-hidden">
          <EmailList />
          <EmailViewer />
          <RightSidebar />
        </div>
      </main>
    </div>
  );
}
