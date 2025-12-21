// WB Config - Wildberries configuration and thresholds

export const WB_CONFIG = {
    // Commission rates by category
    commissionRates: {
        default: 0.15,
        cosmetics: 0.12,
        haircare: 0.14,
        makeup: 0.13,
    },

    // Stock thresholds
    stockThresholds: {
        critical: 7, // days
        low: 14,
        normal: 30,
        high: 60,
    },

    // Advertising thresholds
    advertisingThresholds: {
        targetDrr: 15, // %
        maxDrr: 25,
        minCtr: 0.5, // %
        targetCtr: 2.0,
    },

    // Margin thresholds
    marginThresholds: {
        critical: 10, // %
        low: 20,
        target: 35,
        high: 50,
    },

    // Growth thresholds
    growthThresholds: {
        declining: -10, // %
        stable: 5,
        growing: 20,
        rapid: 50,
    },

    // API endpoints (for future use)
    api: {
        baseUrl: 'https://suppliers-api.wildberries.ru',
        statsUrl: 'https://statistics-api.wildberries.ru',
        adsUrl: 'https://advert-api.wb.ru',
    },
} as const;

export type WbCategory = keyof typeof WB_CONFIG.commissionRates;
export type StockLevel = 'critical' | 'low' | 'normal' | 'high';
export type MarginLevel = 'critical' | 'low' | 'target' | 'high';
export type GrowthLevel = 'declining' | 'stable' | 'growing' | 'rapid';
