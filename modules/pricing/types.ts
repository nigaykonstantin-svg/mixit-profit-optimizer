// =========================================
// PRICING ENGINE - Types & Interfaces
// =========================================

/**
 * SKU pricing decision
 */
export interface PricingDecision {
    sku: string;
    action: PriceAction;
    adsAction: AdsAction;
    reason: DecisionReason;
    priority: number;
    details: string;
}

/**
 * Price change actions
 */
export type PriceAction = 'up' | 'down' | 'hold';

/**
 * Advertising actions
 */
export type AdsAction = 'scale' | 'hold' | 'reduce' | 'pause';

/**
 * Decision reasons (priority order)
 */
export type DecisionReason =
    | 'STOP'        // profit <= 0
    | 'CLEAR'       // overstocked
    | 'LOW_STOCK'   // running out
    | 'OVERPRICED'  // high CTR, low CR
    | 'DRR_SPIKE'   // ads too expensive
    | 'ELASTIC'     // sensitive to price
    | 'INELASTIC'   // can raise price
    | 'PREMIUM'     // can raise aggressively
    | 'NORMAL';     // all good

/**
 * Configuration thresholds
 */
export interface PricingConfig {
    // Stock thresholds
    lowStockDays: number;      // default: 10
    overstockDays: number;     // default: 120

    // DRR thresholds
    drrWarning: number;        // default: 20%
    drrCritical: number;       // default: 30%

    // Conversion thresholds
    ctrWarning: number;        // default: 2%
    crOrderWarning: number;    // default: 1.5%

    // Elasticity thresholds
    elasticityHigh: number;    // default: -1
    elasticityLow: number;     // default: -0.3
}

/**
 * SKU data for analysis
 */
export interface SkuData {
    sku: string;

    // Funnel
    views: number;
    clicks: number;
    cart: number;
    orders: number;

    // Rates
    ctr: number;
    cr_cart: number;
    cr_order: number;

    // Money
    revenue: number;
    avg_price: number;
    profit?: number;

    // Stock
    stock_units: number;
    stock_cover_days?: number;

    // DRR
    drr_search: number;
    drr_media: number;
    drr_bloggers: number;
    drr_other: number;
    total_drr?: number;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: PricingConfig = {
    lowStockDays: 10,
    overstockDays: 120,
    drrWarning: 20,
    drrCritical: 30,
    ctrWarning: 2,
    crOrderWarning: 1.5,
    elasticityHigh: -1,
    elasticityLow: -0.3,
};
