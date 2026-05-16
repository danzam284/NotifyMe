import type { LLMProvider, LLMProviderName } from "../types";
import { GroqProvider } from "./groq";
import { MistralProvider } from "./mistral";
import { MockProvider } from "./mockProvider";

export function createLLMProvider(
  name: LLMProviderName = "groq"
): LLMProvider {
  switch (name) {
    case "groq":
      return new GroqProvider();

    case "mistral":
      return new MistralProvider();

    case "mock":
      return new MockProvider();

    default:
      throw new Error(`Unsupported LLM provider: ${name}`);
  }
}