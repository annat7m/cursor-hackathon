import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export type SessionStatus = "starting" | "running" | "stopped" | "error";

export type SessionRow = {
  id: string;
  templateId: string;
  status: SessionStatus;
  createdAt: string;
  expiresAt: string;
  containerId: string | null;
  hostPort: number | null;
  connectUrl: string | null;
  token: string;
};

export function openDb(dbPath: string) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      templateId TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      containerId TEXT,
      hostPort INTEGER,
      connectUrl TEXT,
      token TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions(expiresAt);
  `);

  // Lightweight migration for existing DBs.
  const cols = db.prepare(`PRAGMA table_info(sessions)`).all() as Array<{ name: string }>;
  const names = new Set(cols.map((c) => c.name));
  if (!names.has("hostPort")) {
    db.exec(`ALTER TABLE sessions ADD COLUMN hostPort INTEGER;`);
  }

  return db;
}

export function insertSession(db: Database.Database, row: SessionRow) {
  db.prepare(
    `INSERT INTO sessions (id, templateId, status, createdAt, expiresAt, containerId, hostPort, connectUrl, token)
     VALUES (@id, @templateId, @status, @createdAt, @expiresAt, @containerId, @hostPort, @connectUrl, @token)`
  ).run(row);
}

export function getSession(db: Database.Database, id: string): SessionRow | null {
  return (
    (db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as SessionRow | undefined) ?? null
  );
}

export function updateSession(
  db: Database.Database,
  id: string,
  patch: Partial<Pick<SessionRow, "status" | "containerId" | "hostPort" | "connectUrl" | "expiresAt">>
) {
  const fields = Object.keys(patch);
  if (fields.length === 0) return;
  const sets = fields.map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE sessions SET ${sets} WHERE id = @id`).run({ id, ...patch });
}

export function listExpiredSessions(db: Database.Database, nowIso: string): SessionRow[] {
  return db.prepare(`SELECT * FROM sessions WHERE expiresAt <= ? AND status != 'stopped'`).all(nowIso) as SessionRow[];
}

