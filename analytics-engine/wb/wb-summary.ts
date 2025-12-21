// WB Summary - Aggregate data and generate summaries

import { WbReport, WbSkuData } from './wb-types';
import { Signal, runRulesEngine } from './wb-rules-engine';

// Category summary
export interface CategorySummary {
    category: string;
    revenue: number;
    profit: number;
    margin: number;
    orders: number;
    views: number;
    skuCount: number;
}

// SKU summary
export interface SkuSummary {
    sku: string;
    name: string;
    category: string;
    revenue: number;
    profit: number;
    margin: number;
    orders: number;
    stockUnits: number;
    totalDrr: number;
}

// Overall summary
export interface OverallSummary {
    period: { from: string; to: string };
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    totalViews: number;
    averageMargin: number;
    skuCount: number;
    categories: CategorySummary[];
    topSkusByRevenue: SkuSummary[];
    topSkusByProfit: SkuSummary[];
    signals: Signal[];
    signalsByCategory: Record<string, number>;
    signalsBySeverity: Record<string, number>;
}

// Aggregate by category
export function aggregateByCategory(data: WbSkuData[]): CategorySummary[] {
    const categoryMap = new Map<string, CategorySummary>();

    for (const item of data) {
        const cat = item.sku.category || 'Без категории';
        const existing = categoryMap.get(cat) || {
            category: cat,
            revenue: 0,
            profit: 0,
            margin: 0,
            orders: 0,
            views: 0,
            skuCount: 0,
        };

        existing.revenue += item.sale.revenue_gross;
        existing.profit += item.sale.profit_before_mkt;
        existing.orders += item.order.orders;
        existing.views += item.order.views;
        existing.skuCount += 1;

        categoryMap.set(cat, existing);
    }

    // Calculate margins
    const result = Array.from(categoryMap.values());
    for (const cat of result) {
        cat.margin = cat.revenue > 0 ? (cat.profit / cat.revenue) * 100 : 0;
    }

    return result.sort((a, b) => b.revenue - a.revenue);
}

// Get top SKUs by metric
export function getTopSkus(data: WbSkuData[], sortBy: 'revenue' | 'profit', limit: number = 10): SkuSummary[] {
    const summaries: SkuSummary[] = data.map((item) => ({
        sku: item.sku.sku,
        name: item.sku.name,
        category: item.sku.category,
        revenue: item.sale.revenue_gross,
        profit: item.sale.profit_before_mkt,
        margin: item.sale.profit_margin_before_mkt,
        orders: item.order.orders,
        stockUnits: item.stock.stock_units,
        totalDrr:
            item.advertising.ad_search_drr +
            item.advertising.ad_media_drr +
            item.advertising.ad_bloggers_drr +
            item.advertising.ad_other_drr,
    }));

    summaries.sort((a, b) => (sortBy === 'revenue' ? b.revenue - a.revenue : b.profit - a.profit));

    return summaries.slice(0, limit);
}

// Generate overall summary
export function generateSummary(report: WbReport): OverallSummary {
    const { data, period } = report;

    // Run rules engine
    const signals = runRulesEngine(data);

    // Count signals by category and severity
    const signalsByCategory: Record<string, number> = {};
    const signalsBySeverity: Record<string, number> = {};

    for (const signal of signals) {
        signalsByCategory[signal.category] = (signalsByCategory[signal.category] || 0) + 1;
        signalsBySeverity[signal.severity] = (signalsBySeverity[signal.severity] || 0) + 1;
    }

    // Aggregate totals
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalOrders = 0;
    let totalViews = 0;

    for (const item of data) {
        totalRevenue += item.sale.revenue_gross;
        totalProfit += item.sale.profit_before_mkt;
        totalOrders += item.order.orders;
        totalViews += item.order.views;
    }

    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
        period,
        totalRevenue,
        totalProfit,
        totalOrders,
        totalViews,
        averageMargin,
        skuCount: data.length,
        categories: aggregateByCategory(data),
        topSkusByRevenue: getTopSkus(data, 'revenue'),
        topSkusByProfit: getTopSkus(data, 'profit'),
        signals,
        signalsByCategory,
        signalsBySeverity,
    };
}
