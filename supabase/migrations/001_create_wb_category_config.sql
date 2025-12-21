-- Migration: Create wb_category_config table
-- Run this SQL in Supabase SQL Editor

-- Create table
CREATE TABLE IF NOT EXISTS wb_category_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  min_margin_pct NUMERIC NOT NULL,
  ctr_warning NUMERIC NOT NULL,
  cr_order_warning NUMERIC NOT NULL,
  price_step_pct NUMERIC NOT NULL,
  drr_warning NUMERIC NOT NULL,
  stock_critical_days NUMERIC NOT NULL DEFAULT 10,
  stock_overstock_days NUMERIC NOT NULL DEFAULT 120,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default values
INSERT INTO wb_category_config (category, min_margin_pct, ctr_warning, cr_order_warning, price_step_pct, drr_warning, stock_critical_days, stock_overstock_days)
VALUES 
  ('FACE', 25, 2.5, 3.0, 3, 20, 10, 120),
  ('HAIR', 22, 2.0, 2.5, 4, 18, 14, 90),
  ('BODY', 20, 1.8, 2.0, 5, 15, 14, 100),
  ('MAKEUP', 30, 3.0, 4.0, 2, 25, 7, 60)
ON CONFLICT (category) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE wb_category_config ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (everyone can read)
CREATE POLICY "Allow read access" ON wb_category_config
  FOR SELECT USING (true);

-- Create policy for update access (everyone can update for now, restrict later)
CREATE POLICY "Allow update access" ON wb_category_config
  FOR UPDATE USING (true);
