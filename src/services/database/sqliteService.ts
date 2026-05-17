import { Database } from "bun:sqlite";
import type { DatabaseService } from "./types";

export class BunSqliteService implements DatabaseService {
  private db: Database;

  constructor(filename: string = "app.db") {
    this.db = new Database(filename);
  }

  execute(sql: string, params: any[] = []): void {
    this.db.run(sql, params);
  }

  query<T>(sql: string, params: any[] = []): T[] {
    return this.db.query(sql).all(...params) as T[];
  }

  queryOne<T>(sql: string, params: any[] = []): T | null {
    return (this.db.query(sql).get(...params) as T) ?? null;
  }

  close(): void {
    this.db.close();
  }
}