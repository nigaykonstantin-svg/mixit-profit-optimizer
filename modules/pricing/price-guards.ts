import { PRICE_ENGINE_CONFIG as C } from './price-config';
import { PriceEngineInput, PriceRecommendation } from './price-types';

function toDateISO(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function addDaysISO(isoDate: string, days: number): string {
    const d = new Date(isoDate + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return toDateISO(d);
}

function daysBetween(aISO: string, bISO: string): number {
    const a = new Date(aISO + 'T00:00:00Z').getTime();
    const b = new Date(bISO + 'T00:00:00Z').getTime();
    return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

export function applyGuards(input: PriceEngineInput): { hold?: PriceRecommendation } {
    const today = input.today || toDateISO(new Date());

    // Guard 1: insufficient data
    if ((input.clicks_7d ?? 0) < C.min_clicks_7d || (input.orders_7d ?? 0) < C.min_orders_7d) {
        return {
            hold: {
                sku: input.sku,
                price_action: 'HOLD',
                price_step_pct: 0,
                recommended_price: null,
                reason_code: 'INSUFFICIENT_DATA',
                ttl_days: C.ttl_days,
                next_review_date: null,
            },
        };
    }

    // Guard 2: cooldown (if last_price_change_at present)
    if (input.last_price_change_at) {
        const last = input.last_price_change_at.slice(0, 10);
        const cd = input.is_gold ? C.gold_cooldown_days : C.cooldown_days;
        const delta = daysBetween(last, today);
        if (delta >= 0 && delta < cd) {
            return {
                hold: {
                    sku: input.sku,
                    price_action: 'HOLD',
                    price_step_pct: 0,
                    recommended_price: null,
                    reason_code: 'COOLDOWN_ACTIVE',
                    ttl_days: C.ttl_days,
                    next_review_date: addDaysISO(last, cd),
                },
            };
        }
    }

    // Guard 3: min margin (only if margin provided)
    // we don't block everything — only block price DOWN; we signal later in engine if needed
    // Here we don't HOLD, because you might still need PRICE UP (e.g. low stock).

    return {};
}
