import type { LLMMessage, LLMProvider } from "../llm/types";

import {
  type ChatSessionStore,
  InMemoryChatSessionStore,
} from "./store";
import { createLLMProvider } from "../llm/providers/factory";
import type { ChatResponse, ChatSession, CreateChatSessionOptions, SendChatMessageOptions } from "./types";

const DEFAULT_MAX_MESSAGES = 20;

export class ChatSessionService {
  constructor(
    private provider: LLMProvider = createLLMProvider("groq"),
    private store: ChatSessionStore = new InMemoryChatSessionStore()
  ) {}

  async createSession(
    options: CreateChatSessionOptions = {}
  ): Promise<ChatSession> {
    const initialMessages: LLMMessage[] = options.systemPrompt
      ? [{ role: "system", content: options.systemPrompt }]
      : [];

    return this.store.create(initialMessages);
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.store.get(sessionId);
  }

  async sendMessage(
    sessionId: string,
    userMessage: string,
    options: SendChatMessageOptions = {}
  ): Promise<ChatResponse> {
    const trimmedMessage = userMessage.trim();

    if (!trimmedMessage) {
      throw new Error("User message cannot be empty");
    }

    let session = await this.store.addMessage(sessionId, {
      role: "user",
      content: trimmedMessage,
    });

    const messagesForModel = this.limitMessages(
      session.messages,
      options.maxMessages ?? DEFAULT_MAX_MESSAGES
    );

    const assistantResponse = await this.provider.sendMessages(
      messagesForModel,
      options
    );

    session = await this.store.addMessage(sessionId, {
      role: "assistant",
      content: assistantResponse,
    });

    return {
      sessionId,
      response: assistantResponse,
      messages: session.messages,
    };
  }

  async startSessionAndSendMessage(
    userMessage: string,
    options: CreateChatSessionOptions & SendChatMessageOptions = {}
  ): Promise<ChatResponse> {
    const session = await this.createSession({
      systemPrompt: options.systemPrompt,
    });

    return this.sendMessage(session.id, userMessage, options);
  }

  async deleteSession(sessionId: string): Promise<void> {
    return this.store.delete(sessionId);
  }

  private limitMessages(
    messages: LLMMessage[],
    maxMessages: number
  ): LLMMessage[] {
    const systemMessage = messages.find((message) => message.role === "system");

    const nonSystemMessages = messages.filter(
      (message) => message.role !== "system"
    );

    const recentMessages = nonSystemMessages.slice(-maxMessages);

    return systemMessage
      ? [systemMessage, ...recentMessages]
      : recentMessages;
  }
}

export const chatSessionService = new ChatSessionService();