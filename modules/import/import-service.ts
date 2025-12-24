// WB Import Service - Parse and import Excel files from Wildberries

import * as XLSX from 'xlsx';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';
import { FunnelRow } from './funnel-parser';

/**
 * FACT2026 record structure
 */
export interface Fact2026Record {
    date: string;
    sku: string;
    price?: number;
    revenue?: number;
    views?: number;
    clicks?: number;
    cart?: number;
    orders?: number;
    ctr?: number;
    cr_cart?: number;
    cr_order?: number;
    stock?: number;
    drr_search?: number;
    drr_media?: number;
    drr_bloggers?: number;
    drr_other?: number;
    source: string;
}

/**
 * Import types
 */
export type ImportType = 'wb_sales' | 'wb_orders' | 'wb_stock' | 'wb_advertising';

/**
 * Import result
 */
export interface ImportResult {
    success: boolean;
    recordsProcessed: number;
    recordsImported: number;
    errors: string[];
}

/**
 * Parse Excel file to JSON rows
 */
export function parseExcelFile(buffer: ArrayBuffer): Record<string, unknown>[] {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    return jsonData as Record<string, unknown>[];
}

/**
 * Normalize column name (handle Russian/English variants)
 */
function normalizeColumn(row: Record<string, unknown>, keys: string[]): unknown {
    for (const key of keys) {
        if (row[key] !== undefined) return row[key];
        // Case insensitive
        const lowerKey = key.toLowerCase();
        for (const rowKey of Object.keys(row)) {
            if (rowKey.toLowerCase() === lowerKey) return row[rowKey];
        }
    }
    return undefined;
}

/**
 * Parse WB Sales file
 */
export function parseWbSales(rows: Record<string, unknown>[]): Partial<Fact2026Record>[] {
    return rows.map(row => ({
        date: String(normalizeColumn(row, ['date', 'Дата', 'дата']) || ''),
        sku: String(normalizeColumn(row, ['sku', 'SKU', 'Артикул', 'артикул', 'nmId']) || ''),
        price: Number(normalizeColumn(row, ['price', 'Цена', 'цена', 'price_retail']) || 0),
        revenue: Number(normalizeColumn(row, ['revenue', 'Выручка', 'выручка', 'revenue_gross', 'sum']) || 0),
        source: 'wb_sales',
    })).filter(r => r.sku && r.date);
}

/**
 * Parse WB Orders file
 */
export function parseWbOrders(rows: Record<string, unknown>[]): Partial<Fact2026Record>[] {
    return rows.map(row => ({
        date: String(normalizeColumn(row, ['date', 'Дата', 'дата']) || ''),
        sku: String(normalizeColumn(row, ['sku', 'SKU', 'Артикул', 'артикул', 'nmId']) || ''),
        views: Number(normalizeColumn(row, ['views', 'Просмотры', 'просмотры', 'openCardCount']) || 0),
        clicks: Number(normalizeColumn(row, ['clicks', 'Клики', 'клики']) || 0),
        cart: Number(normalizeColumn(row, ['cart', 'Корзина', 'корзина', 'addToCartCount']) || 0),
        orders: Number(normalizeColumn(row, ['orders', 'Заказы', 'заказы', 'ordersCount']) || 0),
        ctr: Number(normalizeColumn(row, ['ctr', 'CTR']) || 0),
        cr_cart: Number(normalizeColumn(row, ['cr_cart', 'CR корзина', 'buyoutsCount']) || 0),
        cr_order: Number(normalizeColumn(row, ['cr_order', 'CR заказ', 'conversions']) || 0),
        source: 'wb_orders',
    })).filter(r => r.sku && r.date);
}

/**
 * Parse WB Stock file
 */
export function parseWbStock(rows: Record<string, unknown>[]): Partial<Fact2026Record>[] {
    const today = new Date().toISOString().split('T')[0];
    return rows.map(row => ({
        date: String(normalizeColumn(row, ['date', 'Дата', 'дата']) || today),
        sku: String(normalizeColumn(row, ['sku', 'SKU', 'Артикул', 'артикул', 'nmId']) || ''),
        stock: Number(normalizeColumn(row, ['stock', 'Остаток', 'остаток', 'quantity', 'quantityFull']) || 0),
        source: 'wb_stock',
    })).filter(r => r.sku);
}

/**
 * Parse WB Advertising file
 */
