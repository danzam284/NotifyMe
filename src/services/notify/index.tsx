import { ImageGeneratorService } from "../image";
import { GiphyClient } from "../image/client/giphyClient";
import { LLMService } from "../llm";
import { KEYWORDS_FOR_IMAGE_GEN_PROMPT } from "../llm/prompts";
import { createLLMProvider } from "../llm/providers/factory";

export class NotifyService {
  constructor(
    private readonly llmService: LLMService,
    private readonly imageGeneratorService: ImageGeneratorService
  ) {}

  public async notify(responseToClient: string): Promise<void> {
    console.log(responseToClient);
    const keywordsPrompt = KEYWORDS_FOR_IMAGE_GEN_PROMPT(responseToClient);
    const keywords = await this.llmService.sendPrompt(keywordsPrompt);

    const image = await this.imageGeneratorService.generateImage(keywords);

    console.log(image);
  }
}

export const notifyService = new NotifyService(
  new LLMService(createLLMProvider("groq")),
  new ImageGeneratorService(new GiphyClient())
);