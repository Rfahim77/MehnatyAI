import { 
  type Session, 
  type Card, 
  type ChatMessage, 
  sessions, 
  messages, 
  cards, 
  savedResumes,
  users,
  subscriptions,
  usageTracking,
  type InsertSession, 
  type InsertMessage, 
  type InsertCard, 
  type InsertSavedResume,
  type User,
  type UpsertUser,
  type SelectSubscription,
  type InsertSubscription,
  type SelectUsageTracking,
  type InsertUsageTracking
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, asc, desc, isNull, and, gte, lt } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  // Session operations
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: Session): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  addCardToSession(sessionId: string, card: Card): Promise<void>;
  addMessageToSession(sessionId: string, message: ChatMessage): Promise<void>;
  getSessionMessages(sessionId: string): Promise<ChatMessage[]>;
  getSessionCards(sessionId: string): Promise<Card[]>;
  saveResume(sessionId: string, name: string, resumeJson: any, targetRole?: string): Promise<void>;
  getSavedResumes(sessionId: string): Promise<any[]>;
  linkSessionToUser(sessionId: string, userId: string): Promise<void>;
  getUserSessions(userId: string): Promise<Session[]>;
  
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(userId: string, profileData: Partial<User>): Promise<User | undefined>;
  
  // Subscription operations
  getUserSubscription(userId: string): Promise<SelectSubscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<SelectSubscription>;
  updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<SelectSubscription | undefined>;
  
  // Usage tracking operations
  getUserUsage(userId: string): Promise<SelectUsageTracking | undefined>;
  incrementMessageCount(userId: string): Promise<void>;
  incrementReviewCount(userId: string): Promise<void>;
  resetDailyMessages(userId: string): Promise<void>;
  resetMonthlyReviews(userId: string): Promise<void>;
}

export class PostgresStorage implements IStorage {
  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    if (!session) return undefined;

    const sessionMessages = await this.getSessionMessages(id);
    const sessionCards = await this.getSessionCards(id);

