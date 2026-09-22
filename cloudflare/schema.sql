CREATE TABLE IF NOT EXISTS crew (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crew_email ON crew(email);
CREATE INDEX IF NOT EXISTS idx_crew_created_at ON crew(created_at);
