// ================================
// ELASTICITY CONFIG
// ================================

export const CONFIG = {
    excludeDates: [
        '2024-11-26',
        '2024-11-27',
        '2024-11-28',
        '2024-11-29',
        '2024-11-30',
    ],

    minDaysPriceConstant: 2,
    minOrders: 50,

    priceBuckets: [-0.1, -0.05, 0, 0.03, 0.05],
    adBuckets: [0, 0.5, 1, 1.2],
};

export const EXCLUDED_DATES = new Set(CONFIG.excludeDates);
