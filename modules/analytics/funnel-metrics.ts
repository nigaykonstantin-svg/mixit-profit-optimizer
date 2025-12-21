// ================================
// FUNNEL METRICS - Analytics calculations
// ================================

import { FunnelRow } from '@/modules/import/funnel-parser';

/**
 * Funnel stage metrics
 */
export interface FunnelStage {
    name: string;
    value: number;
    rate: number;
    dropoff: number;
}

/**
 * SKU funnel summary
 */
export interface SkuFunnelMetrics {
    sku: string;
    name: string;
    brand: string;
    stages: FunnelStage[];
    overallCR: number;
    revenuePerView: number;
    avgOrderValue: number;
}

/**
 * Category funnel aggregation
 */
export interface CategoryFunnelMetrics {
    category: string;
    totalViews: number;
    totalClicks: number;
    totalCart: number;
    totalOrders: number;
    totalRevenue: number;
    avgCtr: number;
    avgCrCart: number;
    avgCrOrder: number;
    avgPrice: number;
    skuCount: number;
}

/**
 * Calculate funnel stages for a SKU
 */
export function calculateFunnelStages(row: FunnelRow): FunnelStage[] {
    const views = row.views || 0;
    const clicks = row.clicks || 0;
    const cart = row.cart || 0;
    const orders = row.orders || 0;

    return [
        {
            name: 'Показы',
            value: views,
            rate: 100,
            dropoff: 0,
        },
        {
            name: 'Клики',
            value: clicks,
            rate: views > 0 ? (clicks / views) * 100 : 0,
            dropoff: views > 0 ? ((views - clicks) / views) * 100 : 0,
        },
        {
            name: 'Корзина',
            value: cart,
            rate: clicks > 0 ? (cart / clicks) * 100 : 0,
            dropoff: clicks > 0 ? ((clicks - cart) / clicks) * 100 : 0,
        },
        {
            name: 'Заказы',
            value: orders,
            rate: cart > 0 ? (orders / cart) * 100 : 0,
            dropoff: cart > 0 ? ((cart - orders) / cart) * 100 : 0,
        },
    ];
}

/**
 * Calculate full funnel metrics for a SKU
 */
export function calculateSkuFunnelMetrics(row: FunnelRow): SkuFunnelMetrics {
    const stages = calculateFunnelStages(row);
    const views = row.views || 0;
    const orders = row.orders || 0;
    const revenue = row.revenue || 0;

    return {
        sku: row.sku,
        name: row.name,
        brand: row.brand,
        stages,
        overallCR: views > 0 ? (orders / views) * 100 : 0,
        revenuePerView: views > 0 ? revenue / views : 0,
        avgOrderValue: orders > 0 ? revenue / orders : 0,
    };
}

/**
 * Calculate funnel metrics for all SKUs
 */
export function calculateAllSkuMetrics(rows: FunnelRow[]): SkuFunnelMetrics[] {
    return rows
        .filter(row => row.sku)
        .map(calculateSkuFunnelMetrics);
}

/**
 * Aggregate funnel metrics by brand
 */
