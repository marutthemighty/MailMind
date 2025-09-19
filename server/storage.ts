import { 
  users, 
  emailAccounts, 
  emails, 
  emailTemplates, 
  actionItems,
  type User, 
  type InsertUser,
  type EmailAccount,
  type InsertEmailAccount,
  type Email,
  type InsertEmail,
  type EmailTemplate,
  type InsertEmailTemplate,
  type ActionItem,
  type InsertActionItem
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;

  // Email account operations
  getEmailAccounts(userId: string): Promise<EmailAccount[]>;
  getEmailAccount(id: string): Promise<EmailAccount | undefined>;
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  updateEmailAccount(id: string, account: Partial<InsertEmailAccount>): Promise<EmailAccount>;

  // Email operations
  getEmails(accountId: string, limit?: number): Promise<Email[]>;
  getEmail(id: string): Promise<Email | undefined>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmail(id: string, email: Partial<InsertEmail>): Promise<Email>;
  getEmailsByCategory(accountId: string, category: string): Promise<Email[]>;
  getUnreadEmails(accountId: string): Promise<Email[]>;

  // Template operations
  getEmailTemplates(userId: string): Promise<EmailTemplate[]>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;

  // Action item operations
  getActionItems(userId: string): Promise<ActionItem[]>;
  createActionItem(item: InsertActionItem): Promise<ActionItem>;
  updateActionItem(id: string, item: Partial<InsertActionItem>): Promise<ActionItem>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, insertUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(insertUser)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getEmailAccounts(userId: string): Promise<EmailAccount[]> {
    return await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, userId));
  }

  async getEmailAccount(id: string): Promise<EmailAccount | undefined> {
    const [account] = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.id, id));
    return account || undefined;
  }

  async createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount> {
    const [emailAccount] = await db
      .insert(emailAccounts)
      .values(account)
      .returning();
    return emailAccount;
  }

  async updateEmailAccount(id: string, account: Partial<InsertEmailAccount>): Promise<EmailAccount> {
    const [emailAccount] = await db
      .update(emailAccounts)
      .set(account)
      .where(eq(emailAccounts.id, id))
      .returning();
    return emailAccount;
  }

  async getEmails(accountId: string, limit: number = 50): Promise<Email[]> {
    return await db
      .select()
      .from(emails)
      .where(eq(emails.accountId, accountId))
      .orderBy(desc(emails.receivedAt))
      .limit(limit);
  }

  async getEmail(id: string): Promise<Email | undefined> {
    const [email] = await db
      .select()
      .from(emails)
      .where(eq(emails.id, id));
    return email || undefined;
  }

  async createEmail(email: InsertEmail): Promise<Email> {
    const [insertedEmail] = await db
      .insert(emails)
      .values(email)
      .returning();
    return insertedEmail;
  }

  async updateEmail(id: string, email: Partial<InsertEmail>): Promise<Email> {
    const [updatedEmail] = await db
      .update(emails)
      .set(email)
      .where(eq(emails.id, id))
      .returning();
    return updatedEmail;
  }

  async getEmailsByCategory(accountId: string, category: string): Promise<Email[]> {
    return await db
      .select()
      .from(emails)
      .where(and(eq(emails.accountId, accountId), eq(emails.category, category)))
      .orderBy(desc(emails.receivedAt));
  }

  async getUnreadEmails(accountId: string): Promise<Email[]> {
    return await db
      .select()
      .from(emails)
      .where(and(eq(emails.accountId, accountId), eq(emails.isRead, false)))
      .orderBy(desc(emails.receivedAt));
  }

  async getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
    return await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.userId, userId));
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [emailTemplate] = await db
      .insert(emailTemplates)
      .values(template)
      .returning();
    return emailTemplate;
  }

  async getActionItems(userId: string): Promise<ActionItem[]> {
    return await db
      .select()
      .from(actionItems)
      .where(eq(actionItems.userId, userId))
      .orderBy(desc(actionItems.createdAt));
  }

  async createActionItem(item: InsertActionItem): Promise<ActionItem> {
    const [actionItem] = await db
      .insert(actionItems)
      .values(item)
      .returning();
    return actionItem;
  }

  async updateActionItem(id: string, item: Partial<InsertActionItem>): Promise<ActionItem> {
    const [actionItem] = await db
      .update(actionItems)
      .set(item)
      .where(eq(actionItems.id, id))
      .returning();
    return actionItem;
  }
}

export const storage = new DatabaseStorage();
