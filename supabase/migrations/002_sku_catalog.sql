-- SKU Catalog table for storing category mappings
CREATE TABLE IF NOT EXISTS sku_catalog (
    id BIGSERIAL PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    name TEXT,
    brand TEXT DEFAULT 'MIXIT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast SKU lookup
CREATE INDEX IF NOT EXISTS idx_sku_catalog_sku ON sku_catalog(sku);
CREATE INDEX IF NOT EXISTS idx_sku_catalog_category ON sku_catalog(category);

-- Enable RLS (Row Level Security)
ALTER TABLE sku_catalog ENABLE ROW LEVEL SECURITY;

-- Policy for public read/write (adjust for your auth setup)
CREATE POLICY "Allow all access to sku_catalog" ON sku_catalog
    FOR ALL USING (true) WITH CHECK (true);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sku_catalog_updated_at
    BEFORE UPDATE ON sku_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
