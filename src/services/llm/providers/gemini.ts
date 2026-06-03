import { GoogleGenAI } from "@google/genai";
import type { LLMMessage, LLMProvider, SendTextOptions } from "../types";

export class GeminiProvider implements LLMProvider {
  name = "gemini" as const;

  private client: GoogleGenAI;

  constructor(apiKey = process.env.GEMINI_API_KEY) {
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    this.client = new GoogleGenAI({apiKey: apiKey});
  }

  async sendText(
    prompt: string,
    options: SendTextOptions = {}
  ): Promise<string> {
    const messages: LLMMessage[] = [
      ...(options.systemPrompt
        ? [{ role: "system" as const, content: options.systemPrompt }]
        : []),
      {
        role: "user",
        content: prompt,
      },
    ];

    return this.sendMessages(messages, options);
  }

  async sendMessages(
    messages: LLMMessage[],
    options: SendTextOptions = {}
  ): Promise<string> {
    const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: messages.map((message) => ({
        role: message.role,
        parts: [
          {
            text: message.content,
          },
        ],
      })),
    })

    return response.text ?? "";
  }
}
