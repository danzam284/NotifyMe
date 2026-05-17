import { describe, test, expect, mock, beforeEach } from "bun:test";
import { MistralProvider } from "../../../../services/llm/providers/mistral";

describe("MistralProvider", () => {
  const MOCK_API_KEY = "test-mistral-key";

  beforeEach(() => {
    process.env.MISTRAL_API_KEY = MOCK_API_KEY;
    // Reset the global fetch mock before each test
    global.fetch = mock(() => {}) as unknown as typeof fetch;
  });

  test("should throw if API key is missing", () => {
    delete process.env.MISTRAL_API_KEY;
    expect(() => new MistralProvider()).toThrow("Missing MISTRAL_API_KEY");
  });

  test("sendMessages should format the request body correctly", async () => {
    const provider = new MistralProvider();
    
    // Setup a successful mock response
    (global.fetch as any).mockResolvedValue(
      new Response(JSON.stringify({
        outputs: [{ content: "Hello from Mistral!" }]
      }), { status: 200 })
    );

    const messages = [
      { role: "system" as const, content: "System Instruction" },
      { role: "user" as const, content: "User Query" }
    ];

    const result = await provider.sendMessages(messages, { temperature: 0.5 });

    expect(result).toBe("Hello from Mistral!");

    // Verify fetch call parameters
    const [url, init] = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(init.body);

    expect(url).toBe("https://api.mistral.ai/v1/conversations");
    expect(init.headers["Authorization"]).toBe(`Bearer ${MOCK_API_KEY}`);
    
    // Mistral-specific logic check: instructions vs inputs
    expect(body.instructions).toBe("System Instruction");
    expect(body.inputs).toHaveLength(1);
    expect(body.inputs[0].content).toBe("User Query");
    expect(body.completion_args.temperature).toBe(0.5);
  });

  describe("extractMistralText logic", () => {
    test("should handle string-based content", async () => {
      const provider = new MistralProvider();
      (global.fetch as any).mockResolvedValue(
        new Response(JSON.stringify({
          outputs: [{ content: "Plain string response" }]
        }))
      );

      const result = await provider.sendText("Hi");
      expect(result).toBe("Plain string response");
    });

    test("should handle array-based content parts", async () => {
      const provider = new MistralProvider();
      (global.fetch as any).mockResolvedValue(
        new Response(JSON.stringify({
          outputs: [{
            content: [
              { type: "text", text: "Part one " },
              { type: "text", text: "Part two" }
            ]
          }]
        }))
      );

      const result = await provider.sendText("Hi");
      expect(result).toBe("Part one Part two");
    });

    test("should return empty string if outputs are missing", async () => {
      const provider = new MistralProvider();
      (global.fetch as any).mockResolvedValue(
        new Response(JSON.stringify({ outputs: [] }))
      );

      const result = await provider.sendText("Hi");
      expect(result).toBe("");
    });
  });

  test("should throw an error with details when API returns non-200", async () => {
    const provider = new MistralProvider();
    (global.fetch as any).mockResolvedValue(
      new Response("Invalid API Key", { 
        status: 401, 
        statusText: "Unauthorized" 
      })
    );

    expect(provider.sendText("Hi")).rejects.toThrow(
      "Mistral request failed: 401 Unauthorized - Invalid API Key"
    );
  });
});