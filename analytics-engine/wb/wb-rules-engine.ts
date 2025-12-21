// WB Rules Engine - Business rules and signal detection

import { WbSku, WbSale, WbOrder, WbStock, WbAdvertising } from './wb-types';

/**
 * Detect signals at SKU level
 * @returns массив сигналов по отдельным SKU
 */
export function detectSkuSignals(
    sales: WbSale[],
    orders: WbOrder[],
    stock: WbStock[],
    adv: WbAdvertising[],
    sku: WbSku[]
): Record<string, unknown>[] {
    // placeholder
    return [];
}

/**
 * Detect signals at Category level
 * @returns массив сигналов по категориям
 */
export function detectCategorySignals(
    sales: WbSale[],
    orders: WbOrder[],
    stock: WbStock[],
    adv: WbAdvertising[],
    sku: WbSku[]
): Record<string, unknown>[] {
    // placeholder
    return [];
}

/**
 * Detect global signals across all data
 * @returns массив глобальных сигналов
 */
export function detectGlobalSignals(
    sales: WbSale[],
    orders: WbOrder[],
    stock: WbStock[],
    adv: WbAdvertising[],
    sku: WbSku[]
): Record<string, unknown>[] {
    // placeholder
    return [];
}
