import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';
import { analyzeFunnel, AnalyzedFunnelRow } from '@/modules/analytics/funnel-metrics';
import { FunnelRow } from '@/modules/import/funnel-parser';
import { setCategoryConfigCache } from '@/modules/pricing/price-config';
import { getCategoryConfigs } from '@/modules/config';

interface SkuInsight {
    sku: string;
    value: number;
    detail: string;
    category?: string;
}

interface CategoryStats {
    id: string;
    name: string;
    icon: string;
    revenue: number;
    orders: number;
    avgCr: number;
    lowStock: number;
    needsPriceDown: number;
    critical: { sku: string; reason: string }[];
    warning: { sku: string; reason: string }[];
    recommendations: { sku: string; action: string }[];
}

interface SegmentedInsights {
    lowCtr: SkuInsight[];
    lowCrCart: SkuInsight[];
    lowCrOrder: SkuInsight[];
    priceDown: SkuInsight[];
    priceUp: SkuInsight[];
    lowStock: SkuInsight[];
    overstock: SkuInsight[];
}

// Icon mapping for known categories
function getCategoryIcon(category: string): string {
    const lowerCat = category.toLowerCase();
    if (lowerCat.includes('face') || lowerCat.includes('лицо')) return '🧴';
    if (lowerCat.includes('hair') || lowerCat.includes('волос')) return '💇';
    if (lowerCat.includes('body') || lowerCat.includes('тело')) return '🧴';
    if (lowerCat.includes('decor') || lowerCat.includes('декор')) return '💄';
    if (lowerCat.includes('makeup') || lowerCat.includes('макияж')) return '💄';
    return '📦';
}

// Build segmented insights from analyzed data
function buildSegmentedInsights(
    analyzed: AnalyzedFunnelRow[],
    skuToCategory: Map<string, string>
): SegmentedInsights {
    const TOP_N = 50;

    // Low CTR (sorted by CTR ascending, only with enough views)
    const lowCtr = analyzed
        .filter(r => r.views > 100 && r.ctr < 0.03) // CTR < 3%
        .sort((a, b) => a.ctr - b.ctr)
        .slice(0, TOP_N)
        .map(r => ({
            sku: r.sku,
            value: r.ctr * 100,
            detail: `CTR ${(r.ctr * 100).toFixed(2)}%`,
            category: skuToCategory.get(r.sku) || r.category,
        }));

    // Low CR Cart (sorted ascending)
    const lowCrCart = analyzed
        .filter(r => r.clicks > 50 && r.cr_order < 0.02) // CR < 2%
        .sort((a, b) => a.cr_order - b.cr_order)
        .slice(0, TOP_N)
        .map(r => ({
            sku: r.sku,
            value: r.cr_order * 100,
            detail: `CR корзины ${(r.cr_order * 100).toFixed(2)}%`,
            category: skuToCategory.get(r.sku) || r.category,
        }));

    // Low CR Order (sorted ascending)
    const lowCrOrder = analyzed
        .filter(r => r.clicks > 50 && r.cr_order < 0.015) // CR < 1.5%
        .sort((a, b) => a.cr_order - b.cr_order)
        .slice(0, TOP_N)
        .map(r => ({
            sku: r.sku,
            value: r.cr_order * 100,
            detail: `CR заказа ${(r.cr_order * 100).toFixed(2)}%`,
            category: skuToCategory.get(r.sku) || r.category,
        }));

    // Price Down recommendations (by revenue for priority)
    const priceDown = analyzed
        .filter(r => r.price_action === 'DOWN')
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, TOP_N)
        .map(r => ({
            sku: r.sku,
            value: r.price_step_pct * 100,
            detail: `↓ ${Math.abs(r.price_step_pct * 100).toFixed(0)}% — ${r.reason_text}`,
            category: skuToCategory.get(r.sku) || r.category,
        }));

    // Price Up recommendations
    const priceUp = analyzed
        .filter(r => r.price_action === 'UP')
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, TOP_N)
        .map(r => ({
            sku: r.sku,
            value: r.price_step_pct * 100,
            detail: `↑ +${Math.abs(r.price_step_pct * 100).toFixed(0)}% — ${r.reason_text}`,
            category: skuToCategory.get(r.sku) || r.category,
        }));

    // Low Stock (critical)
    const lowStock = analyzed
        .filter(r => r.stock < 20)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, TOP_N)
        .map(r => ({
            sku: r.sku,
            value: r.stock,
            detail: `сток ${r.stock} шт`,
            category: skuToCategory.get(r.sku) || r.category,
        }));

    // Overstock (high stock cover)
    const overstock = analyzed
        .filter(r => {
            const stockCover = r.orders > 0 ? (r.stock / r.orders) * 7 : 999;
            return stockCover > 90;
        })
        .sort((a, b) => {
            const coverA = a.orders > 0 ? (a.stock / a.orders) * 7 : 999;
            const coverB = b.orders > 0 ? (b.stock / b.orders) * 7 : 999;
            return coverB - coverA;
        })
        .slice(0, TOP_N)
        .map(r => {
            const stockCover = r.orders > 0 ? Math.round((r.stock / r.orders) * 7) : 999;
            return {
                sku: r.sku,
                value: stockCover,
                detail: `${stockCover} дней запаса`,
                category: skuToCategory.get(r.sku) || r.category,
            };
        });

    return { lowCtr, lowCrCart, lowCrOrder, priceDown, priceUp, lowStock, overstock };
}

