-- Migration: Create FACT2026 table for WB data
-- Run this SQL in Supabase SQL Editor

-- Create FACT2026 table
CREATE TABLE IF NOT EXISTS fact2026 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  sku TEXT NOT NULL,
  
  -- Sales data
  price NUMERIC,
  revenue NUMERIC,
  
  -- Order funnel
  views INTEGER,
  clicks INTEGER,
  cart INTEGER,
  orders INTEGER,
  
  -- Conversion rates
  ctr NUMERIC,
  cr_cart NUMERIC,
  cr_order NUMERIC,
  
  -- Stock
  stock INTEGER,
  
  -- Advertising DRR
  drr_search NUMERIC,
  drr_media NUMERIC,
  drr_bloggers NUMERIC,
  drr_other NUMERIC,
  
  -- Metadata
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT, -- 'wb_sales', 'wb_orders', 'wb_stock', 'wb_advertising'
  
  -- Unique constraint on date + sku
  UNIQUE(date, sku)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_fact2026_date ON fact2026(date);
CREATE INDEX IF NOT EXISTS idx_fact2026_sku ON fact2026(sku);
CREATE INDEX IF NOT EXISTS idx_fact2026_date_sku ON fact2026(date, sku);

-- Enable RLS
ALTER TABLE fact2026 ENABLE ROW LEVEL SECURITY;

-- Allow read access
CREATE POLICY "Allow read access" ON fact2026
  FOR SELECT USING (true);

-- Allow insert access
CREATE POLICY "Allow insert access" ON fact2026
  FOR INSERT WITH CHECK (true);

-- Allow update access (for upsert)
CREATE POLICY "Allow update access" ON fact2026
  FOR UPDATE USING (true);
