-- Add kp_pct and client_price columns to wb_funnel table
ALTER TABLE wb_funnel ADD COLUMN IF NOT EXISTS kp_pct NUMERIC DEFAULT 0;
ALTER TABLE wb_funnel ADD COLUMN IF NOT EXISTS client_price NUMERIC DEFAULT 0;
