import { describe, test, expect, mock, beforeEach } from "bun:test";
import { GroqProvider } from "../../../../services/llm/providers/groq";

// 1. Mock the entire groq-sdk module
mock.module("groq-sdk", () => {
  return {
    default: class {
      apiKey: string;
      constructor(opts: { apiKey: string }) {
        this.apiKey = opts.apiKey;
      }
      chat = {
        completions: {
          // We create a mock function we can control later
          create: mock(async () => ({
            choices: [{ message: { content: "Mocked response from Groq" } }],
          })),
        },
      };
    },
  };
});

describe("GroqProvider", () => {
  // Set a dummy env variable so the constructor doesn't throw
  process.env.GROQ_API_KEY = "test-key";

  test("should throw an error if no API key is provided and env is empty", () => {
    const originalKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    
    expect(() => new GroqProvider()).toThrow("Missing GROQ_API_KEY");
    
    process.env.GROQ_API_KEY = originalKey; // Restore
  });

  test("sendMessages should call the Groq SDK with correct parameters", async () => {
    const provider = new GroqProvider();
    const messages = [{ role: "user" as const, content: "Hello" }];
    
    const result = await provider.sendMessages(messages, { 
      model: "custom-model", 
      temperature: 0.7 
    });

    expect(result).toBe("Mocked response from Groq");

    // We can inspect the internal client to see if it was called correctly
    // Note: We access private client for testing purposes via casting
    const client = (provider as any).client;
    expect(client.chat.completions.create).toHaveBeenCalledWith({
      model: "custom-model",
      temperature: 0.7,
      messages: [{ role: "user", content: "Hello" }],
    });
  });

  test("should return an empty string if the SDK response is malformed", async () => {
    const provider = new GroqProvider();
    const client = (provider as any).client;
    
    // Override the specific mock for this one test
    client.chat.completions.create.mockResolvedValueOnce({ choices: [] });

    const result = await provider.sendMessages([{ role: "user", content: "hi" }]);
    expect(result).toBe("");
  });
});