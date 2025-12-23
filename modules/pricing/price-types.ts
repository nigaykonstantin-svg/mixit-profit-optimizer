export type PriceAction = 'UP' | 'DOWN' | 'HOLD';

export type ReasonCode =
    | 'INSUFFICIENT_DATA'
    | 'COOLDOWN_ACTIVE'
    | 'MIN_MARGIN_BLOCK'
    | 'HOLD_NO_TRIGGER'
    | 'CLEAR'
    | 'LOW_STOCK'
    | 'OVERPRICED'
    | 'GOLD_PROTECTION';

export interface PriceEngineInput {
    sku: string;

    // Funnel metrics (per period you analyze, e.g. 7d)
    clicks_7d: number;
    orders_7d: number;
    ctr_pct: number;       // CTR in %
    cr_order_pct: number;  // CR order in %

    // Price & stock
    avg_price: number;         // current avg price
    client_price?: number;     // (optional) client price / buyer price
    stock_units: number;       // current stock units
    stock_cover_days?: number; // if you have it (optional, if not -> will derive from orders_7d)

    // Guards
    min_margin_pct?: number;   // if you have margin. If not -> ignore min margin guard safely
    is_gold?: boolean;

    // Cooldown (optional now; wire later)
    last_price_change_at?: string | null; // ISO date string
    today?: string; // ISO date string
}

export interface PriceRecommendation {
    sku: string;

    price_action: PriceAction;
    price_step_pct: number;           // 0, +5, -3, etc.
    recommended_price: number | null; // current_price * (1 + step)
    reason_code: ReasonCode;

    ttl_days: number;                 // 7
    next_review_date: string | null;   // ISO date

    debug?: Record<string, unknown>;
}
