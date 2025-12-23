export const PRICE_ENGINE_CONFIG = {
    // Data guard
    min_clicks_7d: 30,
    min_orders_7d: 10,

    // Price triggers thresholds
    ctr_ok_pct: 1.5,
    cr_order_low_pct: 1.5,

    // Stock cover
    clear_stock_cover_days: 120,
    low_stock_cover_days: 10,

    // Steps
    step_down_pct: -3,
    step_up_pct: 5,

    // TTL & cooldown
    ttl_days: 7,
    cooldown_days: 3,
    gold_cooldown_days: 5,
    gold_max_abs_step_pct: 2,

    // Min margin guard (only if margin provided)
    min_margin_pct: 10, // %
};
