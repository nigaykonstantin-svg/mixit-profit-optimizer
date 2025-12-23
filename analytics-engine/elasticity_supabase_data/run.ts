// ================================
// ELASTICITY PIPELINE RUNNER
// ================================

import { loadFact2026 } from './loader';
import { prepareData, groupBySku } from './prepare';
import { calculateSkuElasticity, ElasticityResult } from './elasticity';

/**
 * Pipeline result
 */
export interface ElasticityPipelineResult {
    runDate: string;
    skusAnalyzed: number;
    results: ElasticityResult[];
    summary: {
        up: number;
        hold: number;
        down: number;
        unknown: number;
    };
}

/**
 * Run full elasticity pipeline
 */
export async function runElasticityPipeline(): Promise<ElasticityPipelineResult> {
    const runDate = new Date().toISOString().slice(0, 10);

    console.log('[Elasticity] Loading data from fact2026...');
    const rawData = await loadFact2026();
    console.log(`[Elasticity] Loaded ${rawData?.length || 0} rows`);

    console.log('[Elasticity] Preparing data...');
    const prepared = prepareData(rawData || []);
    console.log(`[Elasticity] Prepared ${prepared.length} rows`);

    console.log('[Elasticity] Grouping by SKU...');
    const grouped = groupBySku(prepared);
    console.log(`[Elasticity] Found ${grouped.size} SKUs`);

    console.log('[Elasticity] Calculating elasticity...');
    const results: ElasticityResult[] = [];

    for (const [, skuData] of grouped) {
        const result = calculateSkuElasticity(skuData);
        if (result) {
            results.push(result);
        }
    }

    const summary = {
        up: results.filter(r => r.recommendation === 'UP').length,
        hold: results.filter(r => r.recommendation === 'HOLD').length,
        down: results.filter(r => r.recommendation === 'DOWN').length,
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
 * Get elasticity for single SKU
 */
export async function getSkuElasticity(sku: string): Promise<ElasticityResult | null> {
    const rawData = await loadFact2026();
    const prepared = prepareData(rawData || []).filter(r => r.sku === sku);

    if (prepared.length === 0) return null;

    return calculateSkuElasticity(prepared);
}

// Export all
export * from './config';
export * from './loader';
export * from './prepare';
export * from './elasticity';
