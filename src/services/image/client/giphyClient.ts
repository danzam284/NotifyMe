
import type { Image, ImageClient } from "../types";
import type { GiphySearchResponse } from "./types";

export class GiphyClient implements ImageClient {
  private readonly baseUrl = "https://api.giphy.com/v1/gifs/search";
  private readonly apiKey: string;

  constructor(apiKey = process.env.GIPHY_API_KEY) {
    if (!apiKey) {
      throw new Error("Missing GIPHY_API_KEY");
    }
    this.apiKey = apiKey;
  }

  public async generateImage(query: string): Promise<Image | null> {
    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        q: query,
        limit: "1",
        rating: "pg"
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`);

      if (!response.ok) {
        return null;
      }

      const json = await response.json() as GiphySearchResponse;

      const gif = json.data?.[0];

      if (!gif?.id) {
        return null;
      }

      return {
        url: `https://i.giphy.com/${gif.id}.gif`,
      };
    } catch {
      return null;
    }
  }
}