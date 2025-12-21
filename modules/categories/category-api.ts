'use client';

import { Category, Subcategory, PlanValue, TopProduct } from './category-model';

// Demo categories data
const DEMO_CATEGORIES: Category[] = [
    {
        id: '1',
        name: 'Лицо',
        planThisMonth: 5000000,
        factThisMonth: 4850000,
        subcategories: [
            { id: '1-1', categoryId: '1', name: 'Кремы', planThisMonth: 2000000, factThisMonth: 1950000 },
            { id: '1-2', categoryId: '1', name: 'Сыворотки', planThisMonth: 1500000, factThisMonth: 1600000 },
            { id: '1-3', categoryId: '1', name: 'Маски', planThisMonth: 1500000, factThisMonth: 1300000 },
        ],
    },
    {
        id: '2',
        name: 'Волосы',
        planThisMonth: 3500000,
        factThisMonth: 3700000,
        subcategories: [
            { id: '2-1', categoryId: '2', name: 'Шампуни', planThisMonth: 1500000, factThisMonth: 1600000 },
            { id: '2-2', categoryId: '2', name: 'Бальзамы', planThisMonth: 1000000, factThisMonth: 1100000 },
            { id: '2-3', categoryId: '2', name: 'Маски', planThisMonth: 1000000, factThisMonth: 1000000 },
        ],
    },
    {
        id: '3',
        name: 'Макияж',
        planThisMonth: 4000000,
        factThisMonth: 3200000,
        subcategories: [
            { id: '3-1', categoryId: '3', name: 'Губы', planThisMonth: 2000000, factThisMonth: 1500000 },
            { id: '3-2', categoryId: '3', name: 'Глаза', planThisMonth: 1500000, factThisMonth: 1300000 },
            { id: '3-3', categoryId: '3', name: 'Лицо', planThisMonth: 500000, factThisMonth: 400000 },
        ],
    },
    {
        id: '4',
        name: 'Тело',
        planThisMonth: 2500000,
        factThisMonth: 2600000,
        subcategories: [
            { id: '4-1', categoryId: '4', name: 'Лосьоны', planThisMonth: 1000000, factThisMonth: 1100000 },
            { id: '4-2', categoryId: '4', name: 'Скрабы', planThisMonth: 800000, factThisMonth: 850000 },
            { id: '4-3', categoryId: '4', name: 'Масла', planThisMonth: 700000, factThisMonth: 650000 },
        ],
    },
];

// Demo plan/fact history
const DEMO_PLAN_FACT: PlanValue[] = [
    { month: '2025-07', plan: 12000000, fact: 11500000 },
    { month: '2025-08', plan: 13000000, fact: 12800000 },
    { month: '2025-09', plan: 14000000, fact: 14200000 },
    { month: '2025-10', plan: 14500000, fact: 13900000 },
    { month: '2025-11', plan: 15000000, fact: 15500000 },
    { month: '2025-12', plan: 15000000, fact: 14350000 },
];

// Demo top products
const DEMO_TOP_PRODUCTS: TopProduct[] = [
    { id: '1', sku: 'MX-001', name: 'Крем увлажняющий', sales: 1250, profit: 450000, stockStatus: 'in_stock' },
    { id: '2', sku: 'MX-002', name: 'Сыворотка витамин C', sales: 980, profit: 380000, stockStatus: 'in_stock' },
    { id: '3', sku: 'MX-003', name: 'Шампунь восстанавливающий', sales: 850, profit: 290000, stockStatus: 'low_stock' },
    { id: '4', sku: 'MX-004', name: 'Помада матовая красная', sales: 720, profit: 250000, stockStatus: 'in_stock' },
    { id: '5', sku: 'MX-005', name: 'Маска для лица', sales: 680, profit: 220000, stockStatus: 'out_of_stock' },
    { id: '6', sku: 'MX-006', name: 'Лосьон для тела', sales: 650, profit: 180000, stockStatus: 'in_stock' },
    { id: '7', sku: 'MX-007', name: 'Тушь для ресниц', sales: 620, profit: 210000, stockStatus: 'in_stock' },
    { id: '8', sku: 'MX-008', name: 'Бальзам для губ', sales: 580, profit: 150000, stockStatus: 'low_stock' },
    { id: '9', sku: 'MX-009', name: 'Скраб для тела', sales: 540, profit: 140000, stockStatus: 'in_stock' },
    { id: '10', sku: 'MX-010', name: 'Масло для волос', sales: 520, profit: 170000, stockStatus: 'in_stock' },
    { id: '11', sku: 'MX-011', name: 'Крем антивозрастной', sales: 490, profit: 280000, stockStatus: 'in_stock' },
    { id: '12', sku: 'MX-012', name: 'Тени для век палетка', sales: 470, profit: 190000, stockStatus: 'low_stock' },
    { id: '13', sku: 'MX-013', name: 'Гель для душа', sales: 450, profit: 120000, stockStatus: 'in_stock' },
    { id: '14', sku: 'MX-014', name: 'Пудра компактная', sales: 430, profit: 160000, stockStatus: 'in_stock' },
    { id: '15', sku: 'MX-015', name: 'Кондиционер для волос', sales: 410, profit: 130000, stockStatus: 'out_of_stock' },
    { id: '16', sku: 'MX-016', name: 'Румяна', sales: 390, profit: 140000, stockStatus: 'in_stock' },
    { id: '17', sku: 'MX-017', name: 'Масло для тела', sales: 370, profit: 110000, stockStatus: 'in_stock' },
    { id: '18', sku: 'MX-018', name: 'Тоник для лица', sales: 350, profit: 100000, stockStatus: 'low_stock' },
    { id: '19', sku: 'MX-019', name: 'Спрей для волос', sales: 330, profit: 95000, stockStatus: 'in_stock' },
    { id: '20', sku: 'MX-020', name: 'Блеск для губ', sales: 310, profit: 90000, stockStatus: 'in_stock' },
];

// API Functions (stubs with demo data)

export async function getCategories(): Promise<Category[]> {
    // TODO: Replace with real API call
    return DEMO_CATEGORIES;
}

export async function getSubcategories(categoryId: string): Promise<Subcategory[]> {
    // TODO: Replace with real API call
    const category = DEMO_CATEGORIES.find(c => c.id === categoryId);
    return category?.subcategories || [];
}

export async function updatePlan(
    categoryId: string,
    subcategoryId: string | null,
    month: string,
    value: number
): Promise<void> {
    // TODO: Replace with real API call
    console.log('updatePlan:', { categoryId, subcategoryId, month, value });
}

export async function updateFact(
    categoryId: string,
    subcategoryId: string | null,
    month: string,
    value: number
): Promise<void> {
    // TODO: Replace with real API call
    console.log('updateFact:', { categoryId, subcategoryId, month, value });
}

export async function getTopProducts(limit: number = 20): Promise<TopProduct[]> {
    // TODO: Replace with real API call
    return DEMO_TOP_PRODUCTS.slice(0, limit);
}

export async function getPlanFactHistory(categoryId?: string): Promise<PlanValue[]> {
    // TODO: Replace with real API call
    return DEMO_PLAN_FACT;
}
