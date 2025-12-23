// =========================================
// DRR OPTIMIZER - Advertising Logic
// =========================================

import { SkuData, PricingConfig, DEFAULT_CONFIG } from './types';

/**
 * DRR analysis result per SKU
 */
export interface DRRAnalysis {
    sku: string;
    totalDRR: number;
    status: 'ok' | 'warning' | 'critical';

    // Breakdown
    search: number;
    media: number;
    bloggers: number;
    other: number;

    // Dominant channel
    dominantChannel: 'search' | 'media' | 'bloggers' | 'other' | 'balanced';

    recommendation: string;
}

/**
 * Analyze DRR for a single SKU
 */
export function analyzeDRR(
    sku: SkuData,
    config: PricingConfig = DEFAULT_CONFIG
): DRRAnalysis {
    const totalDRR =
        (sku.drr_search || 0) +
        (sku.drr_media || 0) +
        (sku.drr_bloggers || 0) +
        (sku.drr_other || 0);

    const channels = {
        search: sku.drr_search || 0,
        media: sku.drr_media || 0,
        bloggers: sku.drr_bloggers || 0,
        other: sku.drr_other || 0,
    };

    // Find dominant channel
    const maxChannel = Object.entries(channels)
        .reduce((max, [key, val]) => val > max[1] ? [key, val] : max, ['balanced', 0]);

    const dominantChannel = maxChannel[1] > totalDRR * 0.5
        ? maxChannel[0] as DRRAnalysis['dominantChannel']
        : 'balanced';

    // Status
    let status: DRRAnalysis['status'] = 'ok';
    if (totalDRR > config.drrCritical) status = 'critical';
    else if (totalDRR > config.drrWarning) status = 'warning';

    // Recommendation
    let recommendation = 'DRR в норме';
    if (status === 'critical') {
        recommendation = `Срочно снизить расходы на ${dominantChannel}`;
    } else if (status === 'warning') {
        recommendation = `Оптимизировать ${dominantChannel}`;
    }

    return {
        sku: sku.sku,
        totalDRR,
        status,
        ...channels,
        dominantChannel,
        recommendation,
    };
}

/**
 * Get SKUs with high DRR
 */
export function getHighDRRSkus(
    skus: SkuData[],
    config?: PricingConfig
): DRRAnalysis[] {
    const cfg = config || DEFAULT_CONFIG;

    return skus
        .map(sku => analyzeDRR(sku, cfg))
        .filter(a => a.status !== 'ok')
        .sort((a, b) => b.totalDRR - a.totalDRR);
}

/**
 * Get DRR summary by channel
 */
export function getDRRSummary(skus: SkuData[]): {
    totalSearch: number;
    totalMedia: number;
    totalBloggers: number;
    totalOther: number;
    avgDRR: number;
} {
    const totals = skus.reduce((acc, sku) => ({
        search: acc.search + (sku.drr_search || 0),
        media: acc.media + (sku.drr_media || 0),
        bloggers: acc.bloggers + (sku.drr_bloggers || 0),
        other: acc.other + (sku.drr_other || 0),
    }), { search: 0, media: 0, bloggers: 0, other: 0 });

    const avgDRR = skus.length > 0
        ? (totals.search + totals.media + totals.bloggers + totals.other) / skus.length
        : 0;

    return {
        totalSearch: totals.search,
        totalMedia: totals.media,
        totalBloggers: totals.bloggers,
        totalOther: totals.other,
        avgDRR,
    };
}
