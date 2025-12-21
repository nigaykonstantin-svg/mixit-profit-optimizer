// WB Summary - Aggregate data and generate summaries

import { WbReport, WbSale } from './wb-types';
import { Signal, runRulesEngine } from './wb-rules-engine';

// Category summary
export interface CategorySummary {
    category: string;
    revenue: number;
    orders: number;
    profit: number;
    margin: number;
    growth: number;
    skuCount: number;
}

// SKU summary
export interface SkuSummary {
    sku: string;
    name: string;
    revenue: number;
    orders: number;
    profit: number;
    margin: number;
    growth: number;
    daysOfStock: number;
    drr: number;
}

// Overall summary
export interface OverallSummary {
    period: { from: string; to: string };
    totalRevenue: number;
    totalOrders: number;
    totalProfit: number;
    averageMargin: number;
    averageGrowth: number;
    categories: CategorySummary[];
    topSkus: SkuSummary[];
    signals: Signal[];
    signalsByCategory: Record<string, number>;
}

// Aggregate sales by category
export function aggregateSalesByCategory(sales: WbSale[]): Record<string, { revenue: number; orders: number; profit: number }> {
    // TODO: Implement real aggregation
    // Stub implementation
    return {};
}

// Aggregate sales by SKU
export function aggregateSalesBySku(sales: WbSale[]): Record<string, { revenue: number; orders: number; profit: number }> {
    // TODO: Implement real aggregation
    // Stub implementation
    return {};
}

// Calculate growth compared to previous period
export function calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
}

// Generate overall summary from report
export function generateSummary(report: WbReport, previousReport?: WbReport): OverallSummary {
    const signals = runRulesEngine(report.stocks, report.advertising);

    const signalsByCategory: Record<string, number> = {};
    for (const signal of signals) {
        signalsByCategory[signal.category] = (signalsByCategory[signal.category] || 0) + 1;
    }

    // TODO: Implement real summary generation
    // Stub implementation
    return {
        period: report.period,
        totalRevenue: 0,
        totalOrders: 0,
        totalProfit: 0,
        averageMargin: 0,
        averageGrowth: 0,
        categories: [],
        topSkus: [],
        signals,
        signalsByCategory,
    };
}

// Generate category summaries
export function generateCategorySummaries(report: WbReport): CategorySummary[] {
    // TODO: Implement real category summary generation
    // Stub implementation
    return [];
}

// Generate top SKU summaries
export function generateTopSkuSummaries(report: WbReport, limit: number = 10): SkuSummary[] {
    // TODO: Implement real SKU summary generation
    // Stub implementation
    return [];
}
