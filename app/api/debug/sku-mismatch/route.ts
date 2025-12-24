// Debug API: Compare SKUs in wb_funnel vs sku_catalog to find mismatches
import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

export async function GET() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = getSupabaseClient();

    // Get all SKUs from wb_funnel
    const { data: funnelData, error: funnelError } = await supabase
        .from('wb_funnel')
        .select('sku, revenue, orders')
        .limit(3000);

    if (funnelError) {
        return NextResponse.json({ error: funnelError.message }, { status: 500 });
    }

    // Get all SKUs from sku_catalog
    const { data: catalogData, error: catalogError } = await supabase
        .from('sku_catalog')
        .select('sku, name, category')
        .limit(3000);

    if (catalogError) {
        return NextResponse.json({ error: catalogError.message }, { status: 500 });
    }

    // Create lookup from catalog
    const catalogMap = new Map<string, { name: string; category: string }>();
    (catalogData || []).forEach(row => {
        catalogMap.set(row.sku, { name: row.name, category: row.category });
    });

    // Find SKUs in funnel that are NOT in catalog
    const unmatchedSkus: Array<{ sku: string; revenue: number; orders: number }> = [];
    const matchedByCategory: Record<string, { count: number; revenue: number; orders: number }> = {};

    (funnelData || []).forEach(row => {
        const catalogEntry = catalogMap.get(row.sku);
        if (!catalogEntry) {
            unmatchedSkus.push({
                sku: row.sku,
                revenue: row.revenue || 0,
                orders: row.orders || 0,
            });
        } else {
            const cat = catalogEntry.category || 'unknown';
            if (!matchedByCategory[cat]) {
                matchedByCategory[cat] = { count: 0, revenue: 0, orders: 0 };
            }
            matchedByCategory[cat].count++;
            matchedByCategory[cat].revenue += row.revenue || 0;
            matchedByCategory[cat].orders += row.orders || 0;
        }
    });

    // Total unmatched revenue
    const unmatchedRevenue = unmatchedSkus.reduce((sum, s) => sum + s.revenue, 0);
    const unmatchedOrders = unmatchedSkus.reduce((sum, s) => sum + s.orders, 0);

    return NextResponse.json({
        analysis: {
            total_funnel_skus: funnelData?.length || 0,
            total_catalog_skus: catalogData?.length || 0,
            matched_skus: (funnelData?.length || 0) - unmatchedSkus.length,
            unmatched_skus: unmatchedSkus.length,
            unmatched_revenue: unmatchedRevenue,
            unmatched_orders: unmatchedOrders,
        },
        matched_by_category: matchedByCategory,
        sample_unmatched: unmatchedSkus.slice(0, 20),
    });
}
