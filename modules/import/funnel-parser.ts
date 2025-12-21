// ================================
// FUNNEL PARSER - WB Conversion Funnel Data
// ================================

import { WbParsedRow } from './wb-parsers';

/**
 * Funnel stage definition
 */
export interface FunnelStage {
    name: string;
    value: number;
    rate: number;
    dropoff: number;
}

/**
 * SKU Funnel data
 */
export interface SkuFunnel {
    sku: string;
    name: string | null;
    category: string | null;
    stages: FunnelStage[];
    overallConversion: number;
}

/**
 * Category Funnel aggregation
 */
export interface CategoryFunnel {
    category: string;
    totalViews: number;
    totalClicks: number;
    totalCart: number;
    totalOrders: number;
    avgCtr: number;
    avgCrCart: number;
    avgCrOrder: number;
    skuCount: number;
}

/**
 * Calculate funnel stages from parsed row
 */
export function calculateFunnelStages(row: WbParsedRow): FunnelStage[] {
    const views = row.views || 0;
    const clicks = row.clicks || 0;
    const cart = row.cart || 0;
    const orders = row.orders || 0;

    const stages: FunnelStage[] = [
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

    return stages;
}

/**
 * Parse funnel data for a single SKU
 */
export function parseSkuFunnel(row: WbParsedRow): SkuFunnel {
    const stages = calculateFunnelStages(row);
    const views = row.views || 0;
    const orders = row.orders || 0;

    return {
        sku: row.sku || '',
        name: row.name,
        category: row.category,
        stages,
        overallConversion: views > 0 ? (orders / views) * 100 : 0,
    };
}

/**
 * Parse funnel data for all SKUs
 */
export function parseSkuFunnels(rows: WbParsedRow[]): SkuFunnel[] {
    return rows
        .filter(row => row.sku)
        .map(parseSkuFunnel);
}

/**
 * Aggregate funnel data by category
 */
export function aggregateFunnelByCategory(rows: WbParsedRow[]): CategoryFunnel[] {
    const categoryMap = new Map<string, {
        views: number;
        clicks: number;
        cart: number;
        orders: number;
        ctrSum: number;
        crCartSum: number;
        crOrderSum: number;
        count: number;
    }>();

    for (const row of rows) {
        if (!row.sku) continue;

        const category = row.category || row.subject || 'Без категории';
        const existing = categoryMap.get(category) || {
            views: 0,
            clicks: 0,
            cart: 0,
            orders: 0,
            ctrSum: 0,
            crCartSum: 0,
            crOrderSum: 0,
            count: 0,
        };

        existing.views += row.views || 0;
        existing.clicks += row.clicks || 0;
        existing.cart += row.cart || 0;
        existing.orders += row.orders || 0;
        existing.ctrSum += row.ctr || 0;
        existing.crCartSum += row.cr_cart || 0;
        existing.crOrderSum += row.cr_order || 0;
        existing.count += 1;

        categoryMap.set(category, existing);
    }

    const result: CategoryFunnel[] = [];

    for (const [category, data] of categoryMap.entries()) {
        result.push({
            category,
            totalViews: data.views,
            totalClicks: data.clicks,
            totalCart: data.cart,
            totalOrders: data.orders,
            avgCtr: data.count > 0 ? data.ctrSum / data.count : 0,
            avgCrCart: data.count > 0 ? data.crCartSum / data.count : 0,
            avgCrOrder: data.count > 0 ? data.crOrderSum / data.count : 0,
            skuCount: data.count,
        });
    }

    // Sort by total orders descending
    return result.sort((a, b) => b.totalOrders - a.totalOrders);
}

/**
 * Identify funnel bottlenecks for a SKU
 */
export interface FunnelBottleneck {
    stage: string;
    severity: 'low' | 'medium' | 'high';
    dropoffRate: number;
    recommendation: string;
}

export function identifyBottlenecks(funnel: SkuFunnel): FunnelBottleneck[] {
    const bottlenecks: FunnelBottleneck[] = [];

    for (const stage of funnel.stages) {
        if (stage.name === 'Показы') continue; // First stage has no dropoff

        let severity: 'low' | 'medium' | 'high' = 'low';
        let recommendation = '';

        if (stage.name === 'Клики') {
            // CTR bottleneck
            if (stage.dropoff > 98) {
                severity = 'high';
                recommendation = 'Очень низкий CTR. Улучшить главное фото и заголовок.';
            } else if (stage.dropoff > 95) {
                severity = 'medium';
                recommendation = 'Низкий CTR. Проверить позицию в поиске и качество карточки.';
            }
        } else if (stage.name === 'Корзина') {
            // Add to cart bottleneck
            if (stage.dropoff > 80) {
                severity = 'high';
                recommendation = 'Низкая конверсия в корзину. Проверить цену и описание.';
            } else if (stage.dropoff > 60) {
                severity = 'medium';
                recommendation = 'Умеренный dropoff. Улучшить контент карточки.';
            }
        } else if (stage.name === 'Заказы') {
            // Order bottleneck
            if (stage.dropoff > 70) {
                severity = 'high';
                recommendation = 'Высокий отток из корзины. Проверить наличие и условия доставки.';
            } else if (stage.dropoff > 50) {
                severity = 'medium';
                recommendation = 'Умеренный отток из корзины. Рассмотреть акции.';
            }
        }

        if (severity !== 'low') {
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
 * Get top leaky SKUs (highest dropoff at any stage)
 */
export function getTopLeakySKUs(funnels: SkuFunnel[], limit: number = 10): Array<{
    sku: string;
    name: string | null;
    bottleneck: FunnelBottleneck;
}> {
    const leaky: Array<{
        sku: string;
        name: string | null;
        bottleneck: FunnelBottleneck;
        maxDropoff: number;
    }> = [];

    for (const funnel of funnels) {
        const bottlenecks = identifyBottlenecks(funnel);
        if (bottlenecks.length > 0) {
            // Get the worst bottleneck
            const worst = bottlenecks.reduce((a, b) =>
                a.dropoffRate > b.dropoffRate ? a : b
            );
            leaky.push({
                sku: funnel.sku,
                name: funnel.name,
                bottleneck: worst,
                maxDropoff: worst.dropoffRate,
            });
        }
    }

    return leaky
        .sort((a, b) => b.maxDropoff - a.maxDropoff)
        .slice(0, limit)
        .map(({ sku, name, bottleneck }) => ({ sku, name, bottleneck }));
}
