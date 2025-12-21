// ================================
// EXCEL COLUMN MAPPING FOR WB DATA
// ================================

/**
 * Column mapping from Russian WB export headers to normalized field names
 */
export const COLUMN_MAP: Record<string, string> = {
    // SKU identifiers
    "артикул wb": "sku",
    "артикул": "sku",
    "sku": "sku",
    "nmid": "sku",

    // Product info
    "название": "name",
    "наименование": "name",
    "name": "name",
    "бренд": "brand",
    "brand": "brand",
    "предмет": "subject",
    "категория": "category",
    "category": "category",

    // Funnel metrics
    "показы": "views",
    "views": "views",
    "opencardcount": "views",
    "клики": "clicks",
    "clicks": "clicks",
    "в корзину": "cart",
    "корзина": "cart",
    "cart": "cart",
    "addtocartcount": "cart",
    "заказы": "orders",
    "orders": "orders",
    "orderscount": "orders",

    // Conversion rates
    "ctr": "ctr",
    "cr в корзину": "cr_cart",
    "cr корзина": "cr_cart",
    "cr_cart": "cr_cart",
    "cr в заказ": "cr_order",
    "cr заказ": "cr_order",
    "cr_order": "cr_order",
    "конверсия": "cr_order",

    // Pricing
    "средняя цена, ₽": "avg_price",
    "средняя цена": "avg_price",
    "цена": "price",
    "price": "price",
    "price_retail": "price",

    // Revenue
    "выручка": "revenue",
    "revenue": "revenue",
    "revenue_gross": "revenue",
    "sum": "revenue",
    "сумма": "revenue",

    // Stock
    "остатки": "stock_units",
    "остаток": "stock_units",
    "stock": "stock_units",
    "quantity": "stock_units",
    "quantityfull": "stock_units",

    // Advertising DRR
    "drr поиск": "drr_search",
    "drr_search": "drr_search",
    "drr": "drr_search",
    "drr медиа": "drr_media",
    "drr_media": "drr_media",
    "drr блогеры": "drr_bloggers",
    "drr_bloggers": "drr_bloggers",
    "drr остальное": "drr_other",
    "drr_other": "drr_other",

    // Date
    "дата": "date",
    "date": "date",
};

// ================================
// HEADER NORMALIZATION FUNCTION
// ================================

/**
 * Normalize Excel header to standard field name
 */
export function normalizeExcelHeader(header: string): string {
    if (!header) return "";
    const key = header.toString().trim().toLowerCase();
    return COLUMN_MAP[key] ?? key;
}

// ================================
// PARSED ROW TYPE
// ================================

export interface WbParsedRow {
    sku: string | null;
    name: string | null;
    brand: string | null;
    subject: string | null;
    category: string | null;

    views: number | null;
    clicks: number | null;
    cart: number | null;
    orders: number | null;
    ctr: number | null;
    cr_cart: number | null;
    cr_order: number | null;

    price: number | null;
    avg_price: number | null;
    revenue: number | null;

    stock_units: number | null;

    drr_search: number | null;
    drr_media: number | null;
    drr_bloggers: number | null;
    drr_other: number | null;

    date: string | null;
}

// ================================
// MAIN PARSE FUNCTION
// ================================

/**
 * Parse WB Excel sheet data into normalized objects
 * @param worksheetData - 2D array from xlsx sheet_to_json with header: 1
 */
export function parseWBSheet(worksheetData: unknown[][]): WbParsedRow[] {
    if (!worksheetData || worksheetData.length < 2) {
        throw new Error("WB Excel sheet data missing or empty");
    }

    // Extract and normalize headers
    const rawHeaders = worksheetData[0] as string[];
    const headers = rawHeaders.map(normalizeExcelHeader);

    // Extract data rows
    const rows = worksheetData.slice(1);

    const parsed: WbParsedRow[] = [];

    for (const row of rows) {
        const obj: Record<string, unknown> = {};

        (row as unknown[]).forEach((cell: unknown, index: number) => {
            const key = headers[index];
            if (!key || key.includes("unnamed") || key.startsWith("__")) return;
            obj[key] = typeof cell === "string" ? cell.trim() : cell;
        });

        // Skip rows without SKU
        if (!obj["sku"]) continue;

        // Build normalized row
        parsed.push({
            sku: obj["sku"] ? String(obj["sku"]) : null,
            name: obj["name"] ? String(obj["name"]) : null,
            brand: obj["brand"] ? String(obj["brand"]) : null,
            subject: obj["subject"] ? String(obj["subject"]) : null,
            category: obj["category"] ? String(obj["category"]) : null,

            views: obj["views"] != null ? Number(obj["views"]) : null,
            clicks: obj["clicks"] != null ? Number(obj["clicks"]) : null,
            cart: obj["cart"] != null ? Number(obj["cart"]) : null,
            orders: obj["orders"] != null ? Number(obj["orders"]) : null,
            ctr: obj["ctr"] != null ? Number(obj["ctr"]) : null,
            cr_cart: obj["cr_cart"] != null ? Number(obj["cr_cart"]) : null,
            cr_order: obj["cr_order"] != null ? Number(obj["cr_order"]) : null,

            price: obj["price"] != null ? Number(obj["price"]) : null,
            avg_price: obj["avg_price"] != null ? Number(obj["avg_price"]) : null,
            revenue: obj["revenue"] != null ? Number(obj["revenue"]) : null,

            stock_units: obj["stock_units"] != null ? Number(obj["stock_units"]) : null,

            drr_search: obj["drr_search"] != null ? Number(obj["drr_search"]) : null,
            drr_media: obj["drr_media"] != null ? Number(obj["drr_media"]) : null,
            drr_bloggers: obj["drr_bloggers"] != null ? Number(obj["drr_bloggers"]) : null,
            drr_other: obj["drr_other"] != null ? Number(obj["drr_other"]) : null,

            date: obj["date"] ? String(obj["date"]) : null,
        });
    }

    return parsed;
}

/**
 * Convert parsed rows to FACT2026 format for Supabase
 */
export function toFact2026Format(rows: WbParsedRow[], source: string): Record<string, unknown>[] {
    const today = new Date().toISOString().split('T')[0];

    return rows.map(row => ({
        date: row.date || today,
        sku: row.sku,
        price: row.price || row.avg_price,
        revenue: row.revenue,
        views: row.views,
        clicks: row.clicks,
        cart: row.cart,
        orders: row.orders,
        ctr: row.ctr,
        cr_cart: row.cr_cart,
        cr_order: row.cr_order,
        stock: row.stock_units,
        drr_search: row.drr_search,
        drr_media: row.drr_media,
        drr_bloggers: row.drr_bloggers,
        drr_other: row.drr_other,
        source,
    })).filter(r => r.sku);
}
