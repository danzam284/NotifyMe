export type LLMProviderName = "groq" | "mistral" | "mock";

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