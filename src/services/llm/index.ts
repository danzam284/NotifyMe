import type { LLMProvider } from "./types";
import { createLLMProvider } from "./providers/factory";

export class LLMService {
  constructor(private provider: LLMProvider = createLLMProvider("mock")) {}

   async sendPrompt(prompt: string): Promise<string> {
    return this.provider.sendText(prompt);
  }
}
