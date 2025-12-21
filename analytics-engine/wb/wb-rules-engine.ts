// WB Rules Engine - Business rules and signal generation

import { WbSkuData } from './wb-types';
import { WB_CONFIG, StockLevel, MarginLevel, GrowthLevel } from './wb-config';

// Signal types
export type SignalSeverity = 'info' | 'warning' | 'critical';
export type SignalCategory = 'stock' | 'margin' | 'advertising' | 'growth' | 'price';

export interface Signal {
    id: string;
    sku: string;
    skuName: string;
    category: SignalCategory;
    severity: SignalSeverity;
    title: string;
    description: string;
    recommendation: string;
    value: number;
    threshold: number;
    timestamp: string;
}

// Evaluate stock level based on units
export function evaluateStockLevel(stockUnits: number, avgDailySales: number): StockLevel {
    if (avgDailySales === 0) return 'high';
    const daysOfStock = stockUnits / avgDailySales;
    const { stockThresholds } = WB_CONFIG;
    if (daysOfStock <= stockThresholds.critical) return 'critical';
    if (daysOfStock <= stockThresholds.low) return 'low';
    if (daysOfStock <= stockThresholds.normal) return 'normal';
    return 'high';
}

// Evaluate margin level
export function evaluateMarginLevel(marginPercent: number): MarginLevel {
    const { marginThresholds } = WB_CONFIG;
    if (marginPercent <= marginThresholds.critical) return 'critical';
    if (marginPercent <= marginThresholds.low) return 'low';
    if (marginPercent <= marginThresholds.target) return 'target';
    return 'high';
}

// Evaluate growth level
export function evaluateGrowthLevel(growthPercent: number): GrowthLevel {
    const { growthThresholds } = WB_CONFIG;
    if (growthPercent <= growthThresholds.declining) return 'declining';
    if (growthPercent <= growthThresholds.stable) return 'stable';
    if (growthPercent <= growthThresholds.growing) return 'growing';
    return 'rapid';
}

// Calculate total DRR from all advertising sources
export function calculateTotalDrr(data: WbSkuData): number {
    const { advertising } = data;
    return (
        advertising.ad_search_drr +
        advertising.ad_media_drr +
        advertising.ad_bloggers_drr +
        advertising.ad_other_drr
    );
}

// Generate stock signals
export function generateStockSignals(data: WbSkuData[], avgDailySales: Map<string, number>): Signal[] {
    const signals: Signal[] = [];
    const { stockThresholds } = WB_CONFIG;

    for (const item of data) {
        const dailySales = avgDailySales.get(item.sku.sku) ?? 1;
        const daysOfStock = dailySales > 0 ? item.stock.stock_units / dailySales : 999;
        const level = evaluateStockLevel(item.stock.stock_units, dailySales);

        if (level === 'critical') {
            signals.push({
                id: `stock-critical-${item.sku.sku}`,
                sku: item.sku.sku,
                skuName: item.sku.name,
                category: 'stock',
                severity: 'critical',
                title: 'Критический уровень запасов',
                description: `Запасов на ${Math.round(daysOfStock)} дней (${item.stock.stock_units} шт)`,
                recommendation: 'Срочно пополнить склад',
                value: daysOfStock,
                threshold: stockThresholds.critical,
                timestamp: new Date().toISOString(),
            });
        } else if (level === 'low') {
            signals.push({
                id: `stock-low-${item.sku.sku}`,
                sku: item.sku.sku,
                skuName: item.sku.name,
                category: 'stock',
                severity: 'warning',
                title: 'Низкий уровень запасов',
                description: `Запасов на ${Math.round(daysOfStock)} дней (${item.stock.stock_units} шт)`,
                recommendation: 'Запланировать поставку',
                value: daysOfStock,
                threshold: stockThresholds.low,
                timestamp: new Date().toISOString(),
            });
        }
    }

    return signals;
}

// Generate advertising signals
export function generateAdvertisingSignals(data: WbSkuData[]): Signal[] {
    const signals: Signal[] = [];
    const { advertisingThresholds } = WB_CONFIG;

    for (const item of data) {
        const totalDrr = calculateTotalDrr(item);

        if (totalDrr > advertisingThresholds.maxDrr) {
            signals.push({
                id: `ads-drr-high-${item.sku.sku}`,
                sku: item.sku.sku,
                skuName: item.sku.name,
                category: 'advertising',
                severity: 'warning',
                title: 'Высокий ДРР',
                description: `Общий ДРР ${totalDrr.toFixed(1)}% превышает максимум ${advertisingThresholds.maxDrr}%`,
                recommendation: 'Снизить ставки или оптимизировать кампанию',
                value: totalDrr,
                threshold: advertisingThresholds.maxDrr,
                timestamp: new Date().toISOString(),
            });
        }

        if (item.order.ctr < advertisingThresholds.minCtr && item.order.views > 100) {
            signals.push({
                id: `ads-ctr-low-${item.sku.sku}`,
                sku: item.sku.sku,
                skuName: item.sku.name,
                category: 'advertising',
                severity: 'info',
                title: 'Низкий CTR',
                description: `CTR ${item.order.ctr.toFixed(2)}% ниже минимума ${advertisingThresholds.minCtr}%`,
                recommendation: 'Улучшить креативы или таргетинг',
                value: item.order.ctr,
                threshold: advertisingThresholds.minCtr,
                timestamp: new Date().toISOString(),
            });
        }
    }

    return signals;
}

// Generate margin signals
export function generateMarginSignals(data: WbSkuData[]): Signal[] {
    const signals: Signal[] = [];
    const { marginThresholds } = WB_CONFIG;

    for (const item of data) {
        const margin = item.sale.profit_margin_before_mkt;
        const level = evaluateMarginLevel(margin);

        if (level === 'critical') {
            signals.push({
                id: `margin-critical-${item.sku.sku}`,
                sku: item.sku.sku,
                skuName: item.sku.name,
                category: 'margin',
                severity: 'critical',
                title: 'Критическая маржинальность',
                description: `Маржа ${margin.toFixed(1)}% ниже критического уровня ${marginThresholds.critical}%`,
                recommendation: 'Пересмотреть цену или снизить расходы',
                value: margin,
                threshold: marginThresholds.critical,
                timestamp: new Date().toISOString(),
            });
        } else if (level === 'low') {
            signals.push({
                id: `margin-low-${item.sku.sku}`,
                sku: item.sku.sku,
                skuName: item.sku.name,
                category: 'margin',
                severity: 'warning',
                title: 'Низкая маржинальность',
                description: `Маржа ${margin.toFixed(1)}% ниже целевого уровня ${marginThresholds.low}%`,
                recommendation: 'Рассмотреть оптимизацию расходов',
                value: margin,
                threshold: marginThresholds.low,
                timestamp: new Date().toISOString(),
            });
        }
    }

    return signals;
}

// Run all rules and generate signals
export function runRulesEngine(
    data: WbSkuData[],
    avgDailySales: Map<string, number> = new Map()
): Signal[] {
    return [
        ...generateStockSignals(data, avgDailySales),
        ...generateAdvertisingSignals(data),
        ...generateMarginSignals(data),
    ];
}
