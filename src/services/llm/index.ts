import type { LLMProvider } from "./types";
import { createLLMProvider } from "./providers/factory";
import {
  NOTIFY_CLASSIFIER_SYSTEM_PROMPT,
} from "./prompts";


export class LLMService {
  constructor(private provider: LLMProvider = createLLMProvider("mock")) {}

   async sendPrompt(prompt: string): Promise<string> {
    return this.provider.sendText(prompt);
  }
}

export const llmService = new LLMService();