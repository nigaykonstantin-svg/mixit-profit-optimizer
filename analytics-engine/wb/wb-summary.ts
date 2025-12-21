// WB Summary - Aggregate data and generate summaries

import { WbSku, WbSale, WbOrder, WbStock, WbAdvertising } from './wb-types';

/**
 * Get summary for all SKUs
 * @returns объект со сводными данными по всем SKU
 */
export function getSkuSummary(
    sales: WbSale[],
    orders: WbOrder[],
    stock: WbStock[],
    adv: WbAdvertising[],
    sku: WbSku[]
): Record<string, unknown> {
    // placeholder — верни пустой объект
    return {};
}

/**
 * Get summary by categories
 * @returns массив сводных данных по категориям
 */
export function getCategorySummary(
    sales: WbSale[],
    orders: WbOrder[],
    stock: WbStock[],
    adv: WbAdvertising[],
    sku: WbSku[]
): Record<string, unknown>[] {
    // placeholder — верни пустой массив
    return [];
}

/**
 * Get top performing SKUs
 * @returns массив топовых SKU по метрикам
 */
export function getTopSkus(
    sales: WbSale[],
    orders: WbOrder[],
    stock: WbStock[],
    adv: WbAdvertising[],
    sku: WbSku[]
): Record<string, unknown>[] {
    // placeholder — верни пустой массив
    return [];
}
