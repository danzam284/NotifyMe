import { describe, test, expect, beforeEach } from "bun:test";
import { MockProvider } from "../../../../services/llm/providers/mockProvider";
import type { LLMMessage } from "../../../../services/llm/types";

describe("MockProvider", () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  test("should identify itself as 'mock'", () => {
    expect(provider.name).toBe("mock");
  });

  describe("sendText", () => {
    test("should echo back the prompt in the response string", async () => {
      const prompt = "What is the meaning of life?";
      const response = await provider.sendText(prompt);
      
      expect(response).toBe(`Mock response for: ${prompt}`);
    });
  });

  describe("sendMessages", () => {
    test("should respond based on the last user message in the array", async () => {
      const messages: LLMMessage[] = [
        { role: "system", content: "You are a helpful assistant" },
        { role: "user", content: "First message" },
        { role: "assistant", content: "First response" },
        { role: "user", content: "Second message" },
      ];

      const response = await provider.sendMessages(messages);
      
      expect(response).toBe("Mock chat response for: Second message");
    });

    test("should handle a conversation with only a system prompt", async () => {
      const messages: LLMMessage[] = [
        { role: "system", content: "System only test" }
      ];

      const response = await provider.sendMessages(messages);
      
      // Based on your code: lastUserMessage?.content ?? ""
      expect(response).toBe("Mock chat response for: ");
    });

    test("should handle an entirely empty message array", async () => {
      const response = await provider.sendMessages([]);
      expect(response).toBe("Mock chat response for: ");
    });
  });
});