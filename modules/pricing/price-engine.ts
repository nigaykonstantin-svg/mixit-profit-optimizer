// =========================================
// PRICE ENGINE - Core Price Decision Logic
// =========================================

import { FunnelRow } from '@/modules/import/funnel-parser';
import { PriceAction, PricingDecision, AdsAction, SkuMode, BlockReason } from './types';

// =========================================
// GUARDS - Safety checks
// =========================================

interface GuardResult {
    blocked: boolean;
    reason?: BlockReason;
}

function checkGuards(row: FunnelRow): GuardResult {
    if (row.clicks < 30 || row.orders < 10) {
        return { blocked: true, reason: 'INSUFFICIENT_DATA' };
    }

    if (row.stock_units < 10) {
        return { blocked: true, reason: 'LOW_STOCK_GUARD' };
    }

    return { blocked: false };
}

// =========================================
// MODE ENGINE - Detect SKU mode
// =========================================

function detectMode(row: FunnelRow): SkuMode {
    if (row.revenue <= 0) return 'STOP';

    const stock_cover_days = row.stock_units / Math.max(row.orders, 1);

    if (stock_cover_days >= 120) return 'CLEAR';
    if (row.revenue > 0 && stock_cover_days >= 15) return 'COW';

    return 'GROWTH';
}

// =========================================
// PRICE DECISION
// =========================================

export function priceDecision(row: FunnelRow): {
    action: PriceAction;
    step: number;
} {
    const stock_cover_days = row.stock_units / Math.max(row.orders, 1);

    // CLEAR: too much stock
    if (stock_cover_days >= 120) {
        return { action: 'DOWN', step: -0.03 };
    }

    // LOW_STOCK: raise price to slow sales
    if (stock_cover_days <= 10) {
        return { action: 'UP', step: +0.05 };
    }

    // OVERPRICED: high CTR but low CR
    if (row.ctr >= 1.5 && row.cr_order < 1.5) {
        return { action: 'DOWN', step: -0.03 };
    }

    return { action: 'HOLD', step: 0 };
}

// =========================================
// DRR & ADS DECISION
// =========================================

export function calculateTotalDRR(row: FunnelRow): number {
    return (row.drr_search || 0) +
        (row.drr_media || 0) +
        (row.drr_bloggers || 0) +
        (row.drr_other || 0);
}

export function adsDecision(row: FunnelRow): AdsAction {
    const totalDRR = calculateTotalDRR(row);

    if (totalDRR > 30) return 'PAUSE';
    if (totalDRR > 20) return 'DOWN';
    if (totalDRR < 10 && row.cr_order > 2) return 'SCALE';

    return 'HOLD';
}

// =========================================
// FULL DECISION FOR SKU
// =========================================

export function getDecisionForSku(row: FunnelRow): PricingDecision {
    // Check guards first
    const guard = checkGuards(row);

    if (guard.blocked) {
        return {
            sku: row.sku,
            mode: detectMode(row),
            action: 'HOLD',
            price_step_pct: 0,
            ads_action: 'HOLD',
            expected_profit_delta: 0,
            block_reason: guard.reason,
            confidence_score: 0,
            explanation: `Блокировка: ${guard.reason}`,
        };
    }

    // Get mode and decisions
    const mode = detectMode(row);
    const price = priceDecision(row);
    const ads = adsDecision(row);

    // Build explanation
    const explanations: string[] = [];

    if (mode === 'STOP') explanations.push('Убыточный SKU');
    if (mode === 'CLEAR') explanations.push('Переизбыток стока');
    if (mode === 'COW') explanations.push('Дойная корова');
    if (mode === 'GROWTH') explanations.push('Потенциал роста');

    if (price.action === 'UP') explanations.push(`Повысить цену на ${Math.abs(price.step * 100)}%`);
    if (price.action === 'DOWN') explanations.push(`Снизить цену на ${Math.abs(price.step * 100)}%`);

    if (ads === 'PAUSE') explanations.push('Остановить рекламу');
    if (ads === 'DOWN') explanations.push('Снизить рекламу');
    if (ads === 'SCALE') explanations.push('Масштабировать рекламу');

    return {
        sku: row.sku,
        mode,
        action: price.action,
        price_step_pct: price.step,
        ads_action: ads,
        expected_profit_delta: 0,
        confidence_score: 0.8,
        explanation: explanations.join('. '),
    };
}

// =========================================
// BATCH ANALYSIS
// =========================================

export function analyzeAllSkus(rows: FunnelRow[]): PricingDecision[] {
    return rows
        .filter(row => row.sku)
        .map(getDecisionForSku);
}

export function getActionableSkus(rows: FunnelRow[]): PricingDecision[] {
    return analyzeAllSkus(rows)
        .filter(d => d.action !== 'HOLD' || d.ads_action !== 'HOLD');
}
