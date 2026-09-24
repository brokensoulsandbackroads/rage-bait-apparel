CREATE TABLE IF NOT EXISTS checkout_orders (
  checkout_id TEXT PRIMARY KEY,
  paypal_order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('created','captured','fulfilled','paid_fulfilment_failed','failed')),
  buyer_email TEXT NOT NULL,
  shipping_json TEXT NOT NULL,
  items_json TEXT NOT NULL,
  subtotal_gbp REAL NOT NULL,
  shipping_gbp REAL NOT NULL,
  total_gbp REAL NOT NULL,
  paypal_capture_id TEXT,
  provider_response_json TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checkout_orders_paypal
  ON checkout_orders(paypal_order_id);

CREATE INDEX IF NOT EXISTS idx_checkout_orders_status
  ON checkout_orders(status);

CREATE INDEX IF NOT EXISTS idx_checkout_orders_updated_at
  ON checkout_orders(updated_at);
