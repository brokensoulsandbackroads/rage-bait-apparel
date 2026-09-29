CREATE TABLE IF NOT EXISTS crew (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crew_email ON crew(email);
CREATE INDEX IF NOT EXISTS idx_crew_created_at ON crew(created_at);

CREATE TABLE IF NOT EXISTS banter_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  laughs INTEGER NOT NULL DEFAULT 0,
  chaos INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_banter_comments_created_at ON banter_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_banter_comments_visible ON banter_comments(hidden, created_at);
