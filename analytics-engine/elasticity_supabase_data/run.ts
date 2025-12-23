// ================================
// ELASTICITY PIPELINE RUNNER
// ================================

import { loadLastNDays, loadFact2026 } from './loader';
import { prepareAllSkus } from './prepare';
import { analyzeAllElasticity, ElasticityResult, getSkusByRecommendation } from './elasticity';
import { ELASTICITY_CONFIG } from './config';

/**
 * Pipeline result
 */
export interface ElasticityPipelineResult {
    runDate: string;
    skusAnalyzed: number;
    results: ElasticityResult[];
    summary: {
        upAggressive: number;
        upModerate: number;
        hold: number;
        downModerate: number;
        downAggressive: number;
        unknown: number;
    };
}

/**
 * Run full elasticity pipeline for last N days
 */
export async function runElasticityPipeline(
    days: number = ELASTICITY_CONFIG.rollingWindowDays
): Promise<ElasticityPipelineResult> {
    const runDate = new Date().toISOString().slice(0, 10);

    console.log(`[Elasticity] Starting pipeline for last ${days} days...`);

    // 1. Load data
    console.log('[Elasticity] Loading data from fact2026...');
    const rawData = await loadLastNDays(days);
    console.log(`[Elasticity] Loaded ${rawData.length} rows`);

    // 2. Prepare time series
    console.log('[Elasticity] Preparing time series...');
    const series = prepareAllSkus(rawData);
    console.log(`[Elasticity] Prepared ${series.length} SKUs`);

    // 3. Calculate elasticity
    console.log('[Elasticity] Calculating elasticity...');
    const results = analyzeAllElasticity(series);

    // 4. Generate summary
    const summary = {
        upAggressive: getSkusByRecommendation(results, 'UP_AGGRESSIVE').length,
        upModerate: getSkusByRecommendation(results, 'UP_MODERATE').length,
        hold: getSkusByRecommendation(results, 'HOLD').length,
        downModerate: getSkusByRecommendation(results, 'DOWN_MODERATE').length,
        downAggressive: getSkusByRecommendation(results, 'DOWN_AGGRESSIVE').length,
        unknown: results.filter(r => r.category === 'UNKNOWN').length,
    };

    console.log('[Elasticity] Pipeline complete!');
    console.log('[Elasticity] Summary:', summary);

    return {
        runDate,
        skusAnalyzed: results.length,
        results,
        summary,
    };
}

/**
 * Run pipeline for specific date range
 */
export async function runElasticityForRange(
    startDate: string,
    endDate: string,
    skuFilter?: string[]
): Promise<ElasticityPipelineResult> {
    const runDate = new Date().toISOString().slice(0, 10);

    const rawData = await loadFact2026(startDate, endDate, skuFilter);
    const series = prepareAllSkus(rawData);
    const results = analyzeAllElasticity(series);

    const summary = {
        upAggressive: getSkusByRecommendation(results, 'UP_AGGRESSIVE').length,
        upModerate: getSkusByRecommendation(results, 'UP_MODERATE').length,
        hold: getSkusByRecommendation(results, 'HOLD').length,
        downModerate: getSkusByRecommendation(results, 'DOWN_MODERATE').length,
        downAggressive: getSkusByRecommendation(results, 'DOWN_AGGRESSIVE').length,
        unknown: results.filter(r => r.category === 'UNKNOWN').length,
    };

    return {
        runDate,
        skusAnalyzed: results.length,
        results,
        summary,
    };
}

/**
 * Get elasticity for single SKU
 */
export async function getSkuElasticity(
    sku: string,
    days: number = 30
): Promise<ElasticityResult | null> {
    const rawData = await loadLastNDays(days, [sku]);
    const series = prepareAllSkus(rawData);

    if (series.length === 0) return null;

    const results = analyzeAllElasticity(series);
    return results[0] || null;
}

// Export all
export * from './config';
export * from './loader';
export * from './prepare';
export * from './elasticity';
