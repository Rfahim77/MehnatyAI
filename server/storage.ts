import { type Session, type Card, type ChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: Session): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  addCardToSession(sessionId: string, card: Card): Promise<void>;
  addMessageToSession(sessionId: string, message: ChatMessage): Promise<void>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;

  constructor() {
    this.sessions = new Map();
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(session: Session): Promise<Session> {
    this.sessions.set(session.id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updated = { ...session, ...updates, lastActivity: Date.now() };
    this.sessions.set(id, updated);
    return updated;
  }

  async addCardToSession(sessionId: string, card: Card): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.cards.push(card);
      session.lastActivity = Date.now();
      this.sessions.set(sessionId, session);
    }
  }

  async addMessageToSession(sessionId: string, message: ChatMessage): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (!session.messages) {
        session.messages = [];
      }
      session.messages.push(message);
      session.lastActivity = Date.now();
      this.sessions.set(sessionId, session);
    }
  }
}

export const storage = new MemStorage();
