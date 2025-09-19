import { create } from 'zustand';
import { Email, User, EmailAccount, ActionItem } from '@shared/schema';

interface EmailState {
  user: User | null;
  emailAccounts: EmailAccount[];
  activeAccount: EmailAccount | null;
  emails: Email[];
  selectedEmail: Email | null;
  actionItems: ActionItem[];
  isLoading: boolean;
  isSidebarOpen: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setEmailAccounts: (accounts: EmailAccount[]) => void;
  setActiveAccount: (account: EmailAccount | null) => void;
  setEmails: (emails: Email[]) => void;
  setSelectedEmail: (email: Email | null) => void;
  setActionItems: (items: ActionItem[]) => void;
  setLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  updateEmail: (id: string, updates: Partial<Email>) => void;
  addEmail: (email: Email) => void;
}

export const useEmailStore = create<EmailState>((set, get) => ({
  user: null,
  emailAccounts: [],
  activeAccount: null,
  emails: [],
  selectedEmail: null,
  actionItems: [],
  isLoading: false,
  isSidebarOpen: true,

  setUser: (user) => set({ user }),
  setEmailAccounts: (emailAccounts) => set({ emailAccounts }),
  setActiveAccount: (activeAccount) => set({ activeAccount }),
  setEmails: (emails) => set({ emails }),
  setSelectedEmail: (selectedEmail) => set({ selectedEmail }),
  setActionItems: (actionItems) => set({ actionItems }),
  setLoading: (isLoading) => set({ isLoading }),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  
  updateEmail: (id, updates) => {
    const { emails } = get();
    const updatedEmails = emails.map(email => 
      email.id === id ? { ...email, ...updates } : email
    );
    set({ emails: updatedEmails });
    
    const { selectedEmail } = get();
    if (selectedEmail?.id === id) {
      set({ selectedEmail: { ...selectedEmail, ...updates } });
    }
  },

  addEmail: (email) => {
    const { emails } = get();
    set({ emails: [email, ...emails] });
  }
}));
