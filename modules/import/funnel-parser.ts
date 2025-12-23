import * as xlsx from "xlsx";

/* ============================
   DATA MODEL
============================ */

export interface FunnelRow {
    sku: string;

    views: number;
    clicks: number;
    cart: number;
    orders: number;

    ctr: number;
    cr_cart: number;
    cr_order: number;

    avg_price: number;        // Цена, руб.
    client_price: number;     // Цена покупателя

    competitor_price_min: number; // 👈 КОНКУРЕНТЫ
    competitor_price_avg: number;

    revenue: number;
    stock_units: number;

    drr_search: number;
    drr_media: number;
    drr_bloggers: number;
    drr_other: number;
}

/* ============================
   HEADER NORMALIZATION
============================ */

function normalize(h: string): string {
    return h
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^\p{L}\p{N}]/gu, "");
}

/* ============================
   COLUMN MAP
============================ */

const HEADER_MAP: Record<string, keyof FunnelRow> = {
    // SKU
    "артикул": "sku",
    "артикулwb": "sku",

    // FUNNEL
    "суммапоказы": "views",
    "суммаклики": "clicks",
    "суммавкорзину": "cart",
    "суммазаказаношт": "orders",

    // CONVERSION
    "ctr": "ctr",
    "crвкорзину": "cr_cart",
    "crвзаказ": "cr_order",
    "cr0": "cr_order",

    // PRICES
    "ценаруб": "avg_price",
    "ценапокупателя": "client_price",

    // 👇 КОНКУРЕНТЫ
    "ценаконкурентовмин": "competitor_price_min",
    "минценаконкурента": "competitor_price_min",
    "средняяценаконкурентов": "competitor_price_avg",

    // REVENUE
    "суммавыручкарубсндс": "revenue",

    // STOCK (ВАЖНО!)
    "сумматекущийостатокшт": "stock_units",

    // DRR
    "drrпоиск": "drr_search",
    "drrмедиа": "drr_media",
    "drrблогеры": "drr_bloggers",
    "drростальное": "drr_other",
};

/* ============================
   PARSER
============================ */

export function parseFunnelSheet(fileBuffer: Buffer): FunnelRow[] {
    const workbook = xlsx.read(fileBuffer, { cellDates: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const raw = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: null
    });

    return raw
        .map(row => {
            const out: any = {};

            for (const col in row) {
                const key = HEADER_MAP[normalize(col)];
                if (!key) continue;

                const val = row[col];

                if (key === "sku") {
                    out[key] = String(val || "").trim();
                } else {
                    const num = Number(
                        String(val || "")
                            .replace("%", "")
                            .replace(",", ".")
                    );
                    out[key] = isNaN(num) ? 0 : num;
                }
            }

            return out.sku ? out as FunnelRow : null;
        })
        .filter(Boolean) as FunnelRow[];
}
