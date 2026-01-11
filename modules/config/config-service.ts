// Config service - works on both server and client

import { CategoryConfig } from '@/analytics-engine/wb/wb-config-loader';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

/**
 * Supabase table: wb_category_config
 * 
 * SQL to create table:
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
 * 
 * INSERT default values (use Russian names for UI consistency):
 * INSERT INTO wb_category_config (category, min_margin_pct, ctr_warning, cr_order_warning, price_step_pct, drr_warning, stock_critical_days, stock_overstock_days)
 * VALUES 
 *   ('Макияж', 30, 3.0, 4.0, 2, 25, 7, 60),
 *   ('Уход за волосами', 22, 2.0, 2.5, 4, 18, 14, 90),
 *   ('Уход за лицом', 25, 2.5, 3.0, 3, 20, 10, 120),
 *   ('Уход за телом', 20, 1.8, 2.0, 5, 15, 14, 100);
 */

// ============================================
// CATEGORY MAPPING - Bidirectional Russian ↔ English
// ============================================

export const CATEGORY_MAP = {
    // Russian → English (canonical key)
    'Макияж': 'MAKEUP',
    'Уход за волосами': 'HAIR',
    'Уход за лицом': 'FACE',
    'Уход за телом': 'BODY',
    // English → Russian (display name)
    'MAKEUP': 'Макияж',
    'HAIR': 'Уход за волосами',
    'FACE': 'Уход за лицом',
    'BODY': 'Уход за телом',
} as const;

// Russian display names for UI (ordered)
export const CATEGORY_DISPLAY_NAMES = [
    'Макияж',
    'Уход за волосами',
    'Уход за лицом',
    'Уход за телом',
] as const;

// Normalize any category name to canonical English key
export function normalizeCategoryKey(category: string): string {
    const upper = category.toUpperCase();
    // If already English key
    if (['MAKEUP', 'HAIR', 'FACE', 'BODY'].includes(upper)) {
        return upper;
    }
    // Try Russian mapping
    return CATEGORY_MAP[category as keyof typeof CATEGORY_MAP] || category.toUpperCase();
}

// Get display name (Russian) for a category
export function getCategoryDisplayName(category: string): string {
    const upper = category.toUpperCase();
    if (['MAKEUP', 'HAIR', 'FACE', 'BODY'].includes(upper)) {
        return CATEGORY_MAP[upper as keyof typeof CATEGORY_MAP] || category;
    }
    // Already Russian or unknown
    return category;
}

// Fallback mock data (using Russian names for consistency with UI)
const MOCK_CONFIGS: CategoryConfig[] = [
    {
        category: 'Макияж',
        min_margin_pct: 30,
        ctr_warning: 3.0,
        cr_order_warning: 4.0,
        price_step_pct: 2,
        drr_warning: 25,
        stock_critical_days: 7,
        stock_overstock_days: 60,
    },
    {
        category: 'Уход за волосами',
        min_margin_pct: 22,
        ctr_warning: 2.0,
        cr_order_warning: 2.5,
        price_step_pct: 4,
        drr_warning: 18,
        stock_critical_days: 14,
        stock_overstock_days: 90,
    },
    {
        category: 'Уход за лицом',
        min_margin_pct: 25,
        ctr_warning: 2.5,
        cr_order_warning: 3.0,
        price_step_pct: 3,
        drr_warning: 20,
        stock_critical_days: 10,
        stock_overstock_days: 120,
    },
    {
        category: 'Уход за телом',
        min_margin_pct: 20,
        ctr_warning: 1.8,
        cr_order_warning: 2.0,
        price_step_pct: 5,
        drr_warning: 15,
        stock_critical_days: 14,
        stock_overstock_days: 100,
    },
];

// In-memory cache for mock mode
let mockConfigsCache = [...MOCK_CONFIGS];

/**
 * Get all category configurations from Supabase
 */
export async function getCategoryConfigs(): Promise<CategoryConfig[]> {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, using mock data');
        return [...mockConfigsCache];
    }

    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('wb_category_config')
            .select('category, min_margin_pct, ctr_warning, cr_order_warning, price_step_pct, drr_warning, stock_critical_days, stock_overstock_days')
            .order('category');

        if (error) {
            console.error('Supabase error:', error);
            return [...mockConfigsCache];
        }

        return data as CategoryConfig[];
    } catch (err) {
        console.error('Failed to fetch configs:', err);
        return [...mockConfigsCache];
    }
}

/**
 * Get single category configuration
 */
export async function getCategoryConfig(category: string): Promise<CategoryConfig | null> {
    if (!isSupabaseConfigured()) {
        return mockConfigsCache.find(c => c.category === category) || null;
    }

    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('wb_category_config')
            .select('category, min_margin_pct, ctr_warning, cr_order_warning, price_step_pct, drr_warning, stock_critical_days, stock_overstock_days')
            .eq('category', category)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return mockConfigsCache.find(c => c.category === category) || null;
        }

        return data as CategoryConfig;
    } catch (err) {
        console.error('Failed to fetch config:', err);
        return mockConfigsCache.find(c => c.category === category) || null;
    }
}

/**
 * Update category configuration in Supabase
 */
export async function updateCategoryConfig(
    category: string,
    data: Partial<CategoryConfig>
): Promise<CategoryConfig | null> {
    if (!isSupabaseConfigured()) {
        // Update mock cache
        const index = mockConfigsCache.findIndex(c => c.category === category);
        if (index === -1) return null;
        mockConfigsCache[index] = { ...mockConfigsCache[index], ...data };
        return mockConfigsCache[index];
    }

    try {
        const supabase = getSupabaseClient();
        const { data: updated, error } = await supabase
            .from('wb_category_config')
            .update({
                ...data,
                updated_at: new Date().toISOString(),
            })
            .eq('category', category)
            .select('category, min_margin_pct, ctr_warning, cr_order_warning, price_step_pct, drr_warning, stock_critical_days, stock_overstock_days')
            .single();

        if (error) {
            console.error('Supabase update error:', error);
            return null;
        }

        return updated as CategoryConfig;
    } catch (err) {
        console.error('Failed to update config:', err);
        return null;
    }
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
