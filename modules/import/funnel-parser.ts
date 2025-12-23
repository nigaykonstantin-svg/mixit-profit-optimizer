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

/**
 * Normalize header for comparison - removes spaces, special chars, converts to lowercase
 */
function normalizeHeader(h: string): string {
    return h
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^\p{L}\p{N}]/gu, "")
        .trim();
}

// Column mapping with normalized keys (no spaces, lowercase)
const HEADER_MAP: Record<string, keyof FunnelRow> = {
    // SKU
    "артикулwb": "sku",
    "артикулпродавца": "sku",
    "артикул": "sku",

    // Name & Brand
    "название": "name",
    "бренд": "brand",

    // Views / Показы
    "показы": "views",
    "просмотры": "views",
    "показов": "views",

    // Clicks / Клики
    "клики": "clicks",
    "переходы": "clicks",
    "переходывкарточку": "clicks",
    "кликов": "clicks",

    // Cart / Корзина
    "вкорзину": "cart",
    "положиливкорзину": "cart",
    "корзина": "cart",
    "суммаклз": "cart",  // Сумма Клз from new format

    // Orders - different variations
    "заказы": "orders",
    "заказали": "orders",
    "заказалишт": "orders",
    "заказовшт": "orders",
    "заказов": "orders",
    "суммазак": "orders",  // Сумма Зак from new format
    "суммазакcr0": "orders",  // Сумма Зак CR 0

    // CTR
    "ctr": "ctr",

    // CR - Conversion Rates
    "crвкорзину": "cr_cart",
    "конверсиявкорзину": "cr_cart",
    "crвкорзи": "cr_cart",  // CR в корзи (shortened)
    "crкорзина": "cr_cart",
    "crвзаказ": "cr_order",
    "конверсиявзаказ": "cr_order",
    "crзаказ": "cr_order",
    "cr0": "cr_order",  // CR 0 from header

    // Price
    "средняяцена": "avg_price",
    "средняяцена₽": "avg_price",
    "ценаруб": "avg_price",  // Цена, руб.
    "цена": "avg_price",

    // Revenue
    "выручка": "revenue",
    "заказалинасумму": "revenue",
    "заказалинасумму₽": "revenue",
    "выручкак": "revenue",

    // Stock - use склад ВБ only (МП is usually 0 and would overwrite)
    "остатки": "stock_units",
    "остаткискладвб": "stock_units",
    "остаткискладвбшт": "stock_units",
    "остаткисклад": "stock_units",
    "остаткискладwb": "stock_units",
    "остаткискладwbшт": "stock_units",
    "остаткишт": "stock_units",
    "сток": "stock_units",

    // DRR - different variations
    "drrпоиск": "drr_search",
    "drrпоиска": "drr_search",
    "drrмедиа": "drr_media",
    "drrблогеры": "drr_bloggers",
    "drростальное": "drr_other",
    "drrдругое": "drr_other",
    "drr": "drr_search",
};

/**
 * Find column mapping by checking if normalized header matches any key
 */
export function findColumn(header: string): keyof FunnelRow | null {
    const normalized = normalizeHeader(header);
    return HEADER_MAP[normalized] || null;
}

export function parseFunnelSheet(fileBuffer: Buffer): FunnelRow[] {
    const workbook = xlsx.read(fileBuffer, { cellDates: false });

    console.log('Available sheets:', workbook.SheetNames);

    // NEW FORMAT: Single sheet Excel - always use first sheet (index 0)
    const sheetName = workbook.SheetNames[0];

    console.log(`Using first sheet: ${sheetName}`);

    const sheet = workbook.Sheets[sheetName];

    // First get all rows without headers to find header row
    const allRows = xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

    // Find the row with actual headers (contains "Артикул")
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, allRows.length); i++) {
        const row = allRows[i] as unknown[];
        if (row && row.some((cell) => String(cell).includes("Артикул"))) {
            headerRowIndex = i;
            break;
        }
    }

    console.log("Header row index:", headerRowIndex);

    // Re-parse with correct range
    const json = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: null,
        range: headerRowIndex
    });

    console.log('Rows in sheet:', json.length);
    if (json.length > 0) {
        const headers = Object.keys(json[0]);
        console.log('Parsed headers:', headers);

        // Log matched columns
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