export function aggregateByBrand(rows: FunnelRow[]): CategoryFunnelMetrics[] {
    const brandMap = new Map<string, {
        views: number;
        clicks: number;
        cart: number;
        orders: number;
        revenue: number;
        priceSum: number;
        count: number;
    }>();

    for (const row of rows) {
        if (!row.sku) continue;

        const brand = row.brand || 'Без бренда';
        const existing = brandMap.get(brand) || {
            views: 0, clicks: 0, cart: 0, orders: 0, revenue: 0, priceSum: 0, count: 0,
        };

        existing.views += row.views || 0;
        existing.clicks += row.clicks || 0;
        existing.cart += row.cart || 0;
        existing.orders += row.orders || 0;
        existing.revenue += row.revenue || 0;
        existing.priceSum += row.avg_price || 0;
        existing.count += 1;

        brandMap.set(brand, existing);
    }

    const result: CategoryFunnelMetrics[] = [];

    for (const [category, data] of brandMap.entries()) {
        result.push({
            category,
            totalViews: data.views,
            totalClicks: data.clicks,
            totalCart: data.cart,
            totalOrders: data.orders,
            totalRevenue: data.revenue,
            avgCtr: data.views > 0 ? (data.clicks / data.views) * 100 : 0,
            avgCrCart: data.clicks > 0 ? (data.cart / data.clicks) * 100 : 0,
            avgCrOrder: data.cart > 0 ? (data.orders / data.cart) * 100 : 0,
            avgPrice: data.count > 0 ? data.priceSum / data.count : 0,
            skuCount: data.count,
        });
    }

    return result.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Bottleneck detection
 */
export type BottleneckSeverity = 'critical' | 'warning' | 'ok';

export interface Bottleneck {
    stage: string;
    severity: BottleneckSeverity;
    dropoffRate: number;
    recommendation: string;
}

/**
 * Identify bottlenecks in funnel
 */
export function identifyBottlenecks(metrics: SkuFunnelMetrics): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    for (const stage of metrics.stages) {
        if (stage.name === 'Показы') continue;

        let severity: BottleneckSeverity = 'ok';
        let recommendation = '';

        if (stage.name === 'Клики') {
            if (stage.dropoff > 98) {
                severity = 'critical';
                recommendation = 'Критически низкий CTR. Срочно улучшить главное фото.';
            } else if (stage.dropoff > 95) {
                severity = 'warning';
                recommendation = 'Низкий CTR. Проверить позицию в поиске.';
            }
        } else if (stage.name === 'Корзина') {
            if (stage.dropoff > 80) {
                severity = 'critical';
                recommendation = 'Низкая конверсия в корзину. Пересмотреть цену.';
            } else if (stage.dropoff > 60) {
                severity = 'warning';
                recommendation = 'Умеренный dropoff. Улучшить описание товара.';
            }
        } else if (stage.name === 'Заказы') {
            if (stage.dropoff > 70) {
                severity = 'critical';
                recommendation = 'Высокий отток из корзины. Проверить наличие.';
            } else if (stage.dropoff > 50) {
                severity = 'warning';
                recommendation = 'Умеренный отток. Рассмотреть акции.';
            }
        }

        if (severity !== 'ok') {
            bottlenecks.push({
                stage: stage.name,
                severity,
                dropoffRate: stage.dropoff,
                recommendation,
            });
        }
    }

    return bottlenecks;
}

/**
 * Get top problematic SKUs by bottleneck severity
 */
export function getTopProblematicSkus(
    rows: FunnelRow[],
    limit: number = 10
): Array<{ sku: string; name: string; bottleneck: Bottleneck }> {
    const results: Array<{ sku: string; name: string; bottleneck: Bottleneck; score: number }> = [];

    for (const row of rows) {
        if (!row.sku) continue;

        const metrics = calculateSkuFunnelMetrics(row);
        const bottlenecks = identifyBottlenecks(metrics);

        if (bottlenecks.length > 0) {
            const worst = bottlenecks.reduce((a, b) =>
                a.dropoffRate > b.dropoffRate ? a : b
            );

            results.push({
                sku: row.sku,
                name: row.name,
                bottleneck: worst,
                score: worst.severity === 'critical' ? worst.dropoffRate + 100 : worst.dropoffRate,
            });
        }
    }

    return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ sku, name, bottleneck }) => ({ sku, name, bottleneck }));
}

/**
 * Calculate DRR totals for a SKU
 */
export function calculateTotalDRR(row: FunnelRow): number {
    return (row.drr_search || 0) +
        (row.drr_media || 0) +
        (row.drr_bloggers || 0) +
        (row.drr_other || 0);
}

/**
 * Get SKUs with high DRR
 */
export function getHighDrrSkus(
    rows: FunnelRow[],
    threshold: number = 25,
    limit: number = 10
): Array<{ sku: string; name: string; totalDrr: number; breakdown: Record<string, number> }> {
    return rows
        .filter(row => row.sku && calculateTotalDRR(row) > threshold)
        .map(row => ({
            sku: row.sku,
            name: row.name,
            totalDrr: calculateTotalDRR(row),
            breakdown: {
                search: row.drr_search || 0,
                media: row.drr_media || 0,
                bloggers: row.drr_bloggers || 0,
                other: row.drr_other || 0,
            },
        }))
        .sort((a, b) => b.totalDrr - a.totalDrr)
        .slice(0, limit);
}
