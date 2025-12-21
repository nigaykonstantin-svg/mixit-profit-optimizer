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

// Run rules engine (stub)
export function runRulesEngine(data: WbSkuData[]): Signal[] {
    // TODO: Implement real rules logic
    return [];
}
