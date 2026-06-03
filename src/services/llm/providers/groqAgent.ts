import Groq from "groq-sdk";
import type { LLMMessage, LLMProvider, SendTextOptions } from "../types";

const DEFAULT_MODEL = "openai/gpt-oss-120b";

export class GroqAgent implements LLMProvider {
  name = "groq-agent" as const;

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
      temperature: 1,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      tool_choice: "required",
      tools: [
        {
          "type": "browser_search"
        }
      ]
    });

    return response.choices[0]?.message?.content ?? "";
  }
}
