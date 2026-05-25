import type { Image, ImageClient } from "./types";

export class ImageGeneratorService {
  constructor(private readonly imageClient: ImageClient) {}

  public async generateImage(keyword: string): Promise<Image | null> {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      return null;
    }

    return this.imageClient.generateImage(trimmedKeyword);
  }
}