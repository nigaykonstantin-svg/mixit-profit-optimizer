// WB Types - Wildberries data types matching Excel export structure

/**
 * SKU (Stock Keeping Unit) - товарная позиция
 */
export interface WbSku {
    sku: string;
    category: string;
    subcategory: string;
    name: string;
    legal_entity: string;
}

/**
 * Sale - данные по продажам
 */
export interface WbSale {
    date: string; // YYYY-MM-DD
    revenue_gross: number;
    revenue_vat: number;
    revenue_per_view: number;
    price_retail: number;
    price_buyer: number;
    price_per_unit_profit_before_mkt: number;
    profit_before_mkt: number;
    profit_before_mkt_per_unit: number;
    profit_before_mkt_per_view: number;
    profit_margin_before_mkt: number;
}

/**
 * Order - данные по заказам и конверсии
 */
export interface WbOrder {
    clicks: number;
    views: number;
    cart: number;
    orders: number;
    ctr: number;
    cr_cart: number;
    cr_order: number;
}

/**
 * Stock - данные по остаткам
 */
export interface WbStock {
    stock_units: number;
}

/**
 * Advertising - данные по рекламе
 */
export interface WbAdvertising {
    ad_search_spend: number;
    ad_search_drr: number;
    ad_media_drr: number;
    ad_bloggers_drr: number;
    ad_other_drr: number;
}

/**
 * Combined SKU data - все данные по SKU за период
 */
export interface WbSkuData {
    sku: WbSku;
    sale: WbSale;
    order: WbOrder;
    stock: WbStock;
    advertising: WbAdvertising;
}

/**
 * Report period
 */
export interface WbPeriod {
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
}

/**
 * Full report - полный отчёт за период
 */
export interface WbReport {
    period: WbPeriod;
    data: WbSkuData[];
}