    return {
      id: session.id,
      resumeJson: session.resumeJson ?? undefined,
      tone: session.tone ?? undefined,
      targetJob: session.targetJob ?? undefined,
      jdText: session.jdText ?? undefined,
      cards: sessionCards,
      messages: sessionMessages,
      language: session.language as "ar" | "en",
      createdAt: session.createdAt.getTime(),
      lastActivity: session.lastActivity.getTime()
    };
  }

  async createSession(session: Session): Promise<Session> {
    await db.insert(sessions).values({
      id: session.id,
      resumeJson: session.resumeJson ?? null,
      tone: session.tone ?? null,
      targetJob: session.targetJob ?? null,
      jdText: session.jdText ?? null,
      language: session.language
    });
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const updateData: any = { lastActivity: new Date() };
    if (updates.resumeJson !== undefined) updateData.resumeJson = updates.resumeJson ?? null;
    if (updates.tone !== undefined) updateData.tone = updates.tone ?? null;
    if (updates.targetJob !== undefined) updateData.targetJob = updates.targetJob ?? null;
    if (updates.jdText !== undefined) updateData.jdText = updates.jdText ?? null;
    if (updates.language !== undefined) updateData.language = updates.language;

    await db.update(sessions)
      .set(updateData)
      .where(eq(sessions.id, id));

    return this.getSession(id);
  }

  async addCardToSession(sessionId: string, card: Card): Promise<void> {
    const insertData: InsertCard = {
      id: card.id,
      sessionId,
      messageId: null,
      type: card.type,
      title: card.title,
      content: card.content,
      metadata: card.metadata ?? null
    };

    await db.insert(cards).values(insertData);
    await db.update(sessions).set({ lastActivity: new Date() }).where(eq(sessions.id, sessionId));
  }

  async addMessageToSession(sessionId: string, message: ChatMessage): Promise<void> {
    try {
      const insertData: InsertMessage = {
        id: message.id,
        sessionId,
        role: message.role,
        content: message.content
      };

      await db.insert(messages).values(insertData);

      if (message.cards && message.cards.length > 0) {
        for (const card of message.cards) {
          const cardData: InsertCard = {
            id: card.id,
            sessionId,
            messageId: message.id,
            type: card.type,
            title: card.title,
            content: card.content,
            metadata: card.metadata ?? null
          };
          await db.insert(cards).values(cardData);
        }
      }

      await db.update(sessions).set({ lastActivity: new Date() }).where(eq(sessions.id, sessionId));
    } catch (error) {
      console.error(`Error adding message to session ${sessionId}:`, error);
      throw error;
    }
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const dbMessages = await db.select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.timestamp));
    
    const result: ChatMessage[] = [];
    for (const msg of dbMessages) {
      const msgCards = await db.select().from(cards)
        .where(eq(cards.messageId, msg.id))
        .orderBy(asc(cards.createdAt));

      result.push({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: msg.timestamp.getTime(),
        cards: msgCards.map(c => ({
          id: c.id,
          type: c.type as any,
          title: c.title,
          content: c.content,
          metadata: c.metadata ?? undefined,
          createdAt: c.createdAt.getTime()
        }))
      });
    }

    return result;
  }

  async getSessionCards(sessionId: string): Promise<Card[]> {
    const dbCards = await db.select()
      .from(cards)
      .where(eq(cards.sessionId, sessionId))
      .orderBy(asc(cards.createdAt));
    
    return dbCards.map(c => ({
      id: c.id,
      type: c.type as any,
      title: c.title,
      content: c.content,
      metadata: c.metadata ?? undefined,
      createdAt: c.createdAt.getTime()
    }));
  }

  async saveResume(sessionId: string, name: string, resumeJson: any, targetRole?: string): Promise<void> {
    await db.insert(savedResumes).values({
      id: randomUUID(),
      sessionId,
      name,
      resumeJson,
      targetRole: targetRole ?? null,
      version: 1
    });
  }

  async getSavedResumes(sessionId: string): Promise<any[]> {
    const resumes = await db.select().from(savedResumes).where(eq(savedResumes.sessionId, sessionId));
    return resumes.map(r => ({
      id: r.id,
      name: r.name,
      resumeJson: r.resumeJson,
      version: r.version,
      targetRole: r.targetRole,
      createdAt: r.createdAt.getTime(),
      updatedAt: r.updatedAt.getTime()
    }));
  }

  async linkSessionToUser(sessionId: string, userId: string): Promise<void> {
    // Link the session to the user (migrate anonymous session to authenticated user)
    await db
      .update(sessions)
      .set({ userId })
      .where(eq(sessions.id, sessionId));
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    // Get all sessions linked to this user, ordered by last activity (most recent first)
    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.lastActivity));
    return userSessions;
  }

  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    // Create default free subscription for new users
    const existingSubscription = await this.getUserSubscription(user.id);
    if (!existingSubscription) {
      await this.createSubscription({
        id: randomUUID(),
        userId: user.id,
        plan: "free",
        status: "active",
        stripeSubscriptionId: null,
        currentPeriodEnd: null
      });
      
      // Create usage tracking for new user
      await db.insert(usageTracking).values({
        id: randomUUID(),
        userId: user.id,
        messagesCount: 0,
        reviewsCount: 0
      });
    }
    
    return user;
  }

  async updateUserProfile(userId: string, profileData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...profileData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Subscription operations
  async getUserSubscription(userId: string): Promise<SelectSubscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<SelectSubscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateSubscription(id: string, updates: Partial<InsertSubscription>): Promise<SelectSubscription | undefined> {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  // Usage tracking operations
  async getUserUsage(userId: string): Promise<SelectUsageTracking | undefined> {
    const [usage] = await db.select().from(usageTracking).where(eq(usageTracking.userId, userId));
    return usage;
  }

  async incrementMessageCount(userId: string): Promise<void> {
    // Check if reset is needed (daily)
    const usage = await this.getUserUsage(userId);
    if (usage) {
      const now = new Date();
      const lastReset = new Date(usage.lastMessageReset);
      const isNewDay = now.toDateString() !== lastReset.toDateString();
      
      if (isNewDay) {
        await this.resetDailyMessages(userId);
      } else {
        await db
          .update(usageTracking)
          .set({ 
            messagesCount: usage.messagesCount + 1,
            updatedAt: new Date()
          })
          .where(eq(usageTracking.userId, userId));
      }
    }
  }

  async incrementReviewCount(userId: string): Promise<void> {
    // Check if reset is needed (monthly)
    const usage = await this.getUserUsage(userId);
    if (usage) {
      const now = new Date();
      const lastReset = new Date(usage.lastReviewReset);
      const isNewMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
      
      if (isNewMonth) {
        await this.resetMonthlyReviews(userId);
      } else {
        await db
          .update(usageTracking)
          .set({ 
            reviewsCount: usage.reviewsCount + 1,
            updatedAt: new Date()
          })
          .where(eq(usageTracking.userId, userId));
      }
    }
  }

  async resetDailyMessages(userId: string): Promise<void> {
    await db
      .update(usageTracking)
      .set({ 
        messagesCount: 1,
        lastMessageReset: new Date(),
        updatedAt: new Date()
      })
      .where(eq(usageTracking.userId, userId));
  }

  async resetMonthlyReviews(userId: string): Promise<void> {
    await db
      .update(usageTracking)
      .set({ 
        reviewsCount: 1,
        lastReviewReset: new Date(),
        updatedAt: new Date()
      })
      .where(eq(usageTracking.userId, userId));
  }
}

export const storage = new PostgresStorage();
