import * as xlsx from "xlsx";

export interface FunnelRow {
    sku: string;
    name: string;
    brand: string;

    views: number;
    clicks: number;
    cart: number;
    orders: number;
    ctr: number;
    cr_cart: number;
    cr_order: number;

    avg_price: number;
    revenue: number;

    stock_units: number;

    drr_search: number;
    drr_media: number;
    drr_bloggers: number;
    drr_other: number;
}

// Flexible column map with lowercase normalized keys
export const COLUMN_MAP: Record<string, keyof FunnelRow> = {
    // SKU
    'артикул wb': 'sku',
    'артикул': 'sku',
    'sku': 'sku',

    // Name & Brand
    'название': 'name',
    'бренд': 'brand',

    // Views
    'просмотры': 'views',
    'показы': 'views',
    'views': 'views',

    // Clicks
    'клики': 'clicks',
    'переходы': 'clicks',
    'clicks': 'clicks',

    // Cart
    'корзина': 'cart',

    // Orders
    'заказы': 'orders',
    'заказали': 'orders',

    // CTR
    'ctr': 'ctr',

    // CR
    'cr корзина': 'cr_cart',
    'конверсия в корзину': 'cr_cart',
    'cr заказов': 'cr_order',
    'конверсия в заказ': 'cr_order',

    // Price
    'средняя цена': 'avg_price',
    'цена': 'avg_price',

    // Revenue
    'выручка': 'revenue',
    'revenue': 'revenue',

    // Stock
    'остатки': 'stock_units',
    'stock': 'stock_units',

    // DRR
    'drr поиск': 'drr_search',
    'drr медиа': 'drr_media',
    'drr блогеры': 'drr_bloggers',
    'drr остальное': 'drr_other',
};

/**
 * Normalize header for comparison
 */
function normalizeHeader(h: string): string {
    return h
        .trim()
        .toLowerCase()
        .replace(/[\s_/()-]+/g, ' ')
        .replace(/[₽%,шт]+/g, '')
        .trim();
}

/**
 * Find column mapping by checking if normalized header includes any key
 */
function findColumn(header: string): keyof FunnelRow | null {
    const normalized = normalizeHeader(header);

    for (const key in COLUMN_MAP) {
        if (normalized.includes(key)) {
            return COLUMN_MAP[key];
        }
    }
    return null;
}

export function parseFunnelSheet(fileBuffer: Buffer): FunnelRow[] {
    const workbook = xlsx.read(fileBuffer, { cellDates: false });

    console.log('Available sheets:', workbook.SheetNames);

    // Try to find "Товары" sheet or use 4th sheet
    const sheetName = workbook.SheetNames.find(name => name.includes('Товары')) || workbook.SheetNames[3];
    console.log('Using sheet:', sheetName);

    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet);

    console.log('Rows in sheet:', json.length);
    if (json.length > 0) {
        console.log('First row keys:', Object.keys(json[0]));
        // Log which columns we can match
        const headers = Object.keys(json[0]);
        const matchedColumns: Record<string, string> = {};
        for (const h of headers) {
            const mapped = findColumn(h);
            if (mapped) matchedColumns[h] = mapped;
        }
        console.log('Matched columns:', matchedColumns);
    }

    return json.map((row) => {
        const result: Partial<FunnelRow> = {};

        for (const key in row) {
            const mappedKey = findColumn(key);
            if (!mappedKey) continue;

            const value = row[key];

            // String fields
            if (mappedKey === 'sku' || mappedKey === 'name' || mappedKey === 'brand') {
                result[mappedKey] = String(value || '');
                continue;
            }

            // Number fields
            if (typeof value === 'number') {
                (result as Record<string, unknown>)[mappedKey] = value;
            } else if (typeof value === 'string') {
                const parsed = Number(value.replace('%', '').replace(',', '.').trim());
                (result as Record<string, unknown>)[mappedKey] = isNaN(parsed) ? 0 : parsed;
            } else {
                (result as Record<string, unknown>)[mappedKey] = 0;
            }
        }

        return result as FunnelRow;
    });
}
