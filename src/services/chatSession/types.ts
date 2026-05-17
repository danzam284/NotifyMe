import type { LLMMessage, SendTextOptions } from "../llm/types";

export type CreateChatSessionOptions = {
  systemPrompt?: string;
};

export type SendChatMessageOptions = SendTextOptions & {
  maxMessages?: number;
};

export type ChatResponse = {
  sessionId: string;
  response: string;
  messages: LLMMessage[];
};

export interface ChatSessionData {
  id: string;
  messages: LLMMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSessionStore {
  save(session: ChatSessionData): Promise<void>;
  get(id: string): Promise<ChatSessionData | null>;
  delete(id: string): Promise<void>;
}