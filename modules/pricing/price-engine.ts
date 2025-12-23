// =========================================
// PRICE ENGINE - Core Decision Logic
// =========================================

import {
    PricingDecision,
    PricingConfig,
    SkuData,
    DEFAULT_CONFIG,
    PriceAction,
    AdsAction,
    DecisionReason
} from './types';

/**
 * Calculate total DRR for SKU
 */
export function calculateTotalDRR(sku: SkuData): number {
    return (sku.drr_search || 0) +
        (sku.drr_media || 0) +
        (sku.drr_bloggers || 0) +
        (sku.drr_other || 0);
}

/**
 * Get pricing decision for a single SKU
 * Rules are applied in priority order
 */
export function getDecisionForSku(
    sku: SkuData,
    config: PricingConfig = DEFAULT_CONFIG
): PricingDecision {
    const totalDRR = calculateTotalDRR(sku);

    // TODO: User will provide complete logic
    // Placeholder implementation

    // Rule 1: STOP - unprofitable
    if (sku.profit !== undefined && sku.profit <= 0) {
        return decision(sku.sku, 'up', 'pause', 'STOP', 1, 'Убыточный SKU');
    }

    // Rule 2: CLEAR - overstocked
    if (sku.stock_cover_days !== undefined && sku.stock_cover_days >= config.overstockDays) {
        return decision(sku.sku, 'down', 'hold', 'CLEAR', 2, 'Переизбыток стока');
    }

    // Rule 3: LOW_STOCK
    if (sku.stock_cover_days !== undefined && sku.stock_cover_days <= config.lowStockDays) {
        return decision(sku.sku, 'up', 'reduce', 'LOW_STOCK', 3, 'Мало стока');
    }

    // Rule 4: OVERPRICED
    if (sku.ctr >= config.ctrWarning && sku.cr_order < config.crOrderWarning) {
        return decision(sku.sku, 'down', 'hold', 'OVERPRICED', 4, 'Высокий CTR, низкий CR');
    }

    // Rule 5: DRR_SPIKE
    if (totalDRR > config.drrWarning) {
        return decision(sku.sku, 'hold', 'reduce', 'DRR_SPIKE', 5, `DRR ${totalDRR.toFixed(1)}%`);
    }

    // Default
    return decision(sku.sku, 'hold', 'hold', 'NORMAL', 99, 'Всё в норме');
}

/**
 * Analyze all SKUs and return decisions
 */
export function analyzeAllSkus(
    skus: SkuData[],
    config: PricingConfig = DEFAULT_CONFIG
): PricingDecision[] {
    return skus
        .map(sku => getDecisionForSku(sku, config))
        .sort((a, b) => a.priority - b.priority);
}

/**
 * Get SKUs that need attention (not NORMAL)
 */
export function getActionableSkus(
    skus: SkuData[],
    config?: PricingConfig
): PricingDecision[] {
    return analyzeAllSkus(skus, config)
        .filter(d => d.reason !== 'NORMAL');
}

// Helper
function decision(
    sku: string,
    action: PriceAction,
    adsAction: AdsAction,
    reason: DecisionReason,
    priority: number,
    details: string
): PricingDecision {
    return { sku, action, adsAction, reason, priority, details };
}
