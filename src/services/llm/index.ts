import type { LLMProvider } from "./types";
import { createLLMProvider } from "./providers/factory";
import {
  NOTIFY_CLASSIFIER_SYSTEM_PROMPT,
  buildNotifyAnalysisPrompt,
} from "./prompts";


export class LLMService {
  constructor(private provider: LLMProvider = createLLMProvider("mock")) {}

  async analyzeNotifyRequest(userText: string) {
    const prompt = buildNotifyAnalysisPrompt(userText);

    const response = await this.provider.sendText(prompt, {
      systemPrompt: NOTIFY_CLASSIFIER_SYSTEM_PROMPT,
      temperature: 0.2,
    });

    return {
      raw: response,
    };
  }

  private async sendPrompt(prompt: string): Promise<string> {
    return this.provider.sendText(prompt);
  }
}

export const llmService = new LLMService();