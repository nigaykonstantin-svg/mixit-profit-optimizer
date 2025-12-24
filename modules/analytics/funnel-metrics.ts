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

        const brand = 'MIXIT'; // brand removed from FunnelRow
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
): Array<{ sku: string; bottleneck: Bottleneck }> {
    const results: Array<{ sku: string; bottleneck: Bottleneck; score: number }> = [];

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
                bottleneck: worst,
                score: worst.severity === 'critical' ? worst.dropoffRate + 100 : worst.dropoffRate,
            });
        }
    }

    return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ sku, bottleneck }) => ({ sku, bottleneck }));
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
): Array<{ sku: string; totalDrr: number; breakdown: Record<string, number> }> {
    return rows
        .filter(row => row.sku && calculateTotalDRR(row) > threshold)
        .map(row => ({
            sku: row.sku,
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

/**
 * Analyzed funnel row with computed metrics + price recommendation
 */
export interface AnalyzedFunnelRow {
    sku: string;
    category?: string;
    subcategory?: string;
    revenue: number;
    views: number;
    clicks: number;
    orders: number;
    ctr: number;
    cr_order: number;
    revenue_per_view: number;
    cpc: number;
    conversion_quality: 'Overpriced' | 'Low stock' | 'Normal';
    stock: number;
    price: number;
    kp_pct: number;  // Commercial Profit %

    // DRR breakdown
    drr_search: number;
    drr_media: number;
    drr_bloggers: number;
    total_drr: number;

    // Price Engine V1
    price_action: 'UP' | 'DOWN' | 'HOLD';
    price_step_pct: number;
    recommended_price: number | null;
    reason_code: string;
    reason_text: string;
    next_review_date: string | null;

    // Ads Optimizer (total)
    ads_action: 'SCALE' | 'HOLD' | 'DOWN' | 'PAUSE';
    ads_change_pct: number;

    // Ads per channel
    ads_search: { action: string; drr: number; detail: string };
    ads_media: { action: string; drr: number; detail: string };
    ads_bloggers: { action: string; drr: number; detail: string };

    // Traceability
    blocked_actions: string[];
}

// Import price engine
import { priceEngineV1 } from '@/modules/pricing/price-engine';
import { getReasonText } from '@/modules/pricing/price-config';
import { getSkuCategory } from '@/modules/import/sku-catalog';

/**
 * Analyze funnel data with computed quality metrics + price recommendations
 */
export function analyzeFunnel(data: FunnelRow[]): AnalyzedFunnelRow[] {
    return data.map(row => {
        const revenue_per_view =
            row.views > 0 ? row.revenue / row.views : 0;

        const cpc =
            row.clicks > 0 ? row.revenue / row.clicks : 0;

        const conversion_quality: 'Overpriced' | 'Low stock' | 'Normal' =
            row.ctr > 2 && row.cr_order < 1.5 ? "Overpriced" :
                row.stock_units < 10 ? "Low stock" :
                    "Normal";

        const total_drr =
            (row.drr_search || 0) +
            (row.drr_media || 0) +
            (row.drr_bloggers || 0) +
            (row.drr_other || 0);

        // Get category from catalog
        const catalogEntry = getSkuCategory(row.sku);

        // Price Engine V1
        const rec = priceEngineV1({
            sku: row.sku,
            clicks_7d: row.clicks ?? 0,
            orders_7d: row.orders ?? 0,
            ctr_pct: row.ctr ?? 0,
            cr_order_pct: row.cr_order ?? 0,
            avg_price: row.avg_price ?? 0,
            client_price: row.client_price ?? undefined,
            stock_units: row.stock_units ?? 0,
            drr_search: row.drr_search ?? 0,
            drr_media: row.drr_media ?? 0,
            drr_bloggers: row.drr_bloggers ?? 0,
            total_drr: total_drr,
            category: catalogEntry?.category as 'face' | 'hair' | 'body' | 'decor' | undefined,
        });

        return {
            sku: row.sku,
            category: catalogEntry?.category,
            subcategory: catalogEntry?.subcategory,
            revenue: row.revenue,
            views: row.views,
            clicks: row.clicks,
            orders: row.orders,
            ctr: row.ctr,
            cr_order: row.cr_order,

            revenue_per_view,
            cpc,
            conversion_quality,

            stock: row.stock_units,
            price: row.avg_price,
            kp_pct: row.kp_pct || 0,

            // DRR breakdown
            drr_search: row.drr_search || 0,
            drr_media: row.drr_media || 0,
            drr_bloggers: row.drr_bloggers || 0,
            total_drr,

            // Price recommendations
            price_action: rec.price_action,
            price_step_pct: rec.price_step_pct,
            recommended_price: rec.recommended_price,
            reason_code: rec.reason_code,
            reason_text: rec.reason_text || getReasonText(rec.reason_code),
            next_review_date: rec.next_review_date,

            // Ads recommendations
            ads_action: rec.ads_action,
            ads_change_pct: rec.ads_change_pct,
            ads_search: rec.ads_search,
            ads_media: rec.ads_media,
            ads_bloggers: rec.ads_bloggers,

            // Traceability
            blocked_actions: rec.blocked_actions,
        };
    });
}

