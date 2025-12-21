// Analytics time periods
export const TIME_PERIODS = {
    TODAY: 'today',
    WEEK: 'week',
    MONTH: 'month',
    QUARTER: 'quarter',
    YEAR: 'year',
} as const;

export type TimePeriod = typeof TIME_PERIODS[keyof typeof TIME_PERIODS];

// Sales metrics
export interface SalesMetrics {
    revenue: number;
    orders: number;
    avgOrderValue: number;
    itemsSold: number;
    returns: number;
    returnRate: number;
}

// Conversion funnel
export interface ConversionFunnel {
    views: number;
    addToCart: number;
    checkout: number;
    purchase: number;
    viewToCartRate: number;
    cartToCheckoutRate: number;
    checkoutToPurchaseRate: number;
    overallConversion: number;
}

// Traffic source
export interface TrafficSource {
    source: string;
    visitors: number;
    orders: number;
    revenue: number;
    conversion: number;
}

// Daily stats for trends
export interface DailyStats {
    date: string;
    revenue: number;
    orders: number;
    visitors: number;
}

// Top SKU by metric
export interface TopSku {
    sku: string;
    name: string;
    value: number;
    change: number; // percentage vs previous period
}

// Analytics summary
export interface AnalyticsSummary {
    period: TimePeriod;
    sales: SalesMetrics;
    funnel: ConversionFunnel;
    trafficSources: TrafficSource[];
    dailyStats: DailyStats[];
    topByRevenue: TopSku[];
    topByOrders: TopSku[];
    topByGrowth: TopSku[];
}

// Comparison data
export interface PeriodComparison {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
}

// Helper to calculate percentage change
export function calculateChange(current: number, previous: number): PeriodComparison {
    const change = current - previous;
    const changePercent = previous === 0 ? 0 : Math.round((change / previous) * 100);
    return { current, previous, change, changePercent };
}

// Format currency
export function formatCurrency(value: number): string {
    return value.toLocaleString('ru-RU') + ' ₽';
}

// Format percentage
export function formatPercent(value: number): string {
    return value.toFixed(1) + '%';
}
