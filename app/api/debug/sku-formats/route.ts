// Debug: Compare SKU formats between tables
import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

export async function GET() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = getSupabaseClient();

    // Sample from wb_funnel
    const { data: funnelSample } = await supabase
        .from('wb_funnel')
        .select('sku')
        .order('revenue', { ascending: false })
        .limit(20);

    // Sample from sku_catalog
    const { data: catalogSample } = await supabase
        .from('sku_catalog')
        .select('sku, category')
        .limit(20);

    // Analyze formats
    const funnelFormats = (funnelSample || []).map(r => ({
        sku: r.sku,
        length: r.sku.length,
        prefix: r.sku.substring(0, 4),
    }));

    const catalogFormats = (catalogSample || []).map(r => ({
        sku: r.sku,
        length: r.sku.length,
        prefix: r.sku.substring(0, 4),
        category: r.category,
    }));

    return NextResponse.json({
        funnel_samples: funnelFormats,
        catalog_samples: catalogFormats,
    });
}
