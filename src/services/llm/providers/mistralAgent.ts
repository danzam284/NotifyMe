import { AGENT_RESPONSE_REFORMATTING_PROMPT } from "../prompts";
import type { LLMMessage, LLMProvider, MistralContentChunk, MistralResponse, SendTextOptions } from "../types";
import { GeminiProvider } from "./gemini";

// const DEFAULT_MODEL = "mistral-medium-2508";
const DEFAULT_MODEL = "mistral-small-2603"

export class MistralAgent implements LLMProvider {
  name = "mistral-agent" as const;

  private client: LLMProvider = new GeminiProvider();

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
      { role: "user", content: `**NOTE** Use web search abilities to resolve the prompt: ${prompt}`},
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
        tools: [{ type: "web_search" }],
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

    const data = await response.json()
    const responseText = extractMistralText(data as MistralResponse);
    console.log(responseText);

    return await this.client.sendText(AGENT_RESPONSE_REFORMATTING_PROMPT(responseText));
  }
}

function extractMistralText(data: MistralResponse): string {
  return (
    data.outputs
      ?.filter((output) => output.type === "message.output")
      .flatMap((output) => output.content ?? [])
      .filter(
        (
          chunk
        ): chunk is Extract<MistralContentChunk, { type: "text" }> =>
          chunk.type === "text"
      )
      .map((chunk) => chunk.text)
      .join("")
      .trim() ?? ""
  );
}