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
    "Артикул WB": "sku",
    "Название": "name",
    "Бренд": "brand",

    "Показы": "views",
    "Клики": "clicks",
    "В корзину": "cart",
    "Заказы": "orders",
    "CTR": "ctr",
    "CR в корзину": "cr_cart",
    "CR в заказ": "cr_order",

    "Средняя цена, ₽": "avg_price",
    "Выручка": "revenue",

    "Остатки": "stock_units",

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
