// ============================================
// SKU CATALOG - Supabase Storage
// ============================================

import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

export interface SkuCatalogEntry {
    id?: number;
    sku: string;
    category: string;
    subcategory?: string;
    name?: string;
    brand?: string;
}

// ============================================
// Supabase Operations
// ============================================

// Get all catalog entries from Supabase
export async function fetchSkuCatalog(): Promise<SkuCatalogEntry[]> {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, using localStorage fallback');
        return getLocalCatalog();
    }

    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('sku_catalog')
            .select('*')
            .order('sku');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Failed to fetch catalog from Supabase:', error);
        return getLocalCatalog();
    }
}

// Get catalog as Map for fast lookup
export async function fetchSkuCatalogMap(): Promise<Map<string, SkuCatalogEntry>> {
    const entries = await fetchSkuCatalog();
    const map = new Map<string, SkuCatalogEntry>();
    entries.forEach(e => map.set(e.sku, e));
    return map;
}

// Upsert multiple entries
export async function upsertSkuCatalog(entries: SkuCatalogEntry[]): Promise<{ success: boolean; count: number; error?: string }> {
    if (!isSupabaseConfigured()) {
        saveLocalCatalog(entries);
        return { success: true, count: entries.length };
    }

    try {
        const supabase = getSupabaseClient();
        const { error } = await supabase
            .from('sku_catalog')
            .upsert(
                entries.map(e => ({
                    sku: e.sku,
                    category: e.category,
                    subcategory: e.subcategory || null,
                    name: e.name || null,
                    brand: e.brand || 'MIXIT',
                })),
                { onConflict: 'sku' }
            );

        if (error) throw error;
        return { success: true, count: entries.length };
    } catch (error) {
        console.error('Failed to upsert catalog:', error);
        return { success: false, count: 0, error: String(error) };
    }
}

// Get single SKU category
export async function getSkuCategoryAsync(sku: string): Promise<SkuCatalogEntry | null> {
    if (!isSupabaseConfigured()) {
        const local = getLocalCatalog();
        return local.find(e => e.sku === sku) || null;
    }

    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('sku_catalog')
            .select('*')
            .eq('sku', sku)
            .single();

        if (error) return null;
        return data;
    } catch {
        return null;
    }
}

// Delete all catalog entries
export async function clearSkuCatalogAsync(): Promise<void> {
    if (!isSupabaseConfigured()) {
        clearLocalCatalog();
        return;
    }

    try {
        const supabase = getSupabaseClient();
        await supabase.from('sku_catalog').delete().neq('id', 0);
    } catch (error) {
        console.error('Failed to clear catalog:', error);
    }
}

// Get stats
export async function getCatalogStatsAsync(): Promise<{ total: number; categories: string[] }> {
    const entries = await fetchSkuCatalog();
    const categories = new Set<string>();
    entries.forEach(e => categories.add(e.category));
    return {
        total: entries.length,
        categories: Array.from(categories).sort(),
    };
}

// ============================================
// LocalStorage Fallback (for non-Supabase use)
// ============================================

const CATALOG_KEY = 'mixit_sku_catalog';

function getLocalCatalog(): SkuCatalogEntry[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(CATALOG_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

function saveLocalCatalog(entries: SkuCatalogEntry[]): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(CATALOG_KEY, JSON.stringify(entries));
    }
}

function clearLocalCatalog(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(CATALOG_KEY);
    }
}

// ============================================
// Sync: localStorage → Supabase
// ============================================

export async function syncLocalToSupabase(): Promise<{ success: boolean; count: number }> {
    const local = getLocalCatalog();
    if (local.length === 0) return { success: true, count: 0 };

    const result = await upsertSkuCatalog(local);
    if (result.success) {
        clearLocalCatalog(); // Clear local after successful sync
    }
    return result;
}

// ============================================
// Parse from Excel data
// ============================================

export function parseCatalogData(data: Record<string, unknown>[]): SkuCatalogEntry[] {
    return data
        .filter(row => row['sku'] || row['SKU'] || row['Артикул'] || row['артикул'] || row['sku_wb'])
        .map(row => {
            // SKU: support multiple column names
            const sku = String(
                row['sku'] || row['SKU'] || row['Артикул'] || row['артикул'] || row['sku_wb'] || ''
            ).trim();
            
            // Category: support wb_category and other variants
            const category = String(
                row['category'] || row['Category'] || row['Категория'] || row['категория'] ||
                row['wb_category'] || row['WB_category'] || ''
            ).trim();
            
            // Subcategory: support wb_subcategory and other variants
            const subcategoryRaw = row['subcategory'] || row['Subcategory'] || row['Подкатегория'] || row['подкатегория'] ||
                row['wb_subcategory'] || row['WB_subcategory'];
            const subcategory = subcategoryRaw ? String(subcategoryRaw).trim() : undefined;
            
            // Name: support product_name and other variants
            const nameRaw = row['name'] || row['Name'] || row['Название'] || row['название'] ||
                row['product_name'] || row['Product_name'] || row['ProductName'];
            const name = nameRaw ? String(nameRaw).trim() : undefined;
            
            // Brand
            const brandRaw = row['brand'] || row['Brand'] || row['Бренд'] || row['бренд'];
            const brand = brandRaw ? String(brandRaw).trim() : 'MIXIT';
            
            return { sku, category, subcategory, name, brand };
        })
        .filter(e => e.sku && e.category);
}

// ============================================
// Backward compatibility exports
// ============================================

// Synchronous getSkuCatalog for backward compatibility (uses cached/local)
let cachedCatalog: Map<string, SkuCatalogEntry> | null = null;

export function getSkuCatalog(): Map<string, SkuCatalogEntry> {
    if (cachedCatalog) return cachedCatalog;

    // Fallback to localStorage
    const local = getLocalCatalog();
    const map = new Map<string, SkuCatalogEntry>();
    local.forEach(e => map.set(e.sku, e));
    return map;
}

export function getSkuCategory(sku: string): SkuCatalogEntry | undefined {
    return getSkuCatalog().get(sku);
}

// Initialize cache from Supabase
export async function initializeCatalogCache(): Promise<void> {
    cachedCatalog = await fetchSkuCatalogMap();
}

// Legacy exports
export function saveSkuCatalog(entries: SkuCatalogEntry[]): void {
    saveLocalCatalog(entries);
    // Also try to save to Supabase
    upsertSkuCatalog(entries).catch(console.error);
}

export function getCatalogStats(): { total: number; categories: string[] } {
    const catalog = getSkuCatalog();
    const categories = new Set<string>();
    catalog.forEach(e => categories.add(e.category));
    return {
        total: catalog.size,
        categories: Array.from(categories).sort(),
    };
}

export function clearSkuCatalog(): void {
    clearLocalCatalog();
    clearSkuCatalogAsync().catch(console.error);
}
