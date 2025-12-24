// ============================================
// PRICE OPTIMIZER V1 - Main Engine
// ============================================

import {
    PriceEngineInput,
    PriceRecommendation,
    PriceAction,
    AdsAction,
    ReasonCode,
    DecisionTraceItem,
} from './price-types';
import { OPTIMIZER_CONFIG, getCategoryConfig, getReasonText } from './price-config';
import { applyAllGuards } from './price-guards';

const CONFIG = OPTIMIZER_CONFIG.global;

// ============================================
// 3 TRIGGERS (the only reasons to change price)
// ============================================

interface TriggerResult {
    triggered: boolean;
    action: PriceAction;
    step_pct: number;
    reason: ReasonCode;
    detail: string;
}

// A) CLEAR — too much stock
function checkClearTrigger(input: PriceEngineInput): TriggerResult {
    const stockCover = input.stock_cover_days ??
        (input.orders_7d > 0 ? (input.stock_units / input.orders_7d) * 7 : 999);

    if (stockCover >= CONFIG.clear_stock_cover_days) {
        return {
            triggered: true,
            action: 'DOWN',
            step_pct: -0.03, // -3%
            reason: 'CLEAR',
            detail: `stock_cover ${stockCover.toFixed(0)}d >= ${CONFIG.clear_stock_cover_days}d`,
        };
    }
    return { triggered: false, action: 'HOLD', step_pct: 0, reason: 'HOLD_NO_TRIGGER', detail: '' };
}

// B) LOW_STOCK — deficit
function checkLowStockTrigger(input: PriceEngineInput): TriggerResult {
    const stockCover = input.stock_cover_days ??
        (input.orders_7d > 0 ? (input.stock_units / input.orders_7d) * 7 : 999);

    if (stockCover <= CONFIG.low_stock_cover_days) {
        return {
            triggered: true,
            action: 'UP',
            step_pct: 0.05, // +5%
            reason: 'LOW_STOCK',
            detail: `stock_cover ${stockCover.toFixed(0)}d <= ${CONFIG.low_stock_cover_days}d`,
        };
    }
    return { triggered: false, action: 'HOLD', step_pct: 0, reason: 'HOLD_NO_TRIGGER', detail: '' };
}

// C) OVERPRICED — clicks but no orders
function checkOverpricedTrigger(input: PriceEngineInput): TriggerResult {
    const categoryConfig = getCategoryConfig(input.category);

    // CTR is good but CR is low
    if (input.ctr_pct >= categoryConfig.ctr_low && input.cr_order_pct < categoryConfig.cr_low) {
        return {
            triggered: true,
            action: 'DOWN',
            step_pct: -0.03, // -3%
            reason: 'OVERPRICED',
            detail: `CTR ${input.ctr_pct.toFixed(2)}% ok, CR ${input.cr_order_pct.toFixed(2)}% < ${categoryConfig.cr_low}%`,
        };
    }
    return { triggered: false, action: 'HOLD', step_pct: 0, reason: 'HOLD_NO_TRIGGER', detail: '' };
}

// ============================================
// ADS OPTIMIZER (Profit-based + DRR fallback)
// ============================================

interface AdsResult {
    action: AdsAction;
    change_pct: number;
    reason: ReasonCode;
    cpo: number;
    profit_per_ad: number;
    detail: string;
}

