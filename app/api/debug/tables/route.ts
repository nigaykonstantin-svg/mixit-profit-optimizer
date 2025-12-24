// Debug API: List all tables in Supabase
import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

export async function GET() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = getSupabaseClient();

    // Query information_schema for tables
    const { data, error } = await supabase.rpc('list_tables');

    if (error) {
        // Fallback: try to query known tables
        const tables = [];
        const tablesToCheck = [
            'wb_funnel',
            'wb_category_config',
            'sku_catalog',
            'products',
            'items',
            'skus',
            'catalog',
            'wb_catalog',
            'wb_products',
        ];

        for (const table of tablesToCheck) {
            const { count, error: tableError } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            tables.push({
                table,
                exists: tableError === null,
                count: count,
                error: tableError?.message
            });
        }

        return NextResponse.json({ tables });
    }

    return NextResponse.json({ tables: data });
}
