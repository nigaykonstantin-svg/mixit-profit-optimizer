// WB Parsers - Parse raw data from Wildberries API/Excel

import { WbSale, WbOrder, WbStock, WbAdvertising, WbReport } from './wb-types';

// Parse sales report from raw data
export function parseSalesReport(rawData: unknown[]): WbSale[] {
    // TODO: Implement real parsing logic
    // Stub implementation
    return [];
}

// Parse orders report from raw data
export function parseOrdersReport(rawData: unknown[]): WbOrder[] {
    // TODO: Implement real parsing logic
    // Stub implementation
    return [];
}

// Parse stock report from raw data
export function parseStockReport(rawData: unknown[]): WbStock[] {
    // TODO: Implement real parsing logic
    // Stub implementation
    return [];
}

// Parse advertising report from raw data
export function parseAdvertisingReport(rawData: unknown[]): WbAdvertising[] {
    // TODO: Implement real parsing logic
    // Stub implementation
    return [];
}

// Parse full report from multiple sources
export function parseFullReport(
    salesData: unknown[],
    ordersData: unknown[],
    stocksData: unknown[],
    adsData: unknown[],
    period: { from: string; to: string }
): WbReport {
    return {
        period,
        sales: parseSalesReport(salesData),
        orders: parseOrdersReport(ordersData),
        stocks: parseStockReport(stocksData),
        advertising: parseAdvertisingReport(adsData),
    };
}

// Validate parsed data
export function validateReport(report: WbReport): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!report.period.from || !report.period.to) {
        errors.push('Missing period dates');
    }

    // Add more validation rules as needed

    return {
        valid: errors.length === 0,
        errors,
    };
}
