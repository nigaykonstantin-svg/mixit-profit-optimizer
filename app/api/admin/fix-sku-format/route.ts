// Fix SKU format mismatch: SKUA000... vs SKU000...
import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

// Normalize SKU: remove 'A' from SKUA... format to match SKU...
function normalizeSku(sku: string): string {
    // SKUA000123456 -> SKU0000123456
    if (sku.startsWith('SKUA')) {
        return 'SKU0' + sku.slice(4);
    }
    return sku;
}

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
        .select('sku, category')
        .limit(2000);

    if (catalogError) {
        return NextResponse.json({ error: catalogError.message }, { status: 500 });
    }

    // Build normalized catalog map
    const catalogMap = new Map<string, { sku: string; category: string }>();
    (catalogData || []).forEach(row => {
        // Store both original and normalized versions
        catalogMap.set(row.sku, { sku: row.sku, category: row.category });
        const normalized = normalizeSku(row.sku);
        if (normalized !== row.sku) {
            catalogMap.set(normalized, { sku: row.sku, category: row.category });
        }
    });

    // Find matches using normalized SKUs
    const updates: Array<{ funnel_sku: string; catalog_sku: string; category: string }> = [];
    const stillUnmatched: string[] = [];

    (funnelData || []).forEach(row => {
        const funnelSku = row.sku;

        // Try direct match first
        if (catalogMap.has(funnelSku)) {
            return; // Already matched
        }

        // Try normalized match
        const normalizedFunnel = normalizeSku(funnelSku);
        if (catalogMap.has(normalizedFunnel)) {
            const match = catalogMap.get(normalizedFunnel)!;
            updates.push({
                funnel_sku: funnelSku,
                catalog_sku: match.sku,
                category: match.category,
            });
            return;
        }

        stillUnmatched.push(funnelSku);
    });

    // Insert SKUA... versions into catalog with correct categories
    if (updates.length > 0) {
        const newRecords = updates.map(u => ({
            sku: u.funnel_sku,
            name: `Товар ${u.funnel_sku}`,
            category: u.category,
        }));

        const { error: insertError } = await supabase
            .from('sku_catalog')
            .upsert(newRecords, { onConflict: 'sku' });

        if (insertError) {
            return NextResponse.json({
                error: 'Failed to insert',
                details: insertError.message
            }, { status: 500 });
        }
    }

    return NextResponse.json({
        message: `Fixed ${updates.length} SKU format mismatches`,
        fixed: updates.length,
        still_unmatched: stillUnmatched.length,
        sample_fixed: updates.slice(0, 10),
        sample_unmatched: stillUnmatched.slice(0, 10),
    });
}

export async function GET() {
    return NextResponse.json({
        info: 'POST to fix SKU format mismatch (SKUA... vs SKU...)',
        description: 'Will add SKUA versions to catalog with correct categories from matching SKU versions',
    });
}
