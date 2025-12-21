// WB Rules Engine - Business rules and signal generation

import { WbSale, WbStock, WbAdvertising } from './wb-types';
import { WB_CONFIG, StockLevel, MarginLevel, GrowthLevel } from './wb-config';

// Signal types
export type SignalSeverity = 'info' | 'warning' | 'critical';
export type SignalCategory = 'stock' | 'margin' | 'advertising' | 'growth' | 'price';

export interface Signal {
    id: string;
    sku: string;
    category: SignalCategory;
    severity: SignalSeverity;
    title: string;
    description: string;
    recommendation: string;
    value: number;
    threshold: number;
    timestamp: string;
}

// Evaluate stock level for a SKU
export function evaluateStockLevel(daysOfStock: number): StockLevel {
    const { stockThresholds } = WB_CONFIG;
    if (daysOfStock <= stockThresholds.critical) return 'critical';
    if (daysOfStock <= stockThresholds.low) return 'low';
    if (daysOfStock <= stockThresholds.normal) return 'normal';
    return 'high';
}

// Evaluate margin level for a SKU
export function evaluateMarginLevel(marginPercent: number): MarginLevel {
    const { marginThresholds } = WB_CONFIG;
    if (marginPercent <= marginThresholds.critical) return 'critical';
    if (marginPercent <= marginThresholds.low) return 'low';
    if (marginPercent <= marginThresholds.target) return 'target';
    return 'high';
}

// Evaluate growth level for a SKU
export function evaluateGrowthLevel(growthPercent: number): GrowthLevel {
    const { growthThresholds } = WB_CONFIG;
    if (growthPercent <= growthThresholds.declining) return 'declining';
    if (growthPercent <= growthThresholds.stable) return 'stable';
    if (growthPercent <= growthThresholds.growing) return 'growing';
    return 'rapid';
}

// Generate stock signals
export function generateStockSignals(stocks: WbStock[]): Signal[] {
    const signals: Signal[] = [];

    for (const stock of stocks) {
        const level = evaluateStockLevel(stock.daysOfStock);

        if (level === 'critical') {
            signals.push({
                id: `stock-critical-${stock.sku}`,
                sku: stock.sku,
                category: 'stock',
                severity: 'critical',
                title: 'Критический уровень запасов',
                description: `Запасов осталось на ${stock.daysOfStock} дней`,
                recommendation: 'Срочно пополнить склад',
                value: stock.daysOfStock,
                threshold: WB_CONFIG.stockThresholds.critical,
                timestamp: new Date().toISOString(),
            });
        } else if (level === 'low') {
            signals.push({
                id: `stock-low-${stock.sku}`,
                sku: stock.sku,
                category: 'stock',
                severity: 'warning',
                title: 'Низкий уровень запасов',
                description: `Запасов осталось на ${stock.daysOfStock} дней`,
                recommendation: 'Запланировать поставку',
                value: stock.daysOfStock,
                threshold: WB_CONFIG.stockThresholds.low,
                timestamp: new Date().toISOString(),
            });
        }
    }

    return signals;
}

// Generate advertising signals
export function generateAdvertisingSignals(ads: WbAdvertising[]): Signal[] {
    const signals: Signal[] = [];
    const { advertisingThresholds } = WB_CONFIG;

    for (const ad of ads) {
        if (ad.drr > advertisingThresholds.maxDrr) {
            signals.push({
                id: `ads-drr-high-${ad.sku}`,
                sku: ad.sku,
                category: 'advertising',
                severity: 'warning',
                title: 'Высокий ДРР',
                description: `ДРР ${ad.drr}% превышает максимум ${advertisingThresholds.maxDrr}%`,
                recommendation: 'Снизить ставки или оптимизировать кампанию',
                value: ad.drr,
                threshold: advertisingThresholds.maxDrr,
                timestamp: new Date().toISOString(),
            });
        }

        if (ad.ctr < advertisingThresholds.minCtr) {
            signals.push({
                id: `ads-ctr-low-${ad.sku}`,
                sku: ad.sku,
                category: 'advertising',
                severity: 'info',
                title: 'Низкий CTR',
                description: `CTR ${ad.ctr}% ниже минимума ${advertisingThresholds.minCtr}%`,
                recommendation: 'Улучшить креативы или таргетинг',
                value: ad.ctr,
                threshold: advertisingThresholds.minCtr,
                timestamp: new Date().toISOString(),
            });
        }
    }

    return signals;
}

// Run all rules and generate signals
export function runRulesEngine(
    stocks: WbStock[],
    ads: WbAdvertising[]
): Signal[] {
    return [
        ...generateStockSignals(stocks),
        ...generateAdvertisingSignals(ads),
    ];
}
