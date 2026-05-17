import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { ChatSession, type IChatSessionContext } from "../../../services/chatSession/chatSession";
import type { LLMMessage } from "../../../services/llm/types";

describe("ChatSession Unit Tests", () => {
  let mockContext: IChatSessionContext;
  let initialMessages: LLMMessage[];

  // Helper factory to spawn cleanly separated session instances
  const createSession = (messages: LLMMessage[] = []) => {
    return new ChatSession("test-session-id", messages, mockContext);
  };

  beforeEach(() => {
    // Reset mocks before every single test scenario
    mockContext = {
      save: mock(() => Promise.resolve()),
      delete: mock(() => Promise.resolve()),
      executeLLM: mock(() => Promise.resolve("Mocked AI response")),
    };
  });

  // =========================================================================
  // 1. INPUT VALIDATION EDGE CASES
  // =========================================================================
  describe("Validation", () => {
    test("should reject empty strings", async () => {
      const session = createSession();
      expect(session.sendMessage("")).rejects.toThrow("User message cannot be empty");
      expect(mockContext.save).not.toHaveBeenCalled();
      expect(mockContext.executeLLM).not.toHaveBeenCalled();
    });

    test("should reject strings containing only whitespace", async () => {
      const session = createSession();
      expect(session.sendMessage("   \n   \t  ")).rejects.toThrow("User message cannot be empty");
    });
  });

  // =========================================================================
  // 2. HAPPY PATHS & STATE MUTATIONS
  // =========================================================================
  describe("Core Flow & State Changes", () => {
    test("should trim user input, update timestamps, and persist sequence correctly", async () => {
      const session = createSession();
      const initialTime = session.updatedAt.getTime();

      // Introduce a tiny delay so timestamp changes are measurable
      await new Promise((resolve) => setTimeout(resolve, 1));

      const response = await session.sendMessage("  Hello AI!  ");

      // Verify input trimming and message tracking
      expect(session.messages).toHaveLength(2);
      expect(session.messages[0]).toEqual({ role: "user", content: "Hello AI!" });
      expect(session.messages[1]).toEqual({ role: "assistant", content: "Mocked AI response" });

      // State engine verification
      expect(session.updatedAt.getTime()).toBeGreaterThan(initialTime);
      expect(response).toEqual({
        sessionId: "test-session-id",
        response: "Mocked AI response",
        messages: session.messages,
      });

      // Verify persistence sequence: 1st save (user message), 2nd save (assistant message)
      expect(mockContext.save).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // 3. CONTEXT WINDOW SLICING LOGIC (limitMessages Edge Cases)
  // =========================================================================
  describe("Context Window Management (limitMessages)", () => {
    test("should default to a max window of 20 historical items when options are omitted", async () => {
      // Load history with 25 previous user items
      const denseHistory: LLMMessage[] = Array.from({ length: 25 }, (_, i) => ({
        role: "user",
        content: `Msg ${i}`,
      }));
      const session = createSession(denseHistory);

      await session.sendMessage("Trigger LLM execution");

      // Context window calculation: 25 historical items + 1 new user item = 26 items total.
      // Default max is 20, meaning it should slice off the oldest 6 items.
      const sentToLLM = (mockContext.executeLLM as any).mock.calls[0][0];
      expect(sentToLLM).toHaveLength(20);
      expect(sentToLLM[0].content).toBe("Msg 6"); // Sliced off Msg 0 through 5
    });

    test("should strictly respect a custom maxMessages configuration parameter", async () => {
      const denseHistory: LLMMessage[] = [
        { role: "user", content: "Old 1" },
        { role: "user", content: "Old 2" },
        { role: "user", content: "Old 3" },
      ];
      const session = createSession(denseHistory);

      await session.sendMessage("New item", { maxMessages: 2 });

      const sentToLLM = (mockContext.executeLLM as any).mock.calls[0][0];
      // History has 'Old 1', 'Old 2', 'Old 3' + 'New item' (4 items total). Max window 2.
      expect(sentToLLM).toHaveLength(2);
      expect(sentToLLM[0].content).toBe("Old 3");
      expect(sentToLLM[1].content).toBe("New item");
    });

    test("should lock system instructions to position 0 even when context bounds are exceeded", async () => {
      const complexHistory: LLMMessage[] = [
        { role: "system", content: "You are a helpful database admin." },
        { role: "user", content: "Query 1" },
        { role: "user", content: "Query 2" },
        { role: "user", content: "Query 3" },
      ];
      const session = createSession(complexHistory);

      // We set maxMessages to 1. This means only 1 conversational turn should survive,
      // but the system instruction MUST still be prepended at the root.
      await session.sendMessage("Query 4", { maxMessages: 1 });

      const sentToLLM = (mockContext.executeLLM as any).mock.calls[0][0];
      expect(sentToLLM).toHaveLength(2); // System prompt + 1 historical message turn
      expect(sentToLLM[0]).toEqual({ role: "system", content: "You are a helpful database admin." });
      expect(sentToLLM[1]).toEqual({ role: "user", content: "Query 4" });
    });
  });

  // =========================================================================
  // 4. ERROR ISOLATION AND BUBBLING
  // =========================================================================
  describe("Error Propagation", () => {
    test("should immediately halt execution if the user payload fail to save", async () => {
      mockContext.save = mock(() => Promise.reject(new Error("Database write failure")));
      const session = createSession();

      expect(session.sendMessage("Hello")).rejects.toThrow("Database write failure");
      
      // Ensure we don't bleed processing or call down into expensive LLM providers
      expect(mockContext.executeLLM).not.toHaveBeenCalled();
    });

    test("should crash cleanly without double-saving if the LLM provider faults out", async () => {
      mockContext.executeLLM = mock(() => Promise.reject(new Error("Rate limit hit")));
      const session = createSession();

      expect(session.sendMessage("Hello")).rejects.toThrow("Rate limit hit");
      
      // Should save user input state, but fail to call the fallback assistant save routine
      expect(mockContext.save).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 5. SESSION DELETION
  // =========================================================================
  describe("Lifecycle Termination", () => {
    test("should reliably bubble up context layer delete commands", async () => {
      const session = createSession();
      await session.delete();

      expect(mockContext.delete).toHaveBeenCalledTimes(1);
      expect(mockContext.delete).toHaveBeenCalledWith("test-session-id");
    });
  });
});