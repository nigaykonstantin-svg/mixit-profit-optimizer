'use client';

import { CategoryConfig } from '@/analytics-engine/wb/wb-config-loader';

/**
 * Supabase table: wb_category_config
 * 
 * CREATE TABLE wb_category_config (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   category TEXT NOT NULL UNIQUE,
 *   min_margin_pct NUMERIC NOT NULL,
 *   ctr_warning NUMERIC NOT NULL,
 *   cr_order_warning NUMERIC NOT NULL,
 *   price_step_pct NUMERIC NOT NULL,
 *   drr_warning NUMERIC NOT NULL,
 *   stock_critical_days NUMERIC NOT NULL DEFAULT 10,
 *   stock_overstock_days NUMERIC NOT NULL DEFAULT 120,
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */

// In-memory mock storage (will be replaced with Supabase)
let MOCK_CONFIGS: CategoryConfig[] = [
    {
        category: 'FACE',
        min_margin_pct: 25,
        ctr_warning: 2.5,
        cr_order_warning: 3.0,
        price_step_pct: 3,
        drr_warning: 20,
        stock_critical_days: 10,
        stock_overstock_days: 120,
    },
    {
        category: 'HAIR',
        min_margin_pct: 22,
        ctr_warning: 2.0,
        cr_order_warning: 2.5,
        price_step_pct: 4,
        drr_warning: 18,
        stock_critical_days: 14,
        stock_overstock_days: 90,
    },
    {
        category: 'BODY',
        min_margin_pct: 20,
        ctr_warning: 1.8,
        cr_order_warning: 2.0,
        price_step_pct: 5,
        drr_warning: 15,
        stock_critical_days: 14,
        stock_overstock_days: 100,
    },
    {
        category: 'MAKEUP',
        min_margin_pct: 30,
        ctr_warning: 3.0,
        cr_order_warning: 4.0,
        price_step_pct: 2,
        drr_warning: 25,
        stock_critical_days: 7,
        stock_overstock_days: 60,
    },
];

/**
 * Get all category configurations
 * TODO: Replace with Supabase query
 */
export async function getCategoryConfigs(): Promise<CategoryConfig[]> {
    // TODO: Supabase implementation
    // const { data, error } = await supabase.from('wb_category_config').select('*');
    return [...MOCK_CONFIGS];
}

/**
 * Get single category configuration
 */
export async function getCategoryConfig(category: string): Promise<CategoryConfig | null> {
    const configs = await getCategoryConfigs();
    return configs.find(c => c.category === category) || null;
}

/**
 * Update category configuration
 * TODO: Replace with Supabase update
 */
export async function updateCategoryConfig(
    category: string,
    data: Partial<CategoryConfig>
): Promise<CategoryConfig | null> {
    // TODO: Supabase implementation
    // const { data: updated, error } = await supabase
    //   .from('wb_category_config')
    //   .update({ ...data, updated_at: new Date().toISOString() })
    //   .eq('category', category)
    //   .select()
    //   .single();

    const index = MOCK_CONFIGS.findIndex(c => c.category === category);
    if (index === -1) return null;

    MOCK_CONFIGS[index] = {
        ...MOCK_CONFIGS[index],
        ...data,
    };

    return MOCK_CONFIGS[index];
}

/**
 * Config field metadata for UI
 */
export const CONFIG_FIELDS = [
    { key: 'min_margin_pct', label: 'Мин. маржа (%)', min: 0, max: 100, step: 1 },
    { key: 'ctr_warning', label: 'CTR порог (%)', min: 0, max: 10, step: 0.1 },
    { key: 'cr_order_warning', label: 'CR заказа порог (%)', min: 0, max: 10, step: 0.1 },
    { key: 'price_step_pct', label: 'Шаг цены (%)', min: 1, max: 20, step: 1 },
    { key: 'drr_warning', label: 'ДРР порог (%)', min: 0, max: 50, step: 1 },
    { key: 'stock_critical_days', label: 'Критич. запас (дней)', min: 1, max: 30, step: 1 },
    { key: 'stock_overstock_days', label: 'Затоваривание (дней)', min: 30, max: 365, step: 1 },
] as const;

export type ConfigFieldKey = typeof CONFIG_FIELDS[number]['key'];
