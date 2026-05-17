import type { ChatSessionData, ChatSessionStore } from "../types";
import type { DatabaseService } from "../../database/types";

interface RowSchema {
  id: string;
  messages: string;
  created_at: string;
  updated_at: string;
}

export class SqliteChatSessionStore implements ChatSessionStore {
  constructor(private db: DatabaseService) {
    this.initTable();
  }

  private initTable(): void {
    this.db.execute(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        messages TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }

  async save(session: ChatSessionData): Promise<void> {
    const sql = `
      INSERT INTO chat_sessions (id, messages, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        messages = excluded.messages,
        updated_at = excluded.updated_at;
    `;

    this.db.execute(sql, [
      session.id,
      JSON.stringify(session.messages),
      session.createdAt.toISOString(),
      session.updatedAt.toISOString(),
    ]);
  }

  async get(id: string): Promise<ChatSessionData | null> {
    const sql = `SELECT id, messages, created_at, updated_at FROM chat_sessions WHERE id = ? LIMIT 1;`;
    const row = this.db.queryOne<RowSchema>(sql, [id]);

    if (!row) return null;

    return {
      id: row.id,
      messages: JSON.parse(row.messages),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async delete(id: string): Promise<void> {
    const sql = `DELETE FROM chat_sessions WHERE id = ?;`;
    this.db.execute(sql, [id]);
  }
}