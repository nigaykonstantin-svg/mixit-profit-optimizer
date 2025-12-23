// ================================
// ELASTICITY CALCULATIONS
// ================================

import { PreparedRow } from './prepare';
import { CONFIG } from './config';

/**
 * Elasticity result for a SKU
 */
export interface ElasticityResult {
    sku: string;
    priceElasticity: number | null;
    category: 'GIFFEN' | 'INELASTIC' | 'ELASTIC' | 'HIGHLY_ELASTIC' | 'UNKNOWN';
    recommendation: 'UP' | 'HOLD' | 'DOWN';
}

/**
 * Price bucket aggregation
 */
export interface PriceBucketStats {
    priceBucket: number;
    avgOrders: number;
    avgCtr: number;
    avgCr: number;
    dayCount: number;
}

/**
 * Aggregate data by price buckets
 */
export function aggregateByPriceBucket(
    data: PreparedRow[],
    basePrice: number
): PriceBucketStats[] {
    const buckets = new Map<number, PreparedRow[]>();

    for (const row of data) {
        const pctChange = basePrice > 0 ? (row.price - basePrice) / basePrice : 0;
        const bucket = findBucket(pctChange, CONFIG.scenarioGrid.priceDeltas);

        if (!buckets.has(bucket)) {
            buckets.set(bucket, []);
        }
        buckets.get(bucket)!.push(row);
    }

    const stats: PriceBucketStats[] = [];
    for (const [bucket, rows] of buckets) {
        if (rows.length < 2) continue; // min days

        stats.push({
            priceBucket: bucket,
            avgOrders: rows.reduce((s, r) => s + r.orders, 0) / rows.length,
            avgCtr: rows.reduce((s, r) => s + r.ctr, 0) / rows.length,
            avgCr: rows.reduce((s, r) => s + r.cr_order, 0) / rows.length,
            dayCount: rows.length,
        });
    }

    return stats.sort((a, b) => a.priceBucket - b.priceBucket);
}

/**
 * Find closest bucket
 */
function findBucket(value: number, buckets: number[]): number {
    let closest = buckets[0];
    let minDiff = Math.abs(value - buckets[0]);

    for (const b of buckets) {
        const diff = Math.abs(value - b);
        if (diff < minDiff) {
            minDiff = diff;
            closest = b;
        }
    }

    return closest;
}

/**
 * Calculate elasticity for a SKU
 */
export function calculateSkuElasticity(
    data: PreparedRow[]
): ElasticityResult | null {
    if (data.length === 0) return null;

    const sku = data[0].sku;
    const totalOrders = data.reduce((s, r) => s + r.orders, 0);

    if (totalOrders < CONFIG.filters.minTotalOrdersPerSku) {
        return {
            sku,
            priceElasticity: null,
            category: 'UNKNOWN',
            recommendation: 'HOLD',
        };
    }

    // Base price = mode (most common)
    const priceMode = getMode(data.map(r => r.price));
    const bucketStats = aggregateByPriceBucket(data, priceMode);

    // Check min unique prices
    if (bucketStats.length < CONFIG.filters.minUniquePrices) {
        return {
            sku,
            priceElasticity: null,
            category: 'UNKNOWN',
            recommendation: 'HOLD',
        };
    }

    // Calculate elasticity from bucket comparison
    const low = bucketStats[0];
    const high = bucketStats[bucketStats.length - 1];

    const priceDiff = high.priceBucket - low.priceBucket;
    const ordersDiff = (high.avgOrders - low.avgOrders) / Math.max(low.avgOrders, 1);

    const elasticity = priceDiff !== 0 ? ordersDiff / priceDiff : null;

    const category = categorize(elasticity);
    const recommendation = getRecommendation(category);

    return {
        sku,
        priceElasticity: elasticity,
        category,
        recommendation,
    };
}

function getMode(values: number[]): number {
    const counts = new Map<number, number>();
    for (const v of values) {
        counts.set(v, (counts.get(v) || 0) + 1);
    }
    let mode = values[0];
    let maxCount = 0;
    for (const [v, c] of counts) {
        if (c > maxCount) {
            maxCount = c;
            mode = v;
        }
    }
    return mode;
}

function categorize(e: number | null): ElasticityResult['category'] {
    if (e === null) return 'UNKNOWN';
    if (e >= 0) return 'GIFFEN';
    if (e >= -0.3) return 'INELASTIC';
    if (e >= -1) return 'ELASTIC';
    return 'HIGHLY_ELASTIC';
}

function getRecommendation(
    cat: ElasticityResult['category']
): ElasticityResult['recommendation'] {
    switch (cat) {
        case 'GIFFEN':
        case 'INELASTIC':
            return 'UP';
        case 'HIGHLY_ELASTIC':
            return 'DOWN';
        default:
            return 'HOLD';
    }
}
