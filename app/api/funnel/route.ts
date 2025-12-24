import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';
import { analyzeFunnelWithCatalog } from '@/modules/analytics/funnel-metrics';
import { FunnelRow } from '@/modules/import/funnel-parser';
import { setCategoryConfigCache } from '@/modules/pricing/price-config';
import { getCategoryConfigs } from '@/modules/config';

export async function GET() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Supabase not configured', rows: [] }, { status: 500 });
    }

    // Load fresh category configs and set cache (for Price Engine)
    try {
        const configs = await getCategoryConfigs();
        setCategoryConfigCache(configs);
    } catch (e) {
        console.warn('Failed to load category configs:', e);
    }

    const supabase = getSupabaseClient();

    // Load SKU catalog for category mapping
    const { data: catalogData } = await supabase
        .from('sku_catalog')
        .select('sku, category, subcategory');

    const skuCatalog = new Map<string, { category: string; subcategory?: string }>();
    (catalogData || []).forEach(row => {
        skuCatalog.set(row.sku, { category: row.category, subcategory: row.subcategory });
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

    // Apply analyzeFunnel with SKU catalog for category lookups
    const analyzed = analyzeFunnelWithCatalog(funnelRows, skuCatalog);

    return NextResponse.json({ rows: analyzed });
}
