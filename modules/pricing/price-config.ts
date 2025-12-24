// ============================================
// PRICE OPTIMIZER V1 - Configuration
// ============================================

import { OptimizerConfig } from './price-types';

export const OPTIMIZER_CONFIG: OptimizerConfig = {
    version: 'v1.0',
    mode: 'shadow', // shadow | active | ab

    global: {
        // Cooldown
        cooldown_price_days: 3,
        cooldown_price_days_gold: 5,

        // Margin
        min_margin_pct: 0.10,

        // Price steps
        max_price_step_pct: 0.05,
        min_price_step_pct: 0.02,
        gold_max_step_pct: 0.02,

        // Data thresholds
        min_clicks_7d: 30,
        min_orders_7d: 10,

        // Stock thresholds
        clear_stock_cover_days: 120,  // >= 120 days = too much stock
        low_stock_cover_days: 10,     // <= 10 days = deficit

        // Rank protection
        rank_drop_warn: 0.85,
        rank_drop_crit: 0.70,
    },

    drr: {
        excellent: 0.06,  // < 6% - excellent
        optimal: 0.10,    // < 10% - optimal
        warning: 0.12,    // < 12% - warning
        critical: 0.12,   // > 12% - critical
    },

    categories: {
        face: {
            target_kp_pct: 0.15,
            ctr_high: 4.5,
            ctr_low: 1.5,
            cr_high: 4.5,
            cr_low: 1.5,
        },
        hair: {
            target_kp_pct: 0.14,
            ctr_high: 4.0,
            ctr_low: 1.5,
            cr_high: 4.0,
            cr_low: 1.3,
        },
        body: {
            target_kp_pct: 0.13,
            ctr_high: 3.5,
            ctr_low: 1.2,
            cr_high: 3.5,
            cr_low: 1.2,
        },
        decor: {
            target_kp_pct: 0.12,
            ctr_high: 5.0,
            ctr_low: 1.5,
            cr_high: 5.0,
            cr_low: 1.5,
        },
    },
};

// ============================================
// DYNAMIC CATEGORY CONFIG CACHE
// ============================================

import { CategoryConfig } from '@/analytics-engine/wb/wb-config-loader';

// Cache for category configs (loaded from Supabase via API)
let categoryConfigCache: Map<string, CategoryConfig> = new Map();
let cacheInitialized = false;

// Default fallback config
const DEFAULT_CONFIG: CategoryConfig = {
    category: 'DEFAULT',
    min_margin_pct: 25,
    ctr_warning: 2.5,
    cr_order_warning: 3.0,
    price_step_pct: 3,
    drr_warning: 20,
    stock_critical_days: 10,
    stock_overstock_days: 120,
};

// Initialize cache (call this on app load)
export async function initializeCategoryConfigCache(): Promise<void> {
    try {
        const response = await fetch('/api/config/categories');
        if (!response.ok) throw new Error('Failed to fetch configs');
        const configs: CategoryConfig[] = await response.json();

        categoryConfigCache.clear();
        configs.forEach(c => {
            categoryConfigCache.set(c.category.toUpperCase(), c);
            categoryConfigCache.set(c.category.toLowerCase(), c);
        });
        cacheInitialized = true;
    } catch (error) {
        console.warn('Failed to load category configs, using defaults:', error);
    }
}

// Set cache directly (used when loading configs)
export function setCategoryConfigCache(configs: CategoryConfig[]): void {
    categoryConfigCache.clear();
    configs.forEach(c => {
        categoryConfigCache.set(c.category.toUpperCase(), c);
        categoryConfigCache.set(c.category.toLowerCase(), c);
    });
    cacheInitialized = true;
}

// Get category config (sync, uses cache)
export function getDynamicCategoryConfig(category?: string): CategoryConfig {
    if (!category) return DEFAULT_CONFIG;

    const cached = categoryConfigCache.get(category.toUpperCase())
        || categoryConfigCache.get(category.toLowerCase());
    if (cached) return cached;

    return DEFAULT_CONFIG;
}

// Legacy helper for static config (used by triggers)
export function getCategoryConfig(category?: string) {
    const config = getDynamicCategoryConfig(category);

    // Map to the format expected by triggers
    return {
        target_kp_pct: config.min_margin_pct / 100,
        ctr_high: config.ctr_warning * 1.5,
        ctr_low: config.ctr_warning * 0.6,
        cr_high: config.cr_order_warning * 1.5,
        cr_low: config.cr_order_warning * 0.6,
        min_margin_pct: config.min_margin_pct,
        price_step_pct: config.price_step_pct,
        drr_warning: config.drr_warning,
        stock_critical_days: config.stock_critical_days,
        stock_overstock_days: config.stock_overstock_days,
    };
}

// Reason code to human-readable text
export const REASON_TEXTS: Record<string, string> = {
    // Level 1
    MANUAL_LOCK: 'Ручная блокировка',
    INSUFFICIENT_DATA: 'Недостаточно данных',
    COOLDOWN_ACTIVE: 'Пауза после изменения',
    // Level 2
    MIN_MARGIN_BLOCK: 'Минимальная маржа',
    RANK_DROP_BLOCK: 'Защита позиции',
    LOW_STOCK_BLOCK: 'Низкий сток',
    // Level 3
    GOLD_PROTECTION: 'Защита Gold SKU',
    // Level 4
    FAMILY_GUARD: 'Семейная защита',
    // Level 5
    MODE_STOP: 'Режим STOP',
    MODE_CLEAR: 'Режим CLEAR',
    MODE_COW: 'Режим COW',
    MODE_GROWTH: 'Режим GROWTH',
    // Level 6
    CLEAR: 'Много стока → снизить цену',
    LOW_STOCK: 'Дефицит → поднять цену',
    OVERPRICED: 'Переоценено → снизить цену',
    HOLD_NO_TRIGGER: 'Без изменений',
    // Ads
    ADS_PROFITABLE: 'Реклама прибыльна',
    ADS_UNPROFITABLE: 'Реклама убыточна',
    ADS_MARGINAL: 'Реклама на грани',
};

export function getReasonText(code: string): string {
    return REASON_TEXTS[code] || code;
}
