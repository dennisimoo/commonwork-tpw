CREATE TABLE IF NOT EXISTS demo_workspaces (
 token_hash TEXT PRIMARY KEY,
 payload TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0,
 expires INTEGER NOT NULL,
 updated_at TEXT NOT NULL
);
