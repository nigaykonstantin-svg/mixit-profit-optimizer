// ============================================
// SKU CATALOG - Category/Subcategory mapping
// ============================================

export interface SkuCatalogEntry {
    sku: string;
    category: string;
    subcategory?: string;
    brand?: string;
}

const CATALOG_KEY = 'mixit_sku_catalog';

// Get catalog from localStorage
export function getSkuCatalog(): Map<string, SkuCatalogEntry> {
    if (typeof window === 'undefined') return new Map();

    const stored = localStorage.getItem(CATALOG_KEY);
    if (!stored) return new Map();

    try {
        const entries: SkuCatalogEntry[] = JSON.parse(stored);
        const map = new Map<string, SkuCatalogEntry>();
        entries.forEach(e => map.set(e.sku, e));
        return map;
    } catch {
        return new Map();
    }
}

// Save catalog to localStorage
export function saveSkuCatalog(entries: SkuCatalogEntry[]): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(CATALOG_KEY, JSON.stringify(entries));
    }
}

// Get category for SKU
export function getSkuCategory(sku: string): SkuCatalogEntry | undefined {
    const catalog = getSkuCatalog();
    return catalog.get(sku);
}

// Parse catalog from CSV/Excel data
export function parseCatalogData(data: Record<string, unknown>[]): SkuCatalogEntry[] {
    return data
        .filter(row => row['sku'] || row['SKU'] || row['Артикул'] || row['артикул'])
        .map(row => ({
            sku: String(row['sku'] || row['SKU'] || row['Артикул'] || row['артикул'] || '').trim(),
            category: String(row['category'] || row['Category'] || row['Категория'] || row['категория'] || '').trim(),
            subcategory: row['subcategory'] || row['Subcategory'] || row['Подкатегория'] || row['подкатегория']
                ? String(row['subcategory'] || row['Subcategory'] || row['Подкатегория'] || row['подкатегория']).trim()
                : undefined,
            brand: row['brand'] || row['Brand'] || row['Бренд'] || row['бренд']
                ? String(row['brand'] || row['Brand'] || row['Бренд'] || row['бренд']).trim()
                : undefined,
        }))
        .filter(e => e.sku && e.category);
}

// Get catalog stats
export function getCatalogStats(): { total: number; categories: string[] } {
    const catalog = getSkuCatalog();
    const categories = new Set<string>();
    catalog.forEach(e => categories.add(e.category));
    return {
        total: catalog.size,
        categories: Array.from(categories).sort(),
    };
}

// Clear catalog
export function clearSkuCatalog(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(CATALOG_KEY);
    }
}
