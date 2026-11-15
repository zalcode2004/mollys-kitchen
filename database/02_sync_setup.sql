-- ============================================================================
-- 02_sync_setup.sql — run ONCE in Supabase SQL Editor, AFTER the main schema.
-- Enables shared live data between resident phones and the kitchen screen.
-- DEMO-LEVEL ACCESS: anyone with the anon key can read/write orders + app_state.
-- ============================================================================

-- Shared app settings: tonight's thalis, menu/stock/prices, cutoff + demo flag
CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_orders_all" ON orders;
CREATE POLICY "demo_orders_all" ON orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "demo_state_all" ON app_state;
CREATE POLICY "demo_state_all" ON app_state FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Lock the tables the frontend does not use (no policy = no anon access)
ALTER TABLE residents                ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rotational_thalis  ENABLE ROW LEVEL SECURITY;

-- Live updates
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE orders;    EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE app_state; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
