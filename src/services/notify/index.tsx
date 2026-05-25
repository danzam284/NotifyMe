import { ImageGeneratorService } from "../image";
import { GiphyClient } from "../image/client/giphyClient";
import { LLMService } from "../llm";
import { KEYWORDS_FOR_IMAGE_GEN_PROMPT } from "../llm/prompts";
import { createLLMProvider } from "../llm/providers/factory";
import type { NotifyContext } from "./types";

export class NotifyService {
  constructor(
    private readonly llmService: LLMService,
    private readonly imageGeneratorService: ImageGeneratorService
  ) {}

  public async notify(input: NotifyContext): Promise<void> {
    const context = this.buildContext(input);

    const keywordsPrompt = KEYWORDS_FOR_IMAGE_GEN_PROMPT(context);

    const keywords = await this.llmService.sendPrompt(keywordsPrompt);

    const image = await this.imageGeneratorService.generateImage(keywords);

    console.log(image);
  }

  private buildContext(input: NotifyContext): string {
    switch (input.type) {
      case "HARDCODED":
        return input.context;

      case "AGENT":
        return `
Agent Prompt:
${input.agentPrompt}

Agent Response:
${input.agentResponse ?? "No response yet"}
        `.trim();
    }
  }
}

export const notifyService = new NotifyService(
  new LLMService(createLLMProvider("groq")),
  new ImageGeneratorService(new GiphyClient())
);