// ================================
// ELASTICITY CONFIG
// ================================

export const ELASTICITY_CONFIG = {
    // Minimum data requirements
    minDaysForElasticity: 14,      // min days of data per SKU
    minOrdersForAnalysis: 10,      // min orders per SKU

    // Rolling window
    rollingWindowDays: 30,

    // Price change detection threshold
    minPriceChangePct: 0.02,       // 2% change to be considered

    // Elasticity thresholds
    elasticity: {
        highlyElastic: -1.5,       // very sensitive
        elastic: -1,               // normal sensitivity
        inelastic: -0.3,           // low sensitivity
        giffen: 0,                 // positive = raise price OK
    },

    // Dates to exclude (promotions, anomalies)
    excludeDates: [
        '2024-11-26',
        '2024-11-27',
        '2024-11-28',
        '2024-11-29',
        '2024-11-30',
    ],

    // SKUs to exclude from analysis
    excludeSkus: [] as string[],
};

export type ElasticityConfig = typeof ELASTICITY_CONFIG;
