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

    competitor_price_min: number;
    competitor_price_avg: number;

    revenue: number;
    stock_units: number;

    drr_search: number;
    drr_media: number;
    drr_bloggers: number;
    drr_other: number;

    kp_pct: number;           // Коммерческая прибыль %
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
   COLUMN MAP - EXACT from Excel
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

    // COMPETITORS
    "ценаконкурентовмин": "competitor_price_min",
    "минценаконкурента": "competitor_price_min",
    "средняяценаконкурентов": "competitor_price_avg",

    // REVENUE
    "суммавыручкарубсндс": "revenue",

    // STOCK
    "сумматекущийостатокшт": "stock_units",

    // DRR
    "drrпоиск": "drr_search",
    "drrмедиа": "drr_media",
    "drrблогеры": "drr_bloggers",
    "drростальное": "drr_other",

    // KP (Commercial Profit) - multiple variations
    "кп": "kp_pct",
    "кп%": "kp_pct",
    "кпpercent": "kp_pct",
    "коммерческаяприбыль": "kp_pct",
    "прибыль": "kp_pct",
};

/* ============================
   PARSER
============================ */

export function parseFunnelSheet(fileBuffer: Buffer): FunnelRow[] {
    const workbook = xlsx.read(fileBuffer, { cellDates: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    console.log("Sheet name:", workbook.SheetNames[0]);

    // First get all rows to find header row
    const allRows = xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

    // Find the row with actual headers (contains "Артикул")
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, allRows.length); i++) {
        const row = allRows[i] as unknown[];
        if (row && row.some((cell) => String(cell).includes("Артикул"))) {
            headerRowIndex = i;
            console.log("Found header row at index:", i);
            console.log("Headers:", row);
            break;
        }
    }

    // Parse with correct range starting from header row
    const raw = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: null,
        range: headerRowIndex
    });

    console.log("Parsed rows count:", raw.length);
    if (raw.length > 0) {
        console.log("Column headers:", Object.keys(raw[0]));

        // Debug: print all columns and whether they matched
        const unmapped: string[] = [];
        for (const col of Object.keys(raw[0])) {
            const normalized = normalize(col);
            const mapped = HEADER_MAP[normalized];
            if (mapped) {
                console.log(`  MATCHED: "${col}" -> normalized: "${normalized}" -> ${mapped}`);
            } else {
                unmapped.push(`"${col}" (normalized: "${normalized}")`);
            }
        }
        if (unmapped.length > 0) {
            console.log("  UNMATCHED:", unmapped.join(", "));
        }
    }

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
