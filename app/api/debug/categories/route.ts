// Debug API: Check distinct categories in sku_catalog
import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

export async function GET() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = getSupabaseClient();

    // Get distinct categories from sku_catalog
    const { data: catalogCategories, error: catalogError } = await supabase
        .from('sku_catalog')
        .select('category')
        .limit(3000);

    // Count by category
    const catCounts: Record<string, number> = {};
    (catalogCategories || []).forEach(row => {
        const cat = row.category || 'null';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    // Get config categories
    const { data: configCategories } = await supabase
        .from('wb_category_config')
        .select('category, min_margin_pct, price_step_pct');

    return NextResponse.json({
        sku_catalog_categories: catCounts,
        config_categories: configCategories,
        total_skus: catalogCategories?.length || 0,
    });
}
