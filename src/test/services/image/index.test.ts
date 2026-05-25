import { describe, expect, it, mock } from "bun:test";
import { ImageGeneratorService } from "../../../services/image";
import type { Image, ImageClient } from "../../../services/image/types";


describe("ImageGeneratorService", () => {
  it("should return null when keyword is empty", async () => {
    const generateImageMock = mock(async () => null);

    const imageClient: ImageClient = {
      generateImage: generateImageMock,
    };

    const service = new ImageGeneratorService(imageClient);

    const result = await service.generateImage("");

    expect(result).toBeNull();
    expect(generateImageMock).not.toHaveBeenCalled();
  });

  it("should return null when keyword is only whitespace", async () => {
    const generateImageMock = mock(async () => null);

    const imageClient: ImageClient = {
      generateImage: generateImageMock,
    };

    const service = new ImageGeneratorService(imageClient);

    const result = await service.generateImage("   ");

    expect(result).toBeNull();
    expect(generateImageMock).not.toHaveBeenCalled();
  });

  it("should trim the keyword before calling imageClient.generateImage", async () => {
    const mockImage: Image = {
      url: "https://example.com/image.png",
    };

    const generateImageMock = mock(async (_keyword: string) => mockImage);

    const imageClient: ImageClient = {
      generateImage: generateImageMock,
    };

    const service = new ImageGeneratorService(imageClient);

    const result = await service.generateImage("   cat meme   ");

    expect(generateImageMock).toHaveBeenCalledTimes(1);
    expect(generateImageMock).toHaveBeenCalledWith("cat meme");
    expect(result).toEqual(mockImage);
  });

  it("should return the result from imageClient.generateImage", async () => {
    const mockImage: Image = {
      url: "https://example.com/generated.png",
    };

    const generateImageMock = mock(async () => mockImage);

    const imageClient: ImageClient = {
      generateImage: generateImageMock,
    };

    const service = new ImageGeneratorService(imageClient);

    const result = await service.generateImage("dog");

    expect(result).toEqual(mockImage);
  });

  it("should return null if imageClient.generateImage returns null", async () => {
    const generateImageMock = mock(async () => null);

    const imageClient: ImageClient = {
      generateImage: generateImageMock,
    };

    const service = new ImageGeneratorService(imageClient);

    const result = await service.generateImage("dog");

    expect(result).toBeNull();
    expect(generateImageMock).toHaveBeenCalledWith("dog");
  });
});