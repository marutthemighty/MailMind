import { google } from 'googleapis';
import { storage } from '../storage';

export class GmailService {
  private getOAuth2Client(accessToken: string, refreshToken?: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return oauth2Client;
  }

  async getAuthUrl(): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async handleAuthCallback(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    userInfo: any;
  }> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getAccessToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      userInfo: userInfo.data
    };
  }

  async getEmails(accountId: string, maxResults: number = 50): Promise<any[]> {
    const account = await storage.getEmailAccount(accountId);
    if (!account) {
      throw new Error('Email account not found');
    }

    const oauth2Client = this.getOAuth2Client(account.accessToken!, account.refreshToken!);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      // Get message list
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox'
      });

      const messages = response.data.messages || [];
      const emails = [];

      // Get detailed message info
      for (const message of messages.slice(0, 10)) { // Limit to 10 for performance
        try {
          const messageDetail = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          });

          const email = this.parseGmailMessage(messageDetail.data);
          if (email) {
            email.accountId = accountId;
            emails.push(email);
          }
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
        }
      }

      return emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw new Error('Failed to fetch emails from Gmail');
    }
  }

  async sendEmail(accountId: string, to: string, subject: string, body: string): Promise<void> {
    const account = await storage.getEmailAccount(accountId);
    if (!account) {
      throw new Error('Email account not found');
    }

    const oauth2Client = this.getOAuth2Client(account.accessToken!, account.refreshToken!);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');

    const encodedEmail = Buffer.from(email).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
  }

  private parseGmailMessage(message: any): any {
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    let body = '';
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString();
    } else if (message.payload?.parts) {
      // Handle multipart messages
      const textPart = message.payload.parts.find((part: any) => 
        part.mimeType === 'text/plain' || part.mimeType === 'text/html'
      );
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString();
      }
    }

    return {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader('subject'),
      from: getHeader('from'),
      to: getHeader('to'),
      cc: getHeader('cc'),
      bcc: getHeader('bcc'),
      body: body,
      snippet: message.snippet || '',
      isRead: !message.labelIds?.includes('UNREAD'),
      isStarred: message.labelIds?.includes('STARRED'),
      labels: message.labelIds || [],
      receivedAt: new Date(parseInt(message.internalDate))
    };
  }
}

export const gmailService = new GmailService();
