// WB Types - Wildberries data types

export interface WbSku {
    sku: string;
    name: string;
    brand: string;
    category: string;
    subcategory: string;
    price: number;
    costPrice: number;
    stock: number;
}

export interface WbSale {
    date: string;
    sku: string;
    quantity: number;
    revenue: number;
    profit: number;
    commission: number;
    logistics: number;
}

export interface WbOrder {
    orderId: string;
    date: string;
    sku: string;
    quantity: number;
    price: number;
    status: 'pending' | 'delivered' | 'returned' | 'cancelled';
}

export interface WbStock {
    sku: string;
    warehouse: string;
    quantity: number;
    daysOfStock: number;
}

export interface WbAdvertising {
    campaignId: string;
    sku: string;
    spend: number;
    impressions: number;
    clicks: number;
    orders: number;
    cpc: number;
    ctr: number;
    drr: number;
}

export interface WbReport {
    period: {
        from: string;
        to: string;
    };
    sales: WbSale[];
    orders: WbOrder[];
    stocks: WbStock[];
    advertising: WbAdvertising[];
}
