import { ChatSession, type IChatSessionContext } from "./chatSession";
import type { LLMProvider, LLMMessage } from "../llm/types";
import type { ChatSessionStore, CreateChatSessionOptions } from "./types";
import { createLLMProvider } from "../llm/providers/factory";
import { BunSqliteService } from "../database/sqliteService";
import { SqliteChatSessionStore } from "./store/sqliteStore";

export class ChatSessionService {
  constructor(
    private readonly provider: LLMProvider,
    private readonly store: ChatSessionStore
  ) {}

  async createSession(options: CreateChatSessionOptions = {}): Promise<ChatSession> {
    const id = crypto.randomUUID();
    const initialMessages: LLMMessage[] = options.systemPrompt
      ? [{ role: "system", content: options.systemPrompt }]
      : [];

    const session = new ChatSession(id, initialMessages, this.createRuntimeContext());
    
    await this.store.save({
      id,
      messages: initialMessages,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });

    return session;
  }

  async getSession(id: string): Promise<ChatSession | null> {
    const data = await this.store.get(id);
    if (!data) return null;

    return new ChatSession(
      data.id,
      data.messages,
      this.createRuntimeContext(),
      data.createdAt,
      data.updatedAt
    );
  }

  private createRuntimeContext(): IChatSessionContext {
    return {
      save: async (id, messages) => {
        const existing = await this.store.get(id);
        await this.store.save({
          id,
          messages,
          createdAt: existing?.createdAt ?? new Date(),
          updatedAt: new Date(),
        });
      },
      delete: async (id) => {
        await this.store.delete(id);
      },
      executeLLM: async (messages, options) => {
        return this.provider.sendMessages(messages, options);
      },
    };
  }
}

const dbService = new BunSqliteService("llm_chat_sessions.db");
const sqliteStore = new SqliteChatSessionStore(dbService);
const defaultProvider = createLLMProvider("groq");

export const chatSessionService = new ChatSessionService(defaultProvider, sqliteStore);