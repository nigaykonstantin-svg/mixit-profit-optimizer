// API: Migrate category names from English to Russian in Supabase
import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';
import { CATEGORY_MAP, CATEGORY_DISPLAY_NAMES } from '@/modules/config/config-service';

export async function POST() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = getSupabaseClient();
    const migrations: { from: string; to: string; success: boolean; error?: string }[] = [];

    // Define migrations from English → Russian
    const ENGLISH_TO_RUSSIAN: Record<string, string> = {
        'FACE': 'Уход за лицом',
        'HAIR': 'Уход за волосами',
        'BODY': 'Уход за телом',
        'MAKEUP': 'Макияж',
    };

    for (const [englishName, russianName] of Object.entries(ENGLISH_TO_RUSSIAN)) {
        try {
            // Check if English version exists
            const { data: existing } = await supabase
                .from('wb_category_config')
                .select('category')
                .eq('category', englishName)
                .single();

            if (existing) {
                // Update to Russian name
                const { error } = await supabase
                    .from('wb_category_config')
                    .update({ category: russianName, updated_at: new Date().toISOString() })
                    .eq('category', englishName);

                if (error) {
                    migrations.push({ from: englishName, to: russianName, success: false, error: error.message });
                } else {
                    migrations.push({ from: englishName, to: russianName, success: true });
                }
            } else {
                // Check if Russian version already exists
                const { data: russianExists } = await supabase
                    .from('wb_category_config')
                    .select('category')
                    .eq('category', russianName)
                    .single();

                if (russianExists) {
                    migrations.push({ from: englishName, to: russianName, success: true, error: 'Already migrated (Russian exists)' });
                } else {
                    migrations.push({ from: englishName, to: russianName, success: false, error: 'Source (English) not found' });
                }
            }
        } catch (err) {
            migrations.push({ from: englishName, to: russianName, success: false, error: String(err) });
        }
    }

    // Verify final state
    const { data: finalConfigs } = await supabase
        .from('wb_category_config')
        .select('category, min_margin_pct, price_step_pct, stock_critical_days, stock_overstock_days')
        .order('category');

    return NextResponse.json({
        migrations,
        currentConfigs: finalConfigs,
        expectedCategories: CATEGORY_DISPLAY_NAMES,
    });
}

export async function GET() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = getSupabaseClient();

    // Get current config categories
    const { data: configs, error } = await supabase
        .from('wb_category_config')
        .select('*')
        .order('category');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get SKU catalog category distribution
    const { data: skuCategories } = await supabase
        .from('sku_catalog')
        .select('category')
        .limit(5000);

    const categoryDistribution: Record<string, number> = {};
    (skuCategories || []).forEach(row => {
        const cat = row.category || 'NULL';
        categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    });

    return NextResponse.json({
        configs,
        skuCategoryDistribution: categoryDistribution,
        totalSkus: skuCategories?.length || 0,
        expectedCategories: CATEGORY_DISPLAY_NAMES,
        categoryMapping: CATEGORY_MAP,
    });
}
