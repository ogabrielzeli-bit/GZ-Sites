/**
 * Banco de dados SQLite via `node:sqlite` (nativo do Node ≥ 22.13, sem binários externos).
 * Camada fina para facilitar migração futura (Postgres etc.): só `run`, `get`, `all`, `transaction`.
 */
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { MIGRATIONS } from './migrations';

export type Row = Record<string, unknown>;

export class Database {
  private db: DatabaseSync;
  readonly file: string;

  constructor(file: string) {
    this.file = file;
    if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA busy_timeout = 5000;');
  }

  run(sql: string, params: unknown[] = []) {
    return this.db.prepare(sql).run(...(params as any[]));
  }

  get<T = Row>(sql: string, params: unknown[] = []): T | undefined {
    return this.db.prepare(sql).get(...(params as any[])) as T | undefined;
  }

  all<T = Row>(sql: string, params: unknown[] = []): T[] {
    return this.db.prepare(sql).all(...(params as any[])) as T[];
  }

  exec(sql: string) {
    this.db.exec(sql);
  }

  transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN');
    try {
      const r = fn();
      this.db.exec('COMMIT');
      return r;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  migrate(): { applied: string[] } {
    this.db.exec(
      `CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))`,
    );
    const done = new Set(this.all<{ id: string }>('SELECT id FROM _migrations').map((r) => r.id));
    const applied: string[] = [];
    for (const m of MIGRATIONS) {
      if (done.has(m.id)) continue;
      this.transaction(() => {
        for (const stmt of m.up) this.db.exec(stmt);
        this.run('INSERT INTO _migrations (id) VALUES (?)', [m.id]);
      });
      applied.push(m.id);
    }
    return { applied };
  }

  close() {
    this.db.close();
  }
}
