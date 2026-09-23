CREATE TABLE IF NOT EXISTS fulfilment_orders (
  external_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('processing','submitted','failed')),
  request_json TEXT NOT NULL,
  response_json TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fulfilment_orders_status
  ON fulfilment_orders(status);

CREATE INDEX IF NOT EXISTS idx_fulfilment_orders_updated_at
  ON fulfilment_orders(updated_at);
