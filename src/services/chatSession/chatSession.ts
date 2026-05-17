import type { LLMMessage } from "../llm/types";
import type { ChatResponse, SendChatMessageOptions } from "./types";

export interface IChatSessionContext {
  save(id: string, messages: LLMMessage[]): Promise<void>;
  delete(id: string): Promise<void>;
  executeLLM(messages: LLMMessage[], options?: SendChatMessageOptions): Promise<string>;
}

export class ChatSession {
  constructor(
    public readonly id: string,
    public readonly messages: LLMMessage[],
    private readonly context: IChatSessionContext,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  async sendMessage(userMessage: string, options: SendChatMessageOptions = {}): Promise<ChatResponse> {
    const trimmed = userMessage.trim();
    if (!trimmed) {
      throw new Error("User message cannot be empty");
    }

    this.messages.push({ role: "user", content: trimmed });
    this.updatedAt = new Date();
    await this.context.save(this.id, this.messages);

    const messagesForModel = this.limitMessages(this.messages, options.maxMessages ?? 20);
    const assistantResponse = await this.context.executeLLM(messagesForModel, options);

    this.messages.push({ role: "assistant", content: assistantResponse });
    this.updatedAt = new Date();
    await this.context.save(this.id, this.messages);

    return {
      sessionId: this.id,
      response: assistantResponse,
      messages: this.messages,
    };
  }

  async delete(): Promise<void> {
    await this.context.delete(this.id);
  }

  private limitMessages(messages: LLMMessage[], maxMessages: number): LLMMessage[] {
    const systemMessage = messages.find((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");
    const recentMessages = nonSystemMessages.slice(-maxMessages);

    return systemMessage ? [systemMessage, ...recentMessages] : recentMessages;
  }
}