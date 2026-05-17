import type { ChatSessionData, ChatSessionStore } from "../types";

export class InMemoryChatSessionStore implements ChatSessionStore {
  private sessions = new Map<string, ChatSessionData>();

  async save(session: ChatSessionData): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async get(id: string): Promise<ChatSessionData | null> {
    return this.sessions.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}