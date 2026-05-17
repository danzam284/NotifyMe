import { describe, test, expect, beforeEach } from "bun:test";
import { InMemoryChatSessionStore } from "../../../../services/chatSession/store/inMemoryStore";
import type { ChatSessionData } from "../../../../services/chatSession/types";

describe("InMemoryChatSessionStore", () => {
  let store: InMemoryChatSessionStore;

  // Helper to create valid session data for testing
  const createSampleData = (id: string): ChatSessionData => ({
    id,
    messages: [{ role: "user", content: "test" }],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    store = new InMemoryChatSessionStore();
  });

  describe("save & get", () => {
    test("should persist and retrieve session data", async () => {
      const data = createSampleData("session-1");
      
      await store.save(data);
      const retrieved = await store.get("session-1");

      expect(retrieved).toEqual(data);
      // Ensure it's the same object reference (standard for in-memory)
      expect(retrieved).toBe(data); 
    });

    test("should return null for non-existent sessions", async () => {
      const retrieved = await store.get("ghost-id");
      expect(retrieved).toBeNull();
    });

    test("should overwrite existing data when saving with the same ID", async () => {
      const dataV1 = createSampleData("session-1");
      const dataV2 = { ...dataV1, messages: [] };

      await store.save(dataV1);
      await store.save(dataV2);
      
      const retrieved = await store.get("session-1");
      expect(retrieved?.messages).toHaveLength(0);
    });
  });

  describe("delete", () => {
    test("should remove the session from the store", async () => {
      const data = createSampleData("to-be-deleted");
      await store.save(data);
      
      await store.delete("to-be-deleted");
      const retrieved = await store.get("to-be-deleted");
      
      expect(retrieved).toBeNull();
    });

    test("should not throw an error when deleting a non-existent session", async () => {
      // Functional requirement: delete should be idempotent
      expect(store.delete("non-existent")).resolves.toBeUndefined();
    });
  });

  describe("Data Integrity", () => {
    test("should handle multiple independent sessions", async () => {
      const s1 = createSampleData("id-1");
      const s2 = createSampleData("id-2");

      await store.save(s1);
      await store.save(s2);

      expect(await store.get("id-1")).toEqual(s1);
      expect(await store.get("id-2")).toEqual(s2);
    });
  });
});