-- Create table for category configs
CREATE TABLE IF NOT EXISTS wb_category_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  min_margin_pct NUMERIC NOT NULL DEFAULT 25,
  ctr_warning NUMERIC NOT NULL DEFAULT 2.5,
  cr_order_warning NUMERIC NOT NULL DEFAULT 3.0,
  price_step_pct NUMERIC NOT NULL DEFAULT 3,
  drr_warning NUMERIC NOT NULL DEFAULT 20,
  stock_critical_days NUMERIC NOT NULL DEFAULT 10,
  stock_overstock_days NUMERIC NOT NULL DEFAULT 120,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert 4 categories with default values
INSERT INTO wb_category_config (category, min_margin_pct, ctr_warning, cr_order_warning, price_step_pct, drr_warning, stock_critical_days, stock_overstock_days)
VALUES 
  ('FACE', 25, 2.5, 3.0, 3, 20, 10, 120),
  ('HAIR', 22, 2.0, 2.5, 4, 18, 14, 90),
  ('BODY', 20, 1.8, 2.0, 5, 15, 14, 100),
  ('MAKEUP', 30, 3.0, 4.0, 2, 25, 7, 60)
ON CONFLICT (category) DO NOTHING;

-- Enable RLS
ALTER TABLE wb_category_config ENABLE ROW LEVEL SECURITY;

-- Allow all access policy
CREATE POLICY "Allow all access to wb_category_config" ON wb_category_config
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wb_category_config_updated_at
    BEFORE UPDATE ON wb_category_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
