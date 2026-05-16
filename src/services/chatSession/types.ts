import type { LLMMessage, SendTextOptions } from '../llm/types';

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

export type ChatSession = {
  id: string;
  messages: LLMMessage[];
  createdAt: Date;
  updatedAt: Date;
};