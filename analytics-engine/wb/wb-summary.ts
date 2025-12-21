// WB Summary - Aggregate data and generate summaries

import { WbReport, WbSkuData } from './wb-types';
import { Signal } from './wb-rules-engine';

// Category summary
export interface CategorySummary {
    category: string;
    revenue: number;
    profit: number;
    margin: number;
    orders: number;
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
}

// Overall summary
export interface OverallSummary {
    period: { from: string; to: string };
    totalRevenue: number;
    totalProfit: number;
    totalOrders: number;
    averageMargin: number;
    skuCount: number;
    categories: CategorySummary[];
    topSkus: SkuSummary[];
    signals: Signal[];
}

// Generate summary (stub)
export function generateSummary(report: WbReport): OverallSummary {
    // TODO: Implement real summary generation
    return {
        period: report.period,
        totalRevenue: 0,
        totalProfit: 0,
        totalOrders: 0,
        averageMargin: 0,
        skuCount: report.data.length,
        categories: [],
        topSkus: [],
        signals: [],
    };
}

// Aggregate by category (stub)
export function aggregateByCategory(data: WbSkuData[]): CategorySummary[] {
    // TODO: Implement real aggregation
    return [];
}

// Get top SKUs (stub)
export function getTopSkus(data: WbSkuData[], limit: number = 10): SkuSummary[] {
    // TODO: Implement real sorting
    return [];
}
