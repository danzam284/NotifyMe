import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { BunSqliteService } from "../../../../services/database/sqliteService";
import { SqliteChatSessionStore } from "../../../../services/chatSession/store/sqliteStore";
import type { ChatSessionData } from "../../../../services/chatSession/types";

describe("SqliteChatSessionStore", () => {
  let db: BunSqliteService;
  let store: SqliteChatSessionStore;

  // Create a clean, isolated database state for every single test execution
  beforeEach(() => {
    db = new BunSqliteService(":memory:");
    store = new SqliteChatSessionStore(db);
  });

  afterEach(() => {
    db.close();
  });

  // Base mockup data to reuse across test scenarios
  const sampleSession: ChatSessionData = {
    id: "session_abc123",
    messages: [
      { role: "user", content: "Hello AI!" },
      { role: "assistant", content: "Hello Human!" }
    ],
    createdAt: new Date("2026-01-01T12:00:00Z"),
    updatedAt: new Date("2026-01-01T12:00:00Z"),
  };

  test("should successfully save and retrieve a complete session", async () => {
    await store.save(sampleSession);
    const result = await store.get(sampleSession.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(sampleSession.id);
    
    // Validates JSON serialization/deserialization workflow
    expect(result!.messages).toEqual(sampleSession.messages);
    
    // Validates TEXT-to-Date parsing mechanisms
    expect(result!.createdAt).toEqual(sampleSession.createdAt);
    expect(result!.updatedAt).toEqual(sampleSession.updatedAt);
  });

  test("should upsert (overwrite) an existing session when IDs conflict", async () => {
    await store.save(sampleSession);

    // Modify the original data structure payload
    const updatedSession: ChatSessionData = {
      ...sampleSession,
      messages: [...sampleSession.messages, { role: "user", content: "Can you hear me?" }],
      updatedAt: new Date("2026-01-01T12:05:00Z"), // 5 minutes later
    };

    await store.save(updatedSession);
    const result = await store.get(sampleSession.id);

    expect(result).not.toBeNull();
    expect(result!.messages).toHaveLength(3);
    expect(result!.updatedAt).toEqual(updatedSession.updatedAt);
    expect(result!.createdAt).toEqual(sampleSession.createdAt); // Verification that created_at remained intact
  });

  test("should return null gracefully if a session is missing", async () => {
    const result = await store.get("non_existent_session_id");
    expect(result).toBeNull();
  });

  test("should successfully delete a stored session instance", async () => {
    await store.save(sampleSession);

    // Actively delete record
    await store.delete(sampleSession.id);
    
    // Double-check lookup falls back to null
    const result = await store.get(sampleSession.id);
    expect(result).toBeNull();
  });

  test("should not fail if attempting to delete a session that does not exist", async () => {
    expect(async () => {
      await store.delete("already_empty_id");
    }).not.toThrow();
  });
});