function optimizeAds(input: PriceEngineInput): AdsResult {
    const DRR_CONFIG = OPTIMIZER_CONFIG.drr;

    // If we have ad spend data, use profit-based optimization
    if (input.ad_spend_7d && input.ad_orders_7d && input.ad_orders_7d > 0) {
        const cpo = input.ad_spend_7d / input.ad_orders_7d;
        const cm0 = input.cm0_per_unit ?? (input.avg_price * (input.current_margin_pct ?? 0.15));
        const profitPerAd = cm0 - cpo;

        if (profitPerAd <= 0) {
            return {
                action: 'DOWN',
                change_pct: -0.50,
                reason: 'ADS_UNPROFITABLE',
                cpo,
                profit_per_ad: profitPerAd,
                detail: `CPO ${cpo.toFixed(0)}₽ >= CM0 ${cm0.toFixed(0)}₽`,
            };
        }

        if (profitPerAd > cm0 * 0.3) {
            return {
                action: 'SCALE',
                change_pct: 0.20,
                reason: 'ADS_PROFITABLE',
                cpo,
                profit_per_ad: profitPerAd,
                detail: `Profit/ad ${profitPerAd.toFixed(0)}₽ > 30% CM0`,
            };
        }

        return {
            action: 'HOLD',
            change_pct: 0,
            reason: 'ADS_MARGINAL',
            cpo,
            profit_per_ad: profitPerAd,
            detail: `Marginal profit ${profitPerAd.toFixed(0)}₽`,
        };
    }

    // Fallback: use DRR data for recommendations
    const totalDrr = input.total_drr ?? 0;

    // DRR > critical (12%) → снизить рекламу
    if (totalDrr > DRR_CONFIG.critical) {
        return {
            action: 'DOWN',
            change_pct: -0.30,
            reason: 'ADS_UNPROFITABLE',
            cpo: 0,
            profit_per_ad: 0,
            detail: `DRR ${(totalDrr * 100).toFixed(1)}% > ${(DRR_CONFIG.critical * 100).toFixed(0)}%`,
        };
    }

    // DRR > warning (10%) → держать/чуть снизить
    if (totalDrr > DRR_CONFIG.warning) {
        return {
            action: 'HOLD',
            change_pct: 0,
            reason: 'ADS_MARGINAL',
            cpo: 0,
            profit_per_ad: 0,
            detail: `DRR ${(totalDrr * 100).toFixed(1)}% — на грани`,
        };
    }

    // DRR < excellent (6%) → можно масштабировать
    if (totalDrr > 0 && totalDrr < DRR_CONFIG.excellent) {
        return {
            action: 'SCALE',
            change_pct: 0.20,
            reason: 'ADS_PROFITABLE',
            cpo: 0,
            profit_per_ad: 0,
            detail: `DRR ${(totalDrr * 100).toFixed(1)}% < ${(DRR_CONFIG.excellent * 100).toFixed(0)}% — отлично`,
        };
    }

    // DRR в норме (6-10%)
    if (totalDrr > 0) {
        return {
            action: 'HOLD',
            change_pct: 0,
            reason: 'HOLD_NO_TRIGGER',
            cpo: 0,
            profit_per_ad: 0,
            detail: `DRR ${(totalDrr * 100).toFixed(1)}% — норма`,
        };
    }

    // No DRR data
    return {
        action: 'HOLD',
        change_pct: 0,
        reason: 'HOLD_NO_TRIGGER',
        cpo: 0,
        profit_per_ad: 0,
        detail: 'No ads data',
    };
}

// ============================================
// MAIN ENGINE
// ============================================