export function parseWbAdvertising(rows: Record<string, unknown>[]): Partial<Fact2026Record>[] {
    return rows.map(row => ({
        date: String(normalizeColumn(row, ['date', 'Дата', 'дата']) || ''),
        sku: String(normalizeColumn(row, ['sku', 'SKU', 'Артикул', 'артикул', 'nmId']) || ''),
        drr_search: Number(normalizeColumn(row, ['drr_search', 'ДРР поиск', 'drr']) || 0),
        drr_media: Number(normalizeColumn(row, ['drr_media', 'ДРР медиа']) || 0),
        drr_bloggers: Number(normalizeColumn(row, ['drr_bloggers', 'ДРР блогеры']) || 0),
        drr_other: Number(normalizeColumn(row, ['drr_other', 'ДРР другое']) || 0),
        source: 'wb_advertising',
    })).filter(r => r.sku && r.date);
}

/**
 * Parse file based on import type
 */
export function parseWbFile(rows: Record<string, unknown>[], importType: ImportType): Partial<Fact2026Record>[] {
    switch (importType) {
        case 'wb_sales': return parseWbSales(rows);
        case 'wb_orders': return parseWbOrders(rows);
        case 'wb_stock': return parseWbStock(rows);
        case 'wb_advertising': return parseWbAdvertising(rows);
        default: return [];
    }
}

/**
 * Import records to Supabase FACT2026 table
 */
export async function importToFact2026(records: Partial<Fact2026Record>[]): Promise<ImportResult> {
    if (!isSupabaseConfigured()) {
        return {
            success: false,
            recordsProcessed: records.length,
            recordsImported: 0,
            errors: ['Supabase not configured'],
        };
    }

    const errors: string[] = [];
    let recordsImported = 0;

    try {
        const supabase = getSupabaseClient();

        // Upsert in batches of 100
        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);

            const { error } = await supabase
                .from('fact2026')
                .upsert(batch, {
                    onConflict: 'date,sku',
                    ignoreDuplicates: false,
                });

            if (error) {
                errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
            } else {
                recordsImported += batch.length;
            }
        }

        return {
            success: errors.length === 0,
            recordsProcessed: records.length,
            recordsImported,
            errors,
        };
    } catch (err) {
        return {
            success: false,
            recordsProcessed: records.length,
            recordsImported,
            errors: [String(err)],
        };
    }
}

/**
 * Full import pipeline: parse Excel and save to Supabase
 */
export async function importExcelFile(
    buffer: ArrayBuffer,
    importType: ImportType
): Promise<ImportResult> {
    try {
        // Parse Excel
        const rows = parseExcelFile(buffer);
        if (rows.length === 0) {
            return {
                success: false,
                recordsProcessed: 0,
                recordsImported: 0,
                errors: ['File is empty or could not be parsed'],
            };
        }

        // Parse to FACT2026 format
        const records = parseWbFile(rows, importType);
        if (records.length === 0) {
            return {
                success: false,
                recordsProcessed: rows.length,
                recordsImported: 0,
                errors: ['No valid records found. Check column names.'],
            };
        }

        // Import to Supabase
        return await importToFact2026(records);
    } catch (err) {
        return {
            success: false,
            recordsProcessed: 0,
            recordsImported: 0,
            errors: [`Parse error: ${String(err)}`],
        };
    }
}
/**
 * Map FunnelRow to database row format
 */
function mapExcelRowToDatabaseRow(row: FunnelRow) {
    return {
        sku: row.sku || '',
        views: row.views || 0,
        clicks: row.clicks || 0,
        cart: row.cart || 0,
        orders: row.orders || 0,
        ctr: row.ctr || 0,
        cr_cart: row.cr_cart || 0,
        cr_order: row.cr_order || 0,
        avg_price: row.avg_price || 0,
        client_price: row.client_price || 0,
        revenue: row.revenue || 0,
        stock_units: row.stock_units || 0,
        drr_search: row.drr_search || 0,
        drr_media: row.drr_media || 0,
        drr_bloggers: row.drr_bloggers || 0,
        drr_other: row.drr_other || 0,
        kp_pct: row.kp_pct || 0,
    };
}

/**
 * Save funnel data to wb_funnel table
 */
export async function saveFunnelToDb(rows: FunnelRow[]): Promise<void> {
    const supabase = getSupabaseClient();

    // Delete all existing data
    await supabase.from('wb_funnel').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Deduplicate by SKU (keep last occurrence)
    const skuMap = new Map<string, FunnelRow>();
    for (const row of rows) {
        if (row.sku) {
            skuMap.set(row.sku, row);
        }
    }

    const uniqueRows = Array.from(skuMap.values()).map(mapExcelRowToDatabaseRow);

    // Insert in batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
        const batch = uniqueRows.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('wb_funnel').insert(batch);
        if (error) throw error;
    }
}

