// WB Config Loader - Load category configuration from config-service

import { getCategoryConfig as getConfigFromService, getCategoryConfigs } from '@/modules/config/config-service';

/**
 * Category configuration interface
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
 * Now dynamically loads from config-service (Supabase or mock)
 * 
 * @param category - название категории
 * @returns Promise с конфигурацией категории
 */
export async function getCategoryConfig(category: string): Promise<CategoryConfig> {
    const normalizedCategory = category.toUpperCase();
    const config = await getConfigFromService(normalizedCategory);
    return config || DEFAULT_CONFIG;
}

/**
 * Get all category configurations
 * 
 * @returns Promise с Map всех конфигураций
 */
export async function getAllCategoryConfigs(): Promise<Map<string, CategoryConfig>> {
    const configs = await getCategoryConfigs();
    const configMap = new Map<string, CategoryConfig>();
    for (const config of configs) {
        configMap.set(config.category, config);
    }
    return configMap;
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): CategoryConfig {
    return { ...DEFAULT_CONFIG };
}