export function priceEngineV1(input: PriceEngineInput): PriceRecommendation {
    const today = input.today ?? new Date().toISOString().split('T')[0];
    const decisionTrace: DecisionTraceItem[] = [];

    // Step 1: Apply guards
    const guards = applyAllGuards(input, 0);
    decisionTrace.push(...guards.decision_trace);

    // If guards block everything, return HOLD
    if (!guards.can_change_price) {
        const adsResult = optimizeAds(input);

        return {
            sku: input.sku,
            price_action: 'HOLD',
            price_step_pct: 0,
            recommended_price: null,
            ads_action: guards.ads_action_allowed.includes(adsResult.action) ? adsResult.action : 'HOLD',
            ads_change_pct: guards.ads_action_allowed.includes(adsResult.action) ? adsResult.change_pct : 0,
            reason_code: guards.blocking_reason ?? 'HOLD_NO_TRIGGER',
            reason_text: getReasonText(guards.blocking_reason ?? 'HOLD_NO_TRIGGER'),
            ttl_days: 7,
            next_review_date: addDays(today, 7),
            decision_trace: decisionTrace,
            blocked_actions: guards.blocked_actions,
            cpo: adsResult.cpo,
            profit_per_ad: adsResult.profit_per_ad,
        };
    }

    // Step 2: Check triggers in priority order
    // Priority: LOW_STOCK > CLEAR > OVERPRICED
    let trigger: TriggerResult = { triggered: false, action: 'HOLD', step_pct: 0, reason: 'HOLD_NO_TRIGGER', detail: '' };

    const lowStock = checkLowStockTrigger(input);
    if (lowStock.triggered) {
        trigger = lowStock;
        decisionTrace.push({
            level: 5,
            rule: 'TRIGGER_LOW_STOCK',
            result: 'PASS',
            detail: lowStock.detail,
        });
    } else {
        const clear = checkClearTrigger(input);
        if (clear.triggered) {
            trigger = clear;
            decisionTrace.push({
                level: 5,
                rule: 'TRIGGER_CLEAR',
                result: 'PASS',
                detail: clear.detail,
            });
        } else {
            const overpriced = checkOverpricedTrigger(input);
            if (overpriced.triggered) {
                trigger = overpriced;
                decisionTrace.push({
                    level: 5,
                    rule: 'TRIGGER_OVERPRICED',
                    result: 'PASS',
                    detail: overpriced.detail,
                });
            }
        }
    }

    // Step 3: Apply Gold protection limit
    let finalStep = trigger.step_pct;
    if (input.is_gold && Math.abs(finalStep) > CONFIG.gold_max_step_pct) {
        finalStep = finalStep > 0 ? CONFIG.gold_max_step_pct : -CONFIG.gold_max_step_pct;
        decisionTrace.push({
            level: 3,
            rule: 'GOLD_STEP_LIMIT',
            result: 'MODIFY',
            detail: `Step limited to ±${(CONFIG.gold_max_step_pct * 100).toFixed(0)}%`,
        });
    }

    // Step 4: Check if action is allowed
    const priceAction = trigger.action;
    if (priceAction === 'DOWN' && guards.blocked_actions.includes('PRICE_DOWN')) {
        finalStep = 0;
        trigger.reason = 'MIN_MARGIN_BLOCK';
    }
    if (priceAction === 'UP' && guards.blocked_actions.includes('PRICE_UP')) {
        finalStep = 0;
        trigger.reason = 'RANK_DROP_BLOCK';
    }

    // Step 5: Calculate recommended price
    const recommendedPrice = finalStep !== 0
        ? Math.round(input.avg_price * (1 + finalStep))
        : null;

    // Step 6: Optimize ads
    const adsResult = optimizeAds(input);
    const finalAdsAction = guards.ads_action_allowed.includes(adsResult.action) ? adsResult.action : 'HOLD';

    return {
        sku: input.sku,
        price_action: finalStep > 0 ? 'UP' : finalStep < 0 ? 'DOWN' : 'HOLD',
        price_step_pct: finalStep,
        recommended_price: recommendedPrice,
        ads_action: finalAdsAction,
        ads_change_pct: finalAdsAction === adsResult.action ? adsResult.change_pct : 0,
        reason_code: trigger.reason,
        reason_text: getReasonText(trigger.reason),
        ttl_days: 7,
        next_review_date: addDays(today, 7),
        decision_trace: decisionTrace,
        blocked_actions: guards.blocked_actions,
        cpo: adsResult.cpo,
        profit_per_ad: adsResult.profit_per_ad,
        debug: {
            trigger_detail: trigger.detail,
            ads_detail: adsResult.detail,
        },
    };
}

// Helper to add days
function addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

// ============================================
// BATCH PROCESSING
// ============================================

export function runPriceOptimizer(inputs: PriceEngineInput[]): PriceRecommendation[] {
    return inputs.map(input => priceEngineV1(input));
}
