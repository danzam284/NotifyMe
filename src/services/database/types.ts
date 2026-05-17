export interface DatabaseService {
  execute(sql: string, params?: any[]): void;
  query<T>(sql: string, params?: any[]): T[];
  queryOne<T>(sql: string, params?: any[]): T | null;
  close(): void;
}