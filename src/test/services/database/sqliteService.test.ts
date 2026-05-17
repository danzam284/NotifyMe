import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { BunSqliteService } from "../../../services/database/sqliteService";

interface User {
  id: number;
  name: string;
}

describe("BunSqliteService", () => {
  let service: BunSqliteService;

  beforeEach(() => {
    // Initialize with ":memory:" so tests run in isolation and don't touch the disk
    service = new BunSqliteService(":memory:");
    
    // Set up a mock table for testing
    service.execute(
      "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)"
    );
  });

  afterEach(() => {
    // Clean up connection after each test
    try {
      service.close();
    } catch {
      // Catch error if a test already closed it
    }
  });

  test("should execute SQL statements successfully", () => {
    expect(() => {
      service.execute("INSERT INTO users (name) VALUES (?)", ["Alice"]);
    }).not.toThrow();
  });

  test("query() should return an array of matched rows", () => {
    service.execute("INSERT INTO users (name) VALUES (?)", ["Alice"]);
    service.execute("INSERT INTO users (name) VALUES (?)", ["Bob"]);

    const results = service.query<User>("SELECT * FROM users ORDER BY name ASC");
    expect(results).toHaveLength(2);
    expect(results[0]?.name).toBe("Alice");
    expect(results[1]?.name).toBe("Bob");
  });

  test("queryOne() should return a single object if found", () => {
    service.execute("INSERT INTO users (name) VALUES (?)", ["Charlie"]);

    const user = service.queryOne<User>(
      "SELECT * FROM users WHERE name = ?", 
      ["Charlie"]
    );

    expect(user).not.toBeNull();
    expect(user?.name).toBe("Charlie");
  });

  test("queryOne() should return null if no row matches", () => {
    const user = service.queryOne<User>(
      "SELECT * FROM users WHERE name = ?", 
      ["Ghost"]
    );

    expect(user).toBeNull();
  });

  test("close() should disconnect and prevent further operations", () => {
    service.close();

    // Bun's SQLite throws an error if you attempt to query a closed database
    expect(() => {
      service.query("SELECT * FROM users");
    }).toThrow();
  });
});