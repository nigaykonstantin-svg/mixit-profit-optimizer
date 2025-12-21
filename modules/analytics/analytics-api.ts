'use client';

import {
    TimePeriod,
    TIME_PERIODS,
    SalesMetrics,
    ConversionFunnel,
    TrafficSource,
    DailyStats,
    TopSku,
    AnalyticsSummary,
} from './analytics-model';

// Demo sales metrics
const DEMO_SALES: Record<TimePeriod, SalesMetrics> = {
    [TIME_PERIODS.TODAY]: {
        revenue: 485000,
        orders: 127,
        avgOrderValue: 3819,
        itemsSold: 342,
        returns: 3,
        returnRate: 2.4,
    },
    [TIME_PERIODS.WEEK]: {
        revenue: 3250000,
        orders: 892,
        avgOrderValue: 3644,
        itemsSold: 2380,
        returns: 18,
        returnRate: 2.0,
    },
    [TIME_PERIODS.MONTH]: {
        revenue: 14350000,
        orders: 3820,
        avgOrderValue: 3757,
        itemsSold: 10240,
        returns: 72,
        returnRate: 1.9,
    },
    [TIME_PERIODS.QUARTER]: {
        revenue: 42500000,
        orders: 11200,
        avgOrderValue: 3795,
        itemsSold: 29800,
        returns: 198,
        returnRate: 1.8,
    },
    [TIME_PERIODS.YEAR]: {
        revenue: 168000000,
        orders: 44500,
        avgOrderValue: 3775,
        itemsSold: 118000,
        returns: 756,
        returnRate: 1.7,
    },
};

// Demo funnel
const DEMO_FUNNEL: ConversionFunnel = {
    views: 125000,
    addToCart: 18750,
    checkout: 5625,
    purchase: 3820,
    viewToCartRate: 15.0,
    cartToCheckoutRate: 30.0,
    checkoutToPurchaseRate: 67.9,
    overallConversion: 3.06,
};

// Demo traffic sources
const DEMO_TRAFFIC: TrafficSource[] = [
    { source: 'Wildberries Поиск', visitors: 45000, orders: 1528, revenue: 5740000, conversion: 3.4 },
    { source: 'Wildberries Реклама', visitors: 32000, orders: 1146, revenue: 4305000, conversion: 3.6 },
    { source: 'Ozon Поиск', visitors: 28000, orders: 756, revenue: 2840000, conversion: 2.7 },
    { source: 'Ozon Реклама', visitors: 15000, orders: 315, revenue: 1183000, conversion: 2.1 },
    { source: 'Прямые переходы', visitors: 5000, orders: 75, revenue: 282000, conversion: 1.5 },
];

// Demo daily stats
const DEMO_DAILY: DailyStats[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
        date: date.toISOString().split('T')[0],
        revenue: 400000 + Math.random() * 200000,
        orders: 100 + Math.floor(Math.random() * 50),
        visitors: 3500 + Math.floor(Math.random() * 1500),
    };
});

// Demo top SKUs
const DEMO_TOP_REVENUE: TopSku[] = [
    { sku: 'MX-001', name: 'Крем увлажняющий', value: 1850000, change: 12.5 },
    { sku: 'MX-002', name: 'Сыворотка витамин C', value: 1420000, change: 8.3 },
    { sku: 'MX-011', name: 'Крем антивозрастной', value: 1280000, change: -2.1 },
    { sku: 'MX-004', name: 'Помада матовая', value: 980000, change: 15.7 },
    { sku: 'MX-007', name: 'Тушь для ресниц', value: 890000, change: 5.2 },
];

const DEMO_TOP_ORDERS: TopSku[] = [
    { sku: 'MX-001', name: 'Крем увлажняющий', value: 1250, change: 10.2 },
    { sku: 'MX-003', name: 'Шампунь восстанавливающий', value: 980, change: -3.5 },
    { sku: 'MX-002', name: 'Сыворотка витамин C', value: 850, change: 7.8 },
    { sku: 'MX-008', name: 'Бальзам для губ', value: 720, change: 22.4 },
    { sku: 'MX-006', name: 'Лосьон для тела', value: 680, change: 4.1 },
];

const DEMO_TOP_GROWTH: TopSku[] = [
    { sku: 'MX-008', name: 'Бальзам для губ', value: 540000, change: 45.2 },
    { sku: 'MX-019', name: 'Спрей для волос', value: 320000, change: 38.7 },
    { sku: 'MX-004', name: 'Помада матовая', value: 980000, change: 32.1 },
    { sku: 'MX-012', name: 'Тени палетка', value: 450000, change: 28.5 },
    { sku: 'MX-016', name: 'Румяна', value: 280000, change: 25.3 },
];

// API Functions

export async function getSalesMetrics(period: TimePeriod): Promise<SalesMetrics> {
    // TODO: Replace with real API call
    return DEMO_SALES[period];
}

export async function getConversionFunnel(period: TimePeriod): Promise<ConversionFunnel> {
    // TODO: Replace with real API call
    return DEMO_FUNNEL;
}

export async function getTrafficSources(period: TimePeriod): Promise<TrafficSource[]> {
    // TODO: Replace with real API call
    return DEMO_TRAFFIC;
}

export async function getDailyStats(period: TimePeriod): Promise<DailyStats[]> {
    // TODO: Replace with real API call
    const days = period === TIME_PERIODS.TODAY ? 1
        : period === TIME_PERIODS.WEEK ? 7
            : period === TIME_PERIODS.MONTH ? 30
                : period === TIME_PERIODS.QUARTER ? 90
                    : 365;
    return DEMO_DAILY.slice(-days);
}

export async function getTopSkus(
    metric: 'revenue' | 'orders' | 'growth',
    limit: number = 5
): Promise<TopSku[]> {
    // TODO: Replace with real API call
    const data = metric === 'revenue' ? DEMO_TOP_REVENUE
        : metric === 'orders' ? DEMO_TOP_ORDERS
            : DEMO_TOP_GROWTH;
    return data.slice(0, limit);
}

export async function getAnalyticsSummary(period: TimePeriod): Promise<AnalyticsSummary> {
    // TODO: Replace with real API call
    const [sales, funnel, trafficSources, dailyStats, topByRevenue, topByOrders, topByGrowth] =
        await Promise.all([
            getSalesMetrics(period),
            getConversionFunnel(period),
            getTrafficSources(period),
            getDailyStats(period),
            getTopSkus('revenue'),
            getTopSkus('orders'),
            getTopSkus('growth'),
        ]);

    return {
        period,
        sales,
        funnel,
        trafficSources,
        dailyStats,
        topByRevenue,
        topByOrders,
        topByGrowth,
    };
}
