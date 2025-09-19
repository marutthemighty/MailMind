import { apiRequest } from './queryClient';
import { Email, EmailAccount } from '@shared/schema';

export async function getEmailAccounts(userId: string): Promise<EmailAccount[]> {
  const response = await apiRequest('GET', `/api/accounts/${userId}`);
  return response.json();
}

export async function getEmails(accountId: string, limit: number = 50): Promise<Email[]> {
  const response = await apiRequest('GET', `/api/emails/${accountId}?limit=${limit}`);
  return response.json();
}

export async function getUnreadEmails(accountId: string): Promise<Email[]> {
  const response = await apiRequest('GET', `/api/emails/${accountId}/unread`);
  return response.json();
}

export async function getEmailsByCategory(accountId: string, category: string): Promise<Email[]> {
  const response = await apiRequest('GET', `/api/emails/${accountId}/category/${category}`);
  return response.json();
}

export async function getEmail(id: string): Promise<Email> {
  const response = await apiRequest('GET', `/api/email/${id}`);
  return response.json();
}

export async function updateEmail(id: string, updates: Partial<Email>): Promise<Email> {
  const response = await apiRequest('PATCH', `/api/email/${id}`, updates);
  return response.json();
}

export async function sendEmail(accountId: string, to: string, subject: string, body: string): Promise<void> {
  await apiRequest('POST', '/api/send', { accountId, to, subject, body });
}

export async function summarizeEmail(emailContent: string, subject: string) {
  const response = await apiRequest('POST', '/api/ai/summarize', { emailContent, subject });
  return response.json();
}

export async function generateReply(originalEmail: string, originalSubject: string, context: string, tone: string = 'professional') {
  const response = await apiRequest('POST', '/api/ai/reply', { originalEmail, originalSubject, context, tone });
  return response.json();
}

export async function improveEmailWriting(emailContent: string, targetTone: string) {
  const response = await apiRequest('POST', '/api/ai/improve', { emailContent, targetTone });
  return response.json();
}
