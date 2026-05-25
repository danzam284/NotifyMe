// giphyClient.test.ts

import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { GiphyClient } from "../../../../services/image/client/giphyClient";
import type { GiphySearchResponse } from "../../../../services/image/client/types";

describe("GiphyClient", () => {
  const apiKey = "test-api-key";

  beforeEach(() => {
    global.fetch = mock(() => Promise.resolve({})) as unknown as typeof fetch;
  });

  afterEach(() => {
    mock.restore();
  });

  it("should throw if api key is missing", () => {
    expect(() => new GiphyClient("")).toThrow("Missing GIPHY_API_KEY");
  });

  it("should return a gif url when giphy returns a valid gif", async () => {
    const mockResponse: GiphySearchResponse = {
      data: [
        {
          id: "abc123",
        },
      ],
    };

    global.fetch = mock(async () => ({
        ok: true,
        json: async () => mockResponse,
    })) as unknown as typeof fetch;

    const client = new GiphyClient(apiKey);

    const result = await client.generateImage("funny cat");

    expect(global.fetch).toHaveBeenCalledTimes(1);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "https://api.giphy.com/v1/gifs/search"
      )
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("api_key=test-api-key")
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("q=funny+cat")
    );

    expect(result).toEqual({
      url: "https://i.giphy.com/abc123.gif",
    });
  });

  it("should return null when response is not ok", async () => {
    global.fetch = mock(async () => ({
        ok: false,
    })) as unknown as typeof fetch;

    const client = new GiphyClient(apiKey);

    const result = await client.generateImage("dog");

    expect(result).toBeNull();
  });

  it("should return null when no gif is returned", async () => {
    const mockResponse: GiphySearchResponse = {
      data: [],
    };

    global.fetch = mock(async () => ({
        ok: true,
        json: async () => mockResponse,
    })) as unknown as typeof fetch;

    const client = new GiphyClient(apiKey);

    const result = await client.generateImage("dog");

    expect(result).toBeNull();
  });

  it("should return null when gif id is missing", async () => {
    const mockResponse: GiphySearchResponse = {
      data: [{
          id: ""
      }],
    };

    global.fetch = mock(async () => ({
        ok: true,
        json: async () => mockResponse,
    })) as unknown as typeof fetch;

    const client = new GiphyClient(apiKey);

    const result = await client.generateImage("dog");

    expect(result).toBeNull();
  });

  it("should return null when fetch throws", async () => {
    global.fetch = mock(async () => {
        throw new Error("Network error");
    }) as unknown as typeof fetch;

    const client = new GiphyClient(apiKey);

    const result = await client.generateImage("dog");

    expect(result).toBeNull();
  });

  it("should return null when response.json throws", async () => {
    global.fetch = mock(async () => ({
        ok: true,
        json: async () => {
            throw new Error("Invalid JSON");
        },
    })) as unknown as typeof fetch;

    const client = new GiphyClient(apiKey);

    const result = await client.generateImage("dog");

    expect(result).toBeNull();
  });
});