export async function GET() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Load fresh category configs
    try {
        const configs = await getCategoryConfigs();
        setCategoryConfigCache(configs);
    } catch (e) {
        console.warn('Failed to load category configs:', e);
    }

    const supabase = getSupabaseClient();

    // Fetch SKU catalog to get category mapping
    const { data: catalogData } = await supabase
        .from('sku_catalog')
        .select('sku, category, subcategory');

    const skuToCategory = new Map<string, string>();
    const categoryNames = new Set<string>();

    (catalogData || []).forEach(row => {
        skuToCategory.set(row.sku, row.category);
        categoryNames.add(row.category);
    });

    const { data, error } = await supabase
        .from('wb_funnel')
        .select('*')
        .order('revenue', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to FunnelRow format
    const funnelRows: FunnelRow[] = (data || []).map(row => ({
        sku: row.sku || '',
        views: row.views || 0,
        clicks: row.clicks || 0,
        cart: row.cart || 0,
        orders: row.orders || 0,
        ctr: row.ctr || 0,
        cr_cart: row.cr_cart || 0,
        cr_order: row.cr_order || 0,
        avg_price: row.avg_price || 0,
        client_price: row.client_price || 0,
        competitor_price_min: row.competitor_price_min || 0,
        competitor_price_avg: row.competitor_price_avg || 0,
        revenue: row.revenue || 0,
        stock_units: row.stock_units || 0,
        drr_search: row.drr_search || 0,
        drr_media: row.drr_media || 0,
        drr_bloggers: row.drr_bloggers || 0,
        drr_other: row.drr_other || 0,
        kp_pct: row.kp_pct || 0,
    }));

    // Analyze with Price Engine
    const analyzed = analyzeFunnel(funnelRows);

    // Build segmented insights (top 50 each)
    const insights = buildSegmentedInsights(analyzed, skuToCategory);

    // Aggregate by category (from sku_catalog)
    const categoryStats: Record<string, CategoryStats> = {};

    for (const row of analyzed) {
        // Get category from sku_catalog map
        const category = (skuToCategory.get(row.sku) || row.category || 'Другое');

        if (!categoryStats[category]) {
            categoryStats[category] = {
                id: category,
                name: category,
                icon: getCategoryIcon(category),
                revenue: 0,
                orders: 0,
                avgCr: 0,
                lowStock: 0,
                needsPriceDown: 0,
                critical: [],
                warning: [],
                recommendations: [],
            };
        }

        const cat = categoryStats[category];
        cat.revenue += row.revenue;
        cat.orders += row.orders;

        // Low stock (< 20 units)
        if (row.stock < 20) {
            cat.lowStock++;
            if (row.stock < 10) {
                cat.critical.push({ sku: row.sku, reason: `сток ${row.stock}` });
            }
        }

        // Price recommendations
        if (row.price_action === 'DOWN') {
            cat.needsPriceDown++;
            cat.warning.push({ sku: row.sku, reason: `↓ цену ${Math.abs(row.price_step_pct * 100).toFixed(0)}%` });
        }

        // General recommendations
        if (row.price_action !== 'HOLD') {
            const actionText = row.price_action === 'UP'
                ? `можно ↑ +${Math.abs(row.price_step_pct * 100).toFixed(0)}%`
                : `↓ ${Math.abs(row.price_step_pct * 100).toFixed(0)}%`;
            cat.recommendations.push({ sku: row.sku, action: actionText });
        }

        // Low CR with high CTR = overpriced (critical)
        if (row.ctr * 100 > 3 && row.cr_order * 100 < 1) {
            cat.critical.push({ sku: row.sku, reason: `CR ${(row.cr_order * 100).toFixed(2)}%` });
        }
    }

    // Calculate average CR per category
    for (const cat of Object.values(categoryStats)) {
        const catRows = analyzed.filter(r => {
            const rowCategory = skuToCategory.get(r.sku) || r.category || 'Другое';
            return rowCategory === cat.id;
        });
        if (catRows.length > 0) {
            cat.avgCr = catRows.reduce((sum, r) => sum + r.cr_order, 0) / catRows.length;
        }
        // Limit arrays to top 10 for category view
        cat.critical = cat.critical.slice(0, 10);
        cat.warning = cat.warning.slice(0, 10);
        cat.recommendations = cat.recommendations.slice(0, 10);
    }

    // Sort categories by revenue
    const sortedCategories = Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue);

    // Global stats
    const totalRevenue = analyzed.reduce((sum, r) => sum + r.revenue, 0);
    const totalOrders = analyzed.reduce((sum, r) => sum + r.orders, 0);
    const totalViews = analyzed.reduce((sum, r) => sum + r.views, 0);
    const totalClicks = analyzed.reduce((sum, r) => sum + r.clicks, 0);

    return NextResponse.json({
        categories: sortedCategories,
        insights,
        totals: {
            revenue: totalRevenue,
            orders: totalOrders,
            views: totalViews,
            clicks: totalClicks,
            skuCount: analyzed.length,
        },
    });
}
