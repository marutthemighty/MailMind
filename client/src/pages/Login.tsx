import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGmailAuth } from "@/hooks/useGmailAuth";
import { Mail, Sparkles, Shield, Zap } from "lucide-react";

export default function Login() {
  const { initiateAuth, isAuthenticating } = useGmailAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Features */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">MailAssist Pro</h1>
                <p className="text-muted-foreground">Your AI-Powered Email Assistant</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Transform your email experience with intelligent summarization, AI-powered replies, 
              and seamless voice integration. Get more done in less time.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">AI Email Summarization</h3>
                <p className="text-sm text-muted-foreground">Get key points, action items, and sentiment analysis instantly</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-secondary mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">Smart Reply Generation</h3>
                <p className="text-sm text-muted-foreground">AI-crafted responses that match your tone and style</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-accent mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">Voice-to-Text Composition</h3>
                <p className="text-sm text-muted-foreground">Compose emails hands-free with advanced voice recognition</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Card */}
        <div className="flex justify-center lg:justify-end">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Connect your Gmail account to get started with AI-powered email management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={initiateAuth}
                disabled={isAuthenticating}
                className="w-full h-12 text-base"
                data-testid="button-gmail-auth"
              >
                {isAuthenticating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Gmail</span>
                  </div>
                )}
              </Button>
              
              <div className="text-center text-xs text-muted-foreground">
                By connecting your account, you agree to our secure data handling practices. 
                We only access emails you explicitly choose to analyze.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
