import type { LLMMessage } from "../llm/types";
import type { ChatSession } from "./types";

export interface ChatSessionStore {
  create(initialMessages?: LLMMessage[]): Promise<ChatSession>;

  get(sessionId: string): Promise<ChatSession | null>;

  addMessage(
    sessionId: string,
    message: LLMMessage
  ): Promise<ChatSession>;

  setMessages(
    sessionId: string,
    messages: LLMMessage[]
  ): Promise<ChatSession>;

  delete(sessionId: string): Promise<void>;
}

export class InMemoryChatSessionStore implements ChatSessionStore {
  private sessions = new Map<string, ChatSession>();

  async create(initialMessages: LLMMessage[] = []): Promise<ChatSession> {
    const now = new Date();

    const session: ChatSession = {
      id: crypto.randomUUID(),
      messages: initialMessages,
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(session.id, session);

    return session;
  }

  async get(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async addMessage(
    sessionId: string,
    message: LLMMessage
  ): Promise<ChatSession> {
    const session = await this.getRequiredSession(sessionId);

    const updatedSession: ChatSession = {
      ...session,
      messages: [...session.messages, message],
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, updatedSession);

    return updatedSession;
  }

  async setMessages(
    sessionId: string,
    messages: LLMMessage[]
  ): Promise<ChatSession> {
    const session = await this.getRequiredSession(sessionId);

    const updatedSession: ChatSession = {
      ...session,
      messages,
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, updatedSession);

    return updatedSession;
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  private async getRequiredSession(sessionId: string): Promise<ChatSession> {
    const session = await this.get(sessionId);

    if (!session) {
      throw new Error(`Chat session not found: ${sessionId}`);
    }

    return session;
  }
}