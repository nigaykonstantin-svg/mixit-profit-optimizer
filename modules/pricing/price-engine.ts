import { PRICE_ENGINE_CONFIG as C } from './price-config';
import { applyGuards } from './price-guards';
import { PriceEngineInput, PriceRecommendation } from './price-types';

function toDateISO(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function addDaysISO(isoDate: string, days: number): string {
    const d = new Date(isoDate + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return toDateISO(d);
}

function clampAbsStepForGold(stepPct: number): number {
    const maxAbs = C.gold_max_abs_step_pct;
    if (stepPct > maxAbs) return maxAbs;
    if (stepPct < -maxAbs) return -maxAbs;
    return stepPct;
}

function roundPrice(p: number): number {
    if (!isFinite(p) || p <= 0) return 0;
    return Math.round(p);
}

function computeStockCoverDays(input: PriceEngineInput): number | null {
    if (typeof input.stock_cover_days === 'number' && isFinite(input.stock_cover_days)) {
        return input.stock_cover_days;
    }
    const orders7 = input.orders_7d ?? 0;
    const stock = input.stock_units ?? 0;
    const salesPerDay = orders7 / 7;
    if (salesPerDay <= 0) return null;
    return stock / salesPerDay;
}

export function priceEngineV1(input: PriceEngineInput): PriceRecommendation {
    const today = input.today || toDateISO(new Date());

    // 1) GUARDS
    const guards = applyGuards(input);
    if (guards.hold) return guards.hold;

    const stockCover = computeStockCoverDays(input);

    // 2) TRIGGERS (only 3)
    let action: PriceRecommendation['price_action'] = 'HOLD';
    let stepPct = 0;
    let reason: PriceRecommendation['reason_code'] = 'HOLD_NO_TRIGGER';

    // Trigger A: CLEAR
    if (stockCover !== null && stockCover >= C.clear_stock_cover_days) {
        action = 'DOWN';
        stepPct = C.step_down_pct;
        reason = 'CLEAR';
    }

    // Trigger B: LOW STOCK (higher priority than CLEAR)
    if (stockCover !== null && stockCover <= C.low_stock_cover_days) {
        action = 'UP';
        stepPct = C.step_up_pct;
        reason = 'LOW_STOCK';
    }

    // Trigger C: OVERPRICED (only if not LOW STOCK)
    if (reason === 'HOLD_NO_TRIGGER' || reason === 'CLEAR') {
        const ctr = input.ctr_pct ?? 0;
        const crOrder = input.cr_order_pct ?? 0;
        if (ctr >= C.ctr_ok_pct && crOrder < C.cr_order_low_pct) {
            action = 'DOWN';
            stepPct = C.step_down_pct;
            reason = 'OVERPRICED';
        }
    }

    // 3) MIN MARGIN BLOCK (block only DOWN)
    const hasMargin = typeof input.min_margin_pct === 'number' && isFinite(input.min_margin_pct);
    if (action === 'DOWN' && hasMargin && (input.min_margin_pct as number) < C.min_margin_pct) {
        action = 'HOLD';
        stepPct = 0;
        reason = 'MIN_MARGIN_BLOCK';
    }

    // 4) GOLD PROTECTION (clamp step + optional additional rule later)
    if (input.is_gold) {
        stepPct = clampAbsStepForGold(stepPct);
        if (stepPct === 0) {
            action = 'HOLD';
            reason = 'GOLD_PROTECTION';
        }
    }

    const currentPrice = input.avg_price ?? 0;
    const recommended = action === 'HOLD'
        ? null
        : roundPrice(currentPrice * (1 + stepPct / 100));

    const nextReview = (action === 'HOLD') ? null : addDaysISO(today, C.ttl_days);

    return {
        sku: input.sku,
        price_action: action,
        price_step_pct: stepPct,
        recommended_price: recommended,
        reason_code: reason,
        ttl_days: C.ttl_days,
        next_review_date: nextReview,
        debug: {
            stock_cover_days: stockCover,
            ctr_pct: input.ctr_pct,
            cr_order_pct: input.cr_order_pct,
            avg_price: input.avg_price,
            stock_units: input.stock_units,
            clicks_7d: input.clicks_7d,
            orders_7d: input.orders_7d,
        },
    };
}
