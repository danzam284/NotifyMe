import { describe, test, expect } from "bun:test";
import { createLLMProvider } from "../../../../services/llm/providers/factory";
import { GroqProvider } from "../../../../services/llm/providers/groq";
import { MistralProvider } from "../../../../services/llm/providers/mistral";
import { MockProvider } from "../../../../services/llm/providers/mockProvider";

describe("createLLMProvider Factory", () => {
  
  test("should return a GroqProvider when 'groq' is passed", () => {
    const provider = createLLMProvider("groq");
    expect(provider).toBeInstanceOf(GroqProvider);
    expect(provider.name).toBe("groq");
  });

  test("should return a MistralProvider when 'mistral' is passed", () => {
    const provider = createLLMProvider("mistral");
    expect(provider).toBeInstanceOf(MistralProvider);
    expect(provider.name).toBe("mistral");
  });

  test("should return a MockProvider when 'mock' is passed", () => {
    const provider = createLLMProvider("mock");
    expect(provider).toBeInstanceOf(MockProvider);
    expect(provider.name).toBe("mock");
  });

  test("should return the default (groq) when no name is provided", () => {
    const provider = createLLMProvider();
    expect(provider).toBeInstanceOf(GroqProvider);
  });

  test("should throw an error for unsupported provider names", () => {
    // We cast to 'any' to bypass TypeScript's type checking for the invalid name
    const invalidName = "not-a-real-provider" as any;
    
    expect(() => createLLMProvider(invalidName)).toThrow(
      "Unsupported LLM provider: not-a-real-provider"
    );
  });
});