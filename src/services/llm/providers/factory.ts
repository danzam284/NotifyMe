import type { LLMProvider, LLMProviderName } from "../types";
import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";
import { GroqAgent } from "./groqAgent";
import { MistralProvider } from "./mistral";
import { MistralAgent } from "./mistralAgent";
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
    
    case "groq-agent":
        return new GroqAgent();

    case "mistral":
      return new MistralAgent();

    case "gemini":
        return new GeminiProvider();
        
    default:
      throw new Error(`Unsupported LLM provider: ${name}`);
  }
}