import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { gmailService } from "./services/gmailService";
import { summarizeEmail, generateReply, improveEmailWriting, categorizeEmails } from "./services/geminiService";
import { insertUserSchema, insertEmailAccountSchema, insertEmailSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.get('/api/auth/google', async (req, res) => {
    try {
      const authUrl = await gmailService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get auth URL' });
    }
  });

  app.post('/api/auth/callback', async (req, res) => {
    try {
      const { code } = req.body;
      const { accessToken, refreshToken, userInfo } = await gmailService.handleAuthCallback(code);

      // Create or update user
      let user = await storage.getUserByEmail(userInfo.email);
      if (!user) {
        user = await storage.createUser({
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          accessToken,
          refreshToken,
          tokenExpiry: new Date(Date.now() + 3600000) // 1 hour
        });
      } else {
        user = await storage.updateUser(user.id, {
          accessToken,
          refreshToken,
          tokenExpiry: new Date(Date.now() + 3600000)
        });
      }

      // Create email account
      let emailAccount = await storage.getEmailAccounts(user.id);
      const gmailAccount = emailAccount.find(acc => acc.email === userInfo.email);
      
      if (!gmailAccount) {
        await storage.createEmailAccount({
          userId: user.id,
          email: userInfo.email,
          provider: 'gmail',
          accessToken,
          refreshToken,
          tokenExpiry: new Date(Date.now() + 3600000)
        });
      }

      res.json({ user, success: true });
    } catch (error) {
      console.error('Auth callback error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  // User routes
  app.get('/api/user/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  // Email account routes
  app.get('/api/accounts/:userId', async (req, res) => {
    try {
      const accounts = await storage.getEmailAccounts(req.params.userId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get email accounts' });
    }
  });

  // Email routes
  app.get('/api/emails/:accountId', async (req, res) => {
    try {
      const { limit = '50' } = req.query;
      
      // First try to get from database
      let emails = await storage.getEmails(req.params.accountId, parseInt(limit as string));
      
      // If no emails in database, fetch from Gmail
      if (emails.length === 0) {
        const gmailEmails = await gmailService.getEmails(req.params.accountId, parseInt(limit as string));
        
        // Store emails in database and get AI analysis
        for (const emailData of gmailEmails) {
          try {
            // Get AI summary
            const summary = await summarizeEmail(emailData.body, emailData.subject);
            
            const email = await storage.createEmail({
              ...emailData,
              aiSummary: summary.summary,
              actionItems: summary.actionItems,
              sentiment: summary.sentiment,
              sentimentScore: summary.sentimentScore,
              priority: summary.priority,
              category: summary.category
            });
            
            emails.push(email);
          } catch (error) {
            console.error('Error processing email:', error);
            // Store email without AI analysis
            const email = await storage.createEmail(emailData);
            emails.push(email);
          }
        }
      }

      res.json(emails);
    } catch (error) {
      console.error('Error getting emails:', error);
      res.status(500).json({ message: 'Failed to get emails' });
    }
  });

  app.get('/api/emails/:accountId/unread', async (req, res) => {
    try {
      const emails = await storage.getUnreadEmails(req.params.accountId);
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get unread emails' });
    }
  });

  app.get('/api/emails/:accountId/category/:category', async (req, res) => {
    try {
      const emails = await storage.getEmailsByCategory(req.params.accountId, req.params.category);
      res.json(emails);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get emails by category' });
    }
  });

  app.get('/api/email/:id', async (req, res) => {
    try {
      const email = await storage.getEmail(req.params.id);
      if (!email) {
        return res.status(404).json({ message: 'Email not found' });
      }
      res.json(email);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get email' });
    }
  });

  app.patch('/api/email/:id', async (req, res) => {
    try {
      const email = await storage.updateEmail(req.params.id, req.body);
      res.json(email);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update email' });
    }
  });

  // AI routes
  app.post('/api/ai/summarize', async (req, res) => {
    try {
      const { emailContent, subject } = req.body;
      const summary = await summarizeEmail(emailContent, subject);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: 'Failed to summarize email' });
    }
  });

  app.post('/api/ai/reply', async (req, res) => {
    try {
      const { originalEmail, originalSubject, context, tone = 'professional' } = req.body;
      const reply = await generateReply(originalEmail, originalSubject, context, tone);
      res.json(reply);
    } catch (error) {
      res.status(500).json({ message: 'Failed to generate reply' });
    }
  });

  app.post('/api/ai/improve', async (req, res) => {
    try {
      const { emailContent, targetTone } = req.body;
      const improvedContent = await improveEmailWriting(emailContent, targetTone);
      res.json({ improvedContent });
    } catch (error) {
      res.status(500).json({ message: 'Failed to improve email' });
    }
  });

  app.post('/api/ai/categorize', async (req, res) => {
    try {
      const { emails } = req.body;
      const categorized = await categorizeEmails(emails);
      res.json(categorized);
    } catch (error) {
      res.status(500).json({ message: 'Failed to categorize emails' });
    }
  });

  // Email sending
  app.post('/api/send', async (req, res) => {
    try {
      const { accountId, to, subject, body } = req.body;
      await gmailService.sendEmail(accountId, to, subject, body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to send email' });
    }
  });

  // Template routes
  app.get('/api/templates/:userId', async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates(req.params.userId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get templates' });
    }
  });

  app.post('/api/templates', async (req, res) => {
    try {
      const template = await storage.createEmailTemplate(req.body);
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create template' });
    }
  });

  // Action items routes
  app.get('/api/action-items/:userId', async (req, res) => {
    try {
      const items = await storage.getActionItems(req.params.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get action items' });
    }
  });

  app.post('/api/action-items', async (req, res) => {
    try {
      const item = await storage.createActionItem(req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create action item' });
    }
  });

  app.patch('/api/action-items/:id', async (req, res) => {
    try {
      const item = await storage.updateActionItem(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update action item' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
