// ================================
// DATA PREPARATION
// ================================

import { EXCLUDED_DATES } from './config';

export interface PreparedRow {
    sku: string;
    date: string;
    price: number;
    orders: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cr_order: number;
    drr_search: number;
}

/**
 * Prepare data:
 * - фильтр дат (убираем ЧП)
 * - считаем CTR / CR / CR_cart
 * - нормализуем DRR
 * - группируем по SKU + цене
 */
export function prepareData(rows: any[]): PreparedRow[] {
    return rows
        .filter(r => !EXCLUDED_DATES.has(r.date))
        .map(r => ({
            sku: r.sku,
            date: r.date,
            price: r.customer_price || r.price || 0,
            orders: r.orders || 0,
            impressions: r.impressions || r.views || 0,
            clicks: r.clicks || 0,
            ctr: r.impressions > 0 ? r.clicks / r.impressions : 0,
            cr_order: r.clicks > 0 ? r.orders / r.clicks : 0,
            drr_search: r.DRR_search || r.drr_search || 0,
        }));
}

/**
 * Group by SKU
 */
export function groupBySku(data: PreparedRow[]): Map<string, PreparedRow[]> {
    const grouped = new Map<string, PreparedRow[]>();

    for (const row of data) {
        if (!grouped.has(row.sku)) {
            grouped.set(row.sku, []);
        }
        grouped.get(row.sku)!.push(row);
    }

    return grouped;
}

/**
 * Group by SKU + price bucket
 */
export function groupBySkuPrice(data: PreparedRow[]): Map<string, PreparedRow[]> {
    const grouped = new Map<string, PreparedRow[]>();

    for (const row of data) {
        const key = `${row.sku}:${row.price}`;
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key)!.push(row);
    }

    return grouped;
}
