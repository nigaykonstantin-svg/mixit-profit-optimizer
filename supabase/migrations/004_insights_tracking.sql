-- AI Insights History Table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Role that requested the insight
    role TEXT NOT NULL CHECK (role IN ('leader', 'category_manager', 'mp_manager', 'supply_chain', 'brand_owner', 'marketing')),
    
    -- Category filter (optional)
    category_filter TEXT,
    
    -- The generated insights text
    insights_text TEXT NOT NULL,
    
    -- Snapshot of data at time of generation (for comparison)
    data_snapshot JSONB NOT NULL,
    
    -- Totals at time of generation
    totals_snapshot JSONB NOT NULL
);

-- Index for querying by role and time
CREATE INDEX IF NOT EXISTS idx_ai_insights_role_created ON ai_insights(role, created_at DESC);

-- Price Engine Recommendations History
CREATE TABLE IF NOT EXISTS price_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- SKU this recommendation is for
    sku TEXT NOT NULL,
    
    -- Category
    category TEXT,
    
    -- Recommended action
    recommended_action TEXT NOT NULL, -- e.g., "↓5%", "↑3%", "HOLD", "CRITICAL"
    
    -- Reason for recommendation
    reason_code TEXT, -- e.g., "LOW_CTR", "HIGH_DRR", "LOW_STOCK"
    reason_text TEXT,
    
    -- Current metrics at time of recommendation
    current_price DECIMAL,
    current_revenue DECIMAL,
    current_ctr DECIMAL,
    current_cr DECIMAL,
    current_stock INTEGER,
    
    -- Was this recommendation applied?
    was_applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMPTZ,
    
    -- Result after application (filled later)
    result_revenue_delta DECIMAL,
    result_cr_delta DECIMAL,
    result_notes TEXT
);

-- Indexes for analysis
CREATE INDEX IF NOT EXISTS idx_price_recommendations_sku ON price_recommendations(sku, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_recommendations_applied ON price_recommendations(was_applied, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_recommendations_action ON price_recommendations(recommended_action);

-- View for recommendation effectiveness analysis
CREATE OR REPLACE VIEW recommendation_effectiveness AS
SELECT 
    recommended_action,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE was_applied = true) as applied_count,
    AVG(result_cr_delta) FILTER (WHERE was_applied = true) as avg_cr_delta,
    AVG(result_revenue_delta) FILTER (WHERE was_applied = true) as avg_revenue_delta
FROM price_recommendations
GROUP BY recommended_action;
