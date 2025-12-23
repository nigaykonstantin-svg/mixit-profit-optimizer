// =========================================
// PRICING ENGINE - Types & Interfaces
// =========================================

/**
 * SKU strategic mode
 */
export type SkuMode =
    | 'STOP'      // Убыточный - остановить
    | 'CLEAR'     // Распродажа - ликвидировать
    | 'COW'       // Дойная корова - стабильный
    | 'GROWTH';   // Рост - масштабировать

/**
 * Price change actions
 */
export type PriceAction =
    | 'UP'
    | 'DOWN'
    | 'HOLD';

/**
 * Advertising actions
 */
export type AdsAction = 'SCALE' | 'DOWN' | 'PAUSE' | 'HOLD';

/**
 * Reasons for blocking price change
 */
export type BlockReason =
    | 'INSUFFICIENT_DATA'    // Недостаточно данных
    | 'COOLDOWN_ACTIVE'      // Период ожидания после изменения
    | 'MIN_MARGIN_BLOCK'     // Минимальная маржа достигнута
    | 'LOW_STOCK_GUARD'      // Защита от OOS
    | 'RANK_DROP_CRITICAL'   // Критическое падение позиции
    | 'MANUAL_LOCK';         // Ручная блокировка

/**
 * SKU pricing decision
 */
export interface PricingDecision {
    sku: string;

    mode: SkuMode;
    action: PriceAction;

    price_step_pct: number;     // -0.03, +0.05, 0
    ads_action: AdsAction;

    expected_profit_delta: number;

    block_reason?: BlockReason;
    confidence_score: number;   // 0-1

    explanation: string;        // 🔥 ТЕКСТ ДЛЯ UI
}

/**
 * Configuration thresholds
 */
export interface PricingConfig {
    // Stock thresholds (days of cover)
    lowStockDays: number;      // default: 10
    overstockDays: number;     // default: 120

    // DRR thresholds (%)
    drrWarning: number;        // default: 20
    drrCritical: number;       // default: 30

    // Conversion thresholds (%)
    ctrWarning: number;        // default: 2
    crOrderWarning: number;    // default: 1.5

    // Price step limits (%)
    minPriceStep: number;      // default: 0.02 (2%)
    maxPriceStep: number;      // default: 0.10 (10%)

    // Margin
    minMarginPct: number;      // default: 0.15 (15%)

    // Cooldown (hours)
    priceChangeCooldown: number; // default: 24
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
    client_price: number;
    profit?: number;
    margin_pct?: number;

    // Competitors
    competitor_price_min?: number;
    competitor_price_avg?: number;

    // Stock
    stock_units: number;
    stock_cover_days?: number;

    // DRR
    drr_search: number;
    drr_media: number;
    drr_bloggers: number;
    drr_other: number;
    total_drr?: number;

    // History (for blocking logic)
    last_price_change?: Date;
    manual_lock?: boolean;
    rank_position?: number;
    rank_change_7d?: number;
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
    minPriceStep: 0.02,
    maxPriceStep: 0.10,
    minMarginPct: 0.15,
    priceChangeCooldown: 24,
};
