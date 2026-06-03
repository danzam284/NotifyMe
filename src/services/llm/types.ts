export type LLMProviderName = "groq" | "mistral" | "mock" | "groq-agent" | "mistral-agent" | "gemini";

export type LLMRole = "system" | "user" | "assistant";

export type LLMMessage = {
  role: LLMRole;
  content: string;
};

export type SendTextOptions = {
  systemPrompt?: string;
  temperature?: number;
  model?: string;
  maxTokens?: number;
  topP?: number;
};

export interface LLMProvider {
  name: LLMProviderName;

  sendText(
    prompt: string,
    options?: SendTextOptions
  ): Promise<string>;

  sendMessages(
    messages: LLMMessage[],
    options?: SendTextOptions
  ): Promise<string>;
}

export type MistralContentChunk =
  | {
      type: "text";
      text: string;
    }
  | {
      type: string;
    };

export type MistralOutput = {
  type: string;
  content?: MistralContentChunk[];
};

export type MistralResponse = {
  outputs?: MistralOutput[];
};