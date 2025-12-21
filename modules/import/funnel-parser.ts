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

const COLUMN_MAP: Record<string, keyof FunnelRow> = {
    // Basic info
    "Артикул WB": "sku",
    "Название": "name",
    "Бренд": "brand",

    // Funnel metrics - exact column names from WB export
    "Показы": "views",
    "Переходы в карточку": "clicks",
    "Положили в корзину": "cart",
    "Заказали, шт": "orders",
    "CTR": "ctr",
    "Конверсия в корзину, %": "cr_cart",
    "Конверсия в заказ, %": "cr_order",

    // Price & Revenue
    "Средняя цена, ₽": "avg_price",
    "Заказали на сумму, ₽": "revenue",
    "Выручка": "revenue",

    // Stock
    "Остатки МП, шт": "stock_units",
    "Остатки": "stock_units",
    "Остатки склад ВБ, шт": "stock_units",

    // DRR (if exists)
    "DRR Поиск": "drr_search",
    "DRR Медиа": "drr_media",
    "DRR Блогеры": "drr_bloggers",
    "DRR остальное": "drr_other",
};

export function parseFunnelSheet(fileBuffer: Buffer): FunnelRow[] {
    const workbook = xlsx.read(fileBuffer, { cellDates: false });
    const sheet = workbook.Sheets[workbook.SheetNames[3]]; // 4-ая вкладка

    const json = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet);

    return json.map((row) => {
        const result: Partial<FunnelRow> = {};

        for (const key in row) {
            const cleanKey = key.trim();
            const mappedKey = COLUMN_MAP[cleanKey];

            if (!mappedKey) continue;

            let value = row[key];

            // числа в нормальный формат
            if (typeof value === "string") {
                value = Number(
                    value.replace("%", "").replace(",", ".").trim()
                );
            }

            (result as Record<string, unknown>)[mappedKey] = value;
        }

        return result as FunnelRow;
    });
}
