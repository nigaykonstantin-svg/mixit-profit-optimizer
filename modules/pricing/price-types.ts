// ============================================
// PRICE OPTIMIZER V1 - Complete Type System
// ============================================

// Price Actions
export type PriceAction = 'UP' | 'DOWN' | 'HOLD';

// Ads Actions
export type AdsAction = 'SCALE' | 'HOLD' | 'DOWN' | 'PAUSE';

// Reason Codes - comprehensive
export type ReasonCode =
    // Level 1 - Stop signals
    | 'MANUAL_LOCK'
    | 'INSUFFICIENT_DATA'
    | 'COOLDOWN_ACTIVE'
    // Level 2 - Action blocks
    | 'MIN_MARGIN_BLOCK'
    | 'RANK_DROP_BLOCK'
    | 'LOW_STOCK_BLOCK'
    // Level 3 - Gold protection
    | 'GOLD_PROTECTION'
    // Level 4 - Family
    | 'FAMILY_GUARD'
    // Level 5 - Mode rules
    | 'MODE_STOP'
    | 'MODE_CLEAR'
    | 'MODE_COW'
    | 'MODE_GROWTH'
    // Level 6 - Triggers
    | 'CLEAR'
    | 'LOW_STOCK'
    | 'OVERPRICED'
    | 'HOLD_NO_TRIGGER'
    // Ads specific
    | 'ADS_PROFITABLE'
    | 'ADS_UNPROFITABLE'
    | 'ADS_MARGINAL';

// SKU Mode (strategic)
export type SkuMode = 'STOP' | 'CLEAR' | 'COW' | 'GROWTH';

// SKU Role
export type SkuRole = 'HERO' | 'LEADER' | 'TAIL' | 'GOLD';

// Decision trace item
export interface DecisionTraceItem {
    level: number;
    rule: string;
    result: 'PASS' | 'BLOCK' | 'MODIFY';
    detail?: string;
}

// Full input for price engine
export interface PriceEngineInput {
    sku: string;

    // Funnel metrics (7d)
    clicks_7d: number;
    orders_7d: number;
    ctr_pct: number;
    cr_order_pct: number;

    // Revenue
    revenue_7d?: number;

    // Price & stock
    avg_price: number;
    client_price?: number;
    stock_units: number;
    stock_cover_days?: number;

    // DRR breakdown
    drr_search?: number;
    drr_media?: number;
    drr_bloggers?: number;
    total_drr?: number;

    // Ads metrics
    ad_spend_7d?: number;
    ad_orders_7d?: number;
    ad_clicks_7d?: number;

    // Margin
    min_margin_pct?: number;
    current_margin_pct?: number;
    cm0_per_unit?: number;

    // Flags
    is_gold?: boolean;
    sku_mode?: SkuMode;
    sku_role?: SkuRole;
    family_id?: string;
    manual_lock?: boolean;

    // Cooldown
    last_price_change_at?: string | null;
    today?: string;

    // Category (any name - will be normalized internally)
    category?: string;
}

// Full recommendation output
export interface PriceRecommendation {
    sku: string;

    // Price decision
    price_action: PriceAction;
    price_step_pct: number;
    recommended_price: number | null;

    // Ads decision (total)
    ads_action: AdsAction;
    ads_change_pct: number;

    // Ads decision by channel
    ads_search: { action: AdsAction; drr: number; detail: string };
    ads_media: { action: AdsAction; drr: number; detail: string };
    ads_bloggers: { action: AdsAction; drr: number; detail: string };

    // Reason
    reason_code: ReasonCode;
    reason_text: string;

    // Timing
    ttl_days: number;
    next_review_date: string | null;

    // Traceability
    decision_trace: DecisionTraceItem[];
    blocked_actions: string[];

    // Profit metrics
    cpo?: number;           // Cost per order
    profit_per_ad?: number; // Profit per ad order
    projected_profit_change?: number;

    // Debug
    debug?: Record<string, unknown>;
}

// Config types
export interface OptimizerConfig {
    version: string;
    mode: 'shadow' | 'active' | 'ab';

    global: {
        cooldown_price_days: number;
        cooldown_price_days_gold: number;
        min_margin_pct: number;
        max_price_step_pct: number;
        min_price_step_pct: number;
        gold_max_step_pct: number;
        min_clicks_7d: number;
        min_orders_7d: number;
        clear_stock_cover_days: number;
        low_stock_cover_days: number;
        rank_drop_warn: number;
        rank_drop_crit: number;
    };

    drr: {
        excellent: number;
        optimal: number;
        warning: number;
        critical: number;
    };

    categories: Record<string, {
        target_kp_pct: number;
        ctr_high: number;
        ctr_low: number;
        cr_high: number;
        cr_low: number;
    }>;
}
