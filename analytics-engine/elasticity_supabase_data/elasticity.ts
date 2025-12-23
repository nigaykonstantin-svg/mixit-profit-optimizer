// ================================
// ELASTICITY CALCULATIONS
// ================================

import { SkuTimeSeries, PriceChangeEvent } from './prepare';
import { ELASTICITY_CONFIG } from './config';

/**
 * Elasticity result for a SKU
 */
export interface ElasticityResult {
    sku: string;
    priceElasticity: number | null;  // % change in orders / % change in price
    drrElasticity: number | null;    // % change in DRR / % change in price
    category: ElasticityCategory;
    confidence: 'high' | 'medium' | 'low';
    recommendation: PriceRecommendation;
    scenarios: PriceScenario[];
}

export type ElasticityCategory =
    | 'HIGHLY_ELASTIC'   // drop price will boost sales significantly
    | 'ELASTIC'          // normal sensitivity
    | 'INELASTIC'        // price doesn't affect sales much
    | 'GIFFEN'           // higher price → higher sales (premium)
    | 'UNKNOWN';         // not enough data

export type PriceRecommendation =
    | 'UP_AGGRESSIVE'    // raise 5-10%
    | 'UP_MODERATE'      // raise 2-5%
    | 'HOLD'             // keep current
    | 'DOWN_MODERATE'    // lower 2-5%
    | 'DOWN_AGGRESSIVE'; // lower 5-10%

export interface PriceScenario {
    direction: 'up' | 'down';
    stepPct: number;
    expectedOrdersChange: number;  // % change
    expectedRevenueChange: number; // % change
}

/**
 * Calculate price elasticity for a SKU
 */
export function calculateElasticity(ts: SkuTimeSeries): ElasticityResult {
    const { sku, priceChanges, data, avgOrders, avgPrice } = ts;

    // Not enough price changes to calculate
    if (priceChanges.length < 2) {
        return {
            sku,
            priceElasticity: null,
            drrElasticity: null,
            category: 'UNKNOWN',
            confidence: 'low',
            recommendation: 'HOLD',
            scenarios: [],
        };
    }

    // Calculate weighted average elasticity from price change events
    let totalWeight = 0;
    let weightedElasticity = 0;

    for (const event of priceChanges) {
        if (event.ordersBefore === 0) continue;

        const ordersChange = (event.ordersAfter - event.ordersBefore) / event.ordersBefore;
        const elasticity = ordersChange / event.pctChange;

        // Weight by significance (larger changes matter more)
        const weight = Math.abs(event.pctChange);
        weightedElasticity += elasticity * weight;
        totalWeight += weight;
    }

    const priceElasticity = totalWeight > 0
        ? weightedElasticity / totalWeight
        : null;

    // Categorize
    const category = categorizeElasticity(priceElasticity);
    const confidence = getConfidence(priceChanges.length, data.length);
    const recommendation = getRecommendation(category, avgOrders);
    const scenarios = generateScenarios(priceElasticity, avgPrice, avgOrders);

    return {
        sku,
        priceElasticity,
        drrElasticity: null, // TODO: calculate from DRR data
        category,
        confidence,
        recommendation,
        scenarios,
    };
}

/**
 * Categorize elasticity value
 */
function categorizeElasticity(e: number | null): ElasticityCategory {
    if (e === null) return 'UNKNOWN';

    const thresholds = ELASTICITY_CONFIG.elasticity;

    if (e >= thresholds.giffen) return 'GIFFEN';
    if (e >= thresholds.inelastic) return 'INELASTIC';
    if (e >= thresholds.elastic) return 'ELASTIC';
    return 'HIGHLY_ELASTIC';
}

/**
 * Determine confidence level
 */
function getConfidence(
    eventCount: number,
    dataPoints: number
): 'high' | 'medium' | 'low' {
    if (eventCount >= 5 && dataPoints >= 30) return 'high';
    if (eventCount >= 3 && dataPoints >= 14) return 'medium';
    return 'low';
}

/**
 * Get price recommendation based on elasticity
 */
function getRecommendation(
    category: ElasticityCategory,
    avgOrders: number
): PriceRecommendation {
    // Low volume SKUs - be conservative
    if (avgOrders < 1) return 'HOLD';

    switch (category) {
        case 'GIFFEN':
            return 'UP_AGGRESSIVE';
        case 'INELASTIC':
            return 'UP_MODERATE';
        case 'ELASTIC':
            return 'HOLD';
        case 'HIGHLY_ELASTIC':
            return 'DOWN_MODERATE';
        default:
            return 'HOLD';
    }
}

/**
 * Generate price scenarios
 */
function generateScenarios(
    elasticity: number | null,
    avgPrice: number,
    avgOrders: number
): PriceScenario[] {
    if (elasticity === null) return [];

    const scenarios: PriceScenario[] = [];

    for (const step of [0.03, 0.05, 0.10]) {
        // UP scenario
        const expectedOrdersUp = elasticity * step; // % change in orders
        const expectedRevenueUp = step + expectedOrdersUp; // combined effect

        scenarios.push({
            direction: 'up',
            stepPct: step,
            expectedOrdersChange: expectedOrdersUp,
            expectedRevenueChange: expectedRevenueUp,
        });

        // DOWN scenario
        const expectedOrdersDown = elasticity * (-step);
        const expectedRevenueDown = -step + expectedOrdersDown;

        scenarios.push({
            direction: 'down',
            stepPct: step,
            expectedOrdersChange: expectedOrdersDown,
            expectedRevenueChange: expectedRevenueDown,
        });
    }

    return scenarios;
}

/**
 * Analyze all SKUs
 */
export function analyzeAllElasticity(series: SkuTimeSeries[]): ElasticityResult[] {
    return series.map(calculateElasticity);
}

/**
 * Filter SKUs by recommendation
 */
export function getSkusByRecommendation(
    results: ElasticityResult[],
    recommendation: PriceRecommendation
): ElasticityResult[] {
    return results.filter(r => r.recommendation === recommendation);
}
