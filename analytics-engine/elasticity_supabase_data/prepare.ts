// ================================
// DATA PREPARATION - Aggregation & Features
// ================================

import { Fact2026Row } from './loader';
import { ELASTICITY_CONFIG } from './config';

/**
 * Aggregated daily SKU data
 */
export interface DailySkuData {
    date: string;
    sku: string;
    orders: number;
    revenue: number;
    price: number;
    stock: number;
    totalDrr: number;
}

/**
 * Prepared SKU time series with computed features
 */
export interface SkuTimeSeries {
    sku: string;
    data: DailySkuData[];
    avgPrice: number;
    avgOrders: number;
    priceChanges: PriceChangeEvent[];
}

/**
 * Price change event
 */
export interface PriceChangeEvent {
    date: string;
    prevPrice: number;
    newPrice: number;
    pctChange: number;
    ordersBefore: number;
    ordersAfter: number;
}

/**
 * Group raw data by SKU
 */
export function groupBySku(data: Fact2026Row[]): Map<string, Fact2026Row[]> {
    const grouped = new Map<string, Fact2026Row[]>();

    for (const row of data) {
        if (!grouped.has(row.sku)) {
            grouped.set(row.sku, []);
        }
        grouped.get(row.sku)!.push(row);
    }

    return grouped;
}

/**
 * Prepare SKU time series with features
 */
export function prepareSkuTimeSeries(
    skuData: Fact2026Row[]
): SkuTimeSeries | null {
    if (skuData.length < ELASTICITY_CONFIG.minDaysForElasticity) {
        return null;
    }

    // Sort by date
    const sorted = [...skuData].sort((a, b) =>
        a.date.localeCompare(b.date)
    );

    // Convert to daily data
    const dailyData: DailySkuData[] = sorted.map(row => ({
        date: row.date,
        sku: row.sku,
        orders: row.orders || 0,
        revenue: row.revenue || 0,
        price: row.price || 0,
        stock: row.stock_units || 0,
        totalDrr: (row.drr_search || 0) + (row.drr_media || 0) + (row.drr_bloggers || 0),
    }));

    // Calculate averages
    const totalOrders = dailyData.reduce((sum, d) => sum + d.orders, 0);
    const avgPrice = dailyData.reduce((sum, d) => sum + d.price, 0) / dailyData.length;
    const avgOrders = totalOrders / dailyData.length;

    // Skip if not enough orders
    if (totalOrders < ELASTICITY_CONFIG.minOrdersForAnalysis) {
        return null;
    }

    // Detect price changes
    const priceChanges = detectPriceChanges(dailyData);

    return {
        sku: skuData[0].sku,
        data: dailyData,
        avgPrice,
        avgOrders,
        priceChanges,
    };
}

/**
 * Detect significant price changes
 */
function detectPriceChanges(data: DailySkuData[]): PriceChangeEvent[] {
    const changes: PriceChangeEvent[] = [];

    for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1];
        const curr = data[i];

        if (prev.price <= 0 || curr.price <= 0) continue;

        const pctChange = (curr.price - prev.price) / prev.price;

        if (Math.abs(pctChange) >= ELASTICITY_CONFIG.minPriceChangePct) {
            // Get orders 3 days before and after
            const startIdx = Math.max(0, i - 3);
            const endIdx = Math.min(data.length - 1, i + 3);

            const ordersBefore = data
                .slice(startIdx, i)
                .reduce((sum, d) => sum + d.orders, 0);
            const ordersAfter = data
                .slice(i, endIdx + 1)
                .reduce((sum, d) => sum + d.orders, 0);

            changes.push({
                date: curr.date,
                prevPrice: prev.price,
                newPrice: curr.price,
                pctChange,
                ordersBefore,
                ordersAfter,
            });
        }
    }

    return changes;
}

/**
 * Prepare all SKUs
 */
export function prepareAllSkus(data: Fact2026Row[]): SkuTimeSeries[] {
    const grouped = groupBySku(data);
    const results: SkuTimeSeries[] = [];

    for (const [, skuData] of grouped) {
        const ts = prepareSkuTimeSeries(skuData);
        if (ts) {
            results.push(ts);
        }
    }

    return results;
}
