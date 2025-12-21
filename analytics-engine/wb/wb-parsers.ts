// WB Parsers - Parse raw data from Wildberries API/Excel

import { WbSku, WbSale, WbOrder, WbStock, WbAdvertising, WbSkuData, WbReport, WbPeriod } from './wb-types';

/**
 * Parse SKU row from Excel
 */
export function parseSkuRow(row: Record<string, unknown>): WbSku {
    return {
        sku: String(row['sku'] ?? ''),
        category: String(row['category'] ?? ''),
        subcategory: String(row['subcategory'] ?? ''),
        name: String(row['name'] ?? ''),
        legal_entity: String(row['legal_entity'] ?? ''),
    };
}

/**
 * Parse Sale row from Excel
 */
export function parseSaleRow(row: Record<string, unknown>): WbSale {
    return {
        date: String(row['date'] ?? ''),
        revenue_gross: Number(row['revenue_gross'] ?? 0),
        revenue_vat: Number(row['revenue_vat'] ?? 0),
        revenue_per_view: Number(row['revenue_per_view'] ?? 0),
        price_retail: Number(row['price_retail'] ?? 0),
        price_buyer: Number(row['price_buyer'] ?? 0),
        price_per_unit_profit_before_mkt: Number(row['price_per_unit_profit_before_mkt'] ?? 0),
        profit_before_mkt: Number(row['profit_before_mkt'] ?? 0),
        profit_before_mkt_per_unit: Number(row['profit_before_mkt_per_unit'] ?? 0),
        profit_before_mkt_per_view: Number(row['profit_before_mkt_per_view'] ?? 0),
        profit_margin_before_mkt: Number(row['profit_margin_before_mkt'] ?? 0),
    };
}

/**
 * Parse Order row from Excel
 */
export function parseOrderRow(row: Record<string, unknown>): WbOrder {
    return {
        clicks: Number(row['clicks'] ?? 0),
        views: Number(row['views'] ?? 0),
        cart: Number(row['cart'] ?? 0),
        orders: Number(row['orders'] ?? 0),
        ctr: Number(row['ctr'] ?? 0),
        cr_cart: Number(row['cr_cart'] ?? 0),
        cr_order: Number(row['cr_order'] ?? 0),
    };
}

/**
 * Parse Stock row from Excel
 */
export function parseStockRow(row: Record<string, unknown>): WbStock {
    return {
        stock_units: Number(row['stock_units'] ?? 0),
    };
}

/**
 * Parse Advertising row from Excel
 */
export function parseAdvertisingRow(row: Record<string, unknown>): WbAdvertising {
    return {
        ad_search_spend: Number(row['ad_search_spend'] ?? 0),
        ad_search_drr: Number(row['ad_search_drr'] ?? 0),
        ad_media_drr: Number(row['ad_media_drr'] ?? 0),
        ad_bloggers_drr: Number(row['ad_bloggers_drr'] ?? 0),
        ad_other_drr: Number(row['ad_other_drr'] ?? 0),
    };
}

/**
 * Parse combined SKU data row from Excel
 */
export function parseSkuDataRow(row: Record<string, unknown>): WbSkuData {
    return {
        sku: parseSkuRow(row),
        sale: parseSaleRow(row),
        order: parseOrderRow(row),
        stock: parseStockRow(row),
        advertising: parseAdvertisingRow(row),
    };
}

/**
 * Parse full report from Excel rows
 */
export function parseReport(rows: Record<string, unknown>[], period: WbPeriod): WbReport {
    return {
        period,
        data: rows.map(parseSkuDataRow),
    };
}

/**
 * Validate parsed report
 */
export function validateReport(report: WbReport): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!report.period.from || !report.period.to) {
        errors.push('Missing period dates');
    }

    if (report.data.length === 0) {
        errors.push('Report contains no data');
    }

    for (let i = 0; i < report.data.length; i++) {
        const item = report.data[i];
        if (!item.sku.sku) {
            errors.push(`Row ${i + 1}: Missing SKU`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
