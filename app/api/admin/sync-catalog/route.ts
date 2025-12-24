// API to sync missing SKUs from wb_funnel to sku_catalog
import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

export async function POST() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = getSupabaseClient();

    // Get all SKUs from wb_funnel
    const { data: funnelData, error: funnelError } = await supabase
        .from('wb_funnel')
        .select('sku')
        .limit(2000);

    if (funnelError) {
        return NextResponse.json({ error: funnelError.message }, { status: 500 });
    }

    // Get all SKUs from sku_catalog
    const { data: catalogData, error: catalogError } = await supabase
        .from('sku_catalog')
        .select('sku')
        .limit(2000);

    if (catalogError) {
        return NextResponse.json({ error: catalogError.message }, { status: 500 });
    }

    // Find missing SKUs
    const catalogSet = new Set((catalogData || []).map(r => r.sku));
    const missingSKUs = (funnelData || [])
        .map(r => r.sku)
        .filter(sku => !catalogSet.has(sku));

    if (missingSKUs.length === 0) {
        return NextResponse.json({
            message: 'All SKUs already in catalog',
            synced: 0
        });
    }

    // Insert missing SKUs with "Неизвестная категория" 
    const newRecords = missingSKUs.map(sku => ({
        sku,
        name: `Товар ${sku}`,
        category: 'Неизвестная категория',
    }));

    // Insert missing SKUs - use insert with ignoreDuplicates
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Insert in batches of 100
    for (let i = 0; i < newRecords.length; i += 100) {
        const batch = newRecords.slice(i, i + 100);
        const { error: insertError } = await supabase
            .from('sku_catalog')
            .insert(batch);

        if (insertError) {
            errorCount += batch.length;
            errors.push(insertError.message);
        } else {
            successCount += batch.length;
        }
    }

    if (successCount === 0 && errorCount > 0) {
        return NextResponse.json({
            error: 'Failed to insert',
            details: errors.slice(0, 5),
        }, { status: 500 });
    }

    return NextResponse.json({
        message: `Synced ${missingSKUs.length} SKUs`,
        synced: missingSKUs.length,
        sample: missingSKUs.slice(0, 10),
    });
}

export async function GET() {
    return NextResponse.json({
        info: 'POST to this endpoint to sync missing SKUs from wb_funnel to sku_catalog',
        warning: 'Will add SKUs with "Неизвестная категория" - you need to update categories manually',
    });
}
