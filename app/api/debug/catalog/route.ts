// Debug API: Check sku_catalog data
import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

export async function GET() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = getSupabaseClient();

    // Get sample of sku_catalog - try without column filtering first
    const { data: catalogRaw, error: catalogRawError } = await supabase
        .from('sku_catalog')
        .select('*')
        .limit(5);

    // Get sample of wb_funnel
    const { data: funnel, error: funnelError } = await supabase
        .from('wb_funnel')
        .select('sku')
        .limit(10);

    // Get a sample SKU from funnel and search for it
    const sampleSku = funnel?.[0]?.sku;
    let catalogMatch = null;
    if (sampleSku) {
        const { data } = await supabase
            .from('sku_catalog')
            .select('*')
            .eq('sku', sampleSku)
            .single();
        catalogMatch = data;
    }

    // Try to get columns from sku_catalog
    const { data: oneRow } = await supabase
        .from('sku_catalog')
        .select('*')
        .limit(1)
        .single();

    return NextResponse.json({
        catalog_sample: catalogRaw,
        catalog_error: catalogRawError?.message,
        catalog_columns: oneRow ? Object.keys(oneRow) : [],
        sample_sku: sampleSku,
        catalog_match_for_sample: catalogMatch,
        funnel_sample: funnel?.slice(0, 5),
        funnel_error: funnelError?.message,
    });
}

