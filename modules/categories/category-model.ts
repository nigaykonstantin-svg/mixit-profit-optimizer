// Category type
export interface Category {
    id: string;
    name: string;
    planThisMonth: number;
    factThisMonth: number;
    subcategories: Subcategory[];
}

// Subcategory type
export interface Subcategory {
    id: string;
    categoryId: string;
    name: string;
    planThisMonth: number;
    factThisMonth: number;
}

// Plan value for monthly tracking
export interface PlanValue {
    month: string; // YYYY-MM format
    plan: number;
    fact: number;
}

// Product type
export interface Product {
    id: string;
    sku: string;
    name: string;
    categoryId: string;
    subcategoryId: string;
    sales: number;
    profit: number;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
}

// Top product for table display
export interface TopProduct {
    id: string;
    sku: string;
    name: string;
    sales: number;
    profit: number;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
}

// Stock status labels
export const STOCK_STATUS_LABELS = {
    in_stock: 'В наличии',
    low_stock: 'Мало',
    out_of_stock: 'Нет в наличии',
} as const;

// Helper to calculate deviation percentage
export function calculateDeviation(plan: number, fact: number): number {
    if (plan === 0) return 0;
    return Math.round(((fact - plan) / plan) * 100);
}
