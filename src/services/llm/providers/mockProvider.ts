import type { LLMMessage, LLMProvider, SendTextOptions } from "../types";

export class MockProvider implements LLMProvider {
  name = "mock" as const;

  async sendText(
    prompt: string,
    _options?: SendTextOptions
  ): Promise<string> {
    return `Mock response for: ${prompt}`;
  }

  async sendMessages(
    messages: LLMMessage[],
    _options?: SendTextOptions
  ): Promise<string> {
    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    return `Mock chat response for: ${lastUserMessage?.content ?? ""}`;
  }
}