import type { LLMMessage, LLMProvider, SendTextOptions } from "../types";

const DEFAULT_MODEL = "mistral-medium-latest";

type MistralConversationResponse = {
  outputs?: Array<{
    content?: string | Array<{ type?: string; text?: string }>;
  }>;
};

export class MistralProvider implements LLMProvider {
  name = "mistral" as const;

  constructor(private apiKey = process.env.MISTRAL_API_KEY) {
    if (!apiKey) {
      throw new Error("Missing MISTRAL_API_KEY");
    }
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
    const systemMessage = messages.find((message) => message.role === "system");

    const conversationMessages = messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    const response = await fetch("https://api.mistral.ai/v1/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model ?? DEFAULT_MODEL,
        inputs: conversationMessages,
        tools: [],
        completion_args: {
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
          top_p: options.topP ?? 1,
        },
        instructions: options.systemPrompt ?? systemMessage?.content ?? "",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Mistral request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = (await response.json()) as MistralConversationResponse;

    return extractMistralText(data);
  }
}

function extractMistralText(data: MistralConversationResponse): string {
  const content = data.outputs?.[0]?.content;

  if (!content) {
    return "";
  }

  if (typeof content === "string") {
    return content;
  }

  return content
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}