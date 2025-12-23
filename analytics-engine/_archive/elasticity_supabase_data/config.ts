// ================================
// ELASTICITY CONFIG - Full Specification
// ================================

export const CONFIG = {
    // ===== INPUT =====
    input: {
        file_path: 'Fact2026.xlsx',
        sheet_name: 'Fact2026',
        date_col: 'date',
        sku_col: 'sku',
        platform_col: 'platform',
    },

    // ===== BLACK FRIDAY EXCLUDE =====
    blackFridayExclude: {
        month: 11,
        dayFrom: 26,
        dayTo: 30,
    },

    // ===== FILTERS =====
    filters: {
        platformValue: 'WB',
        minDaysPerSku: 25,
        minTotalOrdersPerSku: 30,
        minUniquePrices: 4,
    },

    // ===== COLUMN MAPPING =====
    columns: {
        // Price
        clientPrice: 'customer_price',
        // Volume
        orders: 'orders',
        revenue: 'revenue_gross',
        // Funnel
        impressions: 'impressions',
        clicks: 'clicks',
        addToCart: 'add_to_cart',
        ctr: 'ctr',
        crCart: 'cr_cart',
        crOrder: 'cr_order',
        // Ads (drr_search may be % or rubles)
        adSearch: 'drr_search',
        adTotal: null as string | null,
    },

    // ===== BUSINESS =====
    business: {
        returnsReservePct: 0.03,
        cm0Col: null as string | null,
        profitCol: 'profit_incl_marketing_exp',
        minMarginPct: 0.10,
    },

    // ===== SCENARIO GRID =====
    scenarioGrid: {
        priceDeltas: [-0.10, -0.05, 0.0, 0.03, 0.05],
        adMults: [0.0, 0.5, 1.0, 1.2],
    },

    // ===== OUTPUT =====
    output: {
        recommendationsCsv: 'sku_recommendations.csv',
        modelsCsv: 'sku_models.csv',
    },
};

// Helper: Generate excluded dates from Black Friday config
export function getExcludedDates(): string[] {
    const { month, dayFrom, dayTo } = CONFIG.blackFridayExclude;
    const dates: string[] = [];
    const year = 2024;

    for (let day = dayFrom; day <= dayTo; day++) {
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        dates.push(`${year}-${m}-${d}`);
    }

    return dates;
}

export const EXCLUDED_DATES = new Set(getExcludedDates());

// Type exports
export type ElasticityConfig = typeof CONFIG;
