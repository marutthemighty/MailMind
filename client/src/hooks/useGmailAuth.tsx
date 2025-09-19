import { useState, useEffect } from 'react';
import { useEmailStore } from '@/store/emailStore';
import { apiRequest } from '@/lib/queryClient';

export function useGmailAuth() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { user, setUser } = useEmailStore();

  const initiateAuth = async () => {
    try {
      setIsAuthenticating(true);
      const response = await apiRequest('GET', '/api/auth/google');
      const data = await response.json();
      
      // Open popup for authentication
      const popup = window.open(
        data.authUrl,
        'gmail_auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Listen for popup messages
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GMAIL_AUTH_SUCCESS') {
          const { code } = event.data;
          
          try {
            const callbackResponse = await apiRequest('POST', '/api/auth/callback', { code });
            const result = await callbackResponse.json();
            
            setUser(result.user);
            popup?.close();
            window.removeEventListener('message', messageListener);
          } catch (error) {
            console.error('Auth callback failed:', error);
          }
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setIsAuthenticating(false);
        }
      }, 1000);

    } catch (error) {
      console.error('Failed to initiate auth:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
  }, [setUser]);

  // Store user when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  return {
    user,
    isAuthenticating,
    initiateAuth,
    logout,
    isAuthenticated: !!user
  };
}
