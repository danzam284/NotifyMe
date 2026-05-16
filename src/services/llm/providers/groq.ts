import Groq from "groq-sdk";
import type { LLMMessage, LLMProvider, SendTextOptions } from "../types";

const DEFAULT_MODEL = "llama-3.1-8b-instant";

export class GroqProvider implements LLMProvider {
  name = "groq" as const;

  private client: Groq;

  constructor(apiKey = process.env.GROQ_API_KEY) {
    if (!apiKey) {
      throw new Error("Missing GROQ_API_KEY");
    }

    this.client = new Groq({ apiKey });
  }

  async sendText(
    prompt: string,
    options: SendTextOptions = {}
  ): Promise<string> {
    const messages: LLMMessage[] = [
      ...(options.systemPrompt
        ? [{ role: "system" as const, content: options.systemPrompt }]
        : []),
      { role: "user", content: prompt },
    ];

    return this.sendMessages(messages, options);
  }

  async sendMessages(
    messages: LLMMessage[],
    options: SendTextOptions = {}
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options.model ?? DEFAULT_MODEL,
      temperature: options.temperature ?? 0.3,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    return response.choices[0]?.message?.content ?? "";
  }
}