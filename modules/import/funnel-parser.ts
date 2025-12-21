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

    console.log('Available sheets:', workbook.SheetNames);

    // Try to find "Товары" sheet or use 4th sheet
    let sheetName = workbook.SheetNames.find(name => name.includes('Товары')) || workbook.SheetNames[3];
    console.log('Using sheet:', sheetName);

    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet);

    console.log('Rows in sheet:', json.length);
    if (json.length > 0) {
        console.log('First row keys:', Object.keys(json[0]));
        console.log('First row sample:', json[0]);
    }

    return json.map((row) => {
        const result: Partial<FunnelRow> = {};

        for (const key in row) {
            const cleanKey = key.trim();
            const mappedKey = COLUMN_MAP[cleanKey];

            if (!mappedKey) continue;

            let value = row[key];

            // SKU is string, keep it as is
            if (mappedKey === 'sku' || mappedKey === 'name' || mappedKey === 'brand') {
                result[mappedKey] = String(value || '');
                continue;
            }

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
