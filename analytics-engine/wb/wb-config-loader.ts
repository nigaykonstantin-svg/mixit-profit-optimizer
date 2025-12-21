// WB Config Loader - Load category configuration from Supabase

/**
 * Category configuration from CATEGORY_CONFIG table
 * 
 * Supabase table structure:
 * CREATE TABLE category_config (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   category TEXT NOT NULL UNIQUE,
 *   min_margin_pct NUMERIC NOT NULL,
 *   ctr_warning NUMERIC NOT NULL,
 *   cr_order_warning NUMERIC NOT NULL,
 *   price_step_pct NUMERIC NOT NULL,
 *   drr_warning NUMERIC NOT NULL,
 *   stock_critical_days NUMERIC NOT NULL DEFAULT 10,
 *   stock_overstock_days NUMERIC NOT NULL DEFAULT 120,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 */
export interface CategoryConfig {
    category: string;
    min_margin_pct: number;
    ctr_warning: number;
    cr_order_warning: number;
    price_step_pct: number;
    drr_warning: number;
    stock_critical_days: number;
    stock_overstock_days: number;
}

/**
 * Static mocked configurations for each category
 * TODO: Replace with Supabase query when connected
 */
const MOCK_CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
    FACE: {
        category: 'FACE',
        min_margin_pct: 25,
        ctr_warning: 2.5,
        cr_order_warning: 3.0,
        price_step_pct: 3,
        drr_warning: 20,
        stock_critical_days: 10,
        stock_overstock_days: 120,
    },
    HAIR: {
        category: 'HAIR',
        min_margin_pct: 22,
        ctr_warning: 2.0,
        cr_order_warning: 2.5,
        price_step_pct: 4,
        drr_warning: 18,
        stock_critical_days: 14,
        stock_overstock_days: 90,
    },
    BODY: {
        category: 'BODY',
        min_margin_pct: 20,
        ctr_warning: 1.8,
        cr_order_warning: 2.0,
        price_step_pct: 5,
        drr_warning: 15,
        stock_critical_days: 14,
        stock_overstock_days: 100,
    },
    MAKEUP: {
        category: 'MAKEUP',
        min_margin_pct: 30,
        ctr_warning: 3.0,
        cr_order_warning: 4.0,
        price_step_pct: 2,
        drr_warning: 25,
        stock_critical_days: 7,
        stock_overstock_days: 60,
    },
};

/**
 * Default configuration for unknown categories
 */
const DEFAULT_CONFIG: CategoryConfig = {
    category: 'DEFAULT',
    min_margin_pct: 20,
    ctr_warning: 2.0,
    cr_order_warning: 2.5,
    price_step_pct: 3,
    drr_warning: 20,
    stock_critical_days: 10,
    stock_overstock_days: 120,
};

/**
 * Get category configuration
 * 
 * TODO: Implement Supabase query:
 * const { data, error } = await supabase
 *   .from('category_config')
 *   .select('*')
 *   .eq('category', category)
 *   .single();
 * 
 * @param category - название категории
 * @returns Promise с конфигурацией категории
 */
export async function getCategoryConfig(category: string): Promise<CategoryConfig> {
    // TODO: Replace with Supabase query
    const normalizedCategory = category.toUpperCase();
    return MOCK_CATEGORY_CONFIGS[normalizedCategory] || DEFAULT_CONFIG;
}

/**
 * Get all category configurations
 * 
 * @returns Promise с Map всех конфигураций
 */
export async function getAllCategoryConfigs(): Promise<Map<string, CategoryConfig>> {
    // TODO: Replace with Supabase query
    const configs = new Map<string, CategoryConfig>();
    for (const [key, config] of Object.entries(MOCK_CATEGORY_CONFIGS)) {
        configs.set(key, config);
    }
    return configs;
}
