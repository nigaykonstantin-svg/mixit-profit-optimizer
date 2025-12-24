// Debug API: Check wb_funnel columns and sample data
import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

export async function GET() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = getSupabaseClient();

    // Get one row from wb_funnel to see all columns
    const { data: funnelRow, error: funnelError } = await supabase
        .from('wb_funnel')
        .select('*')
        .limit(1)
        .single();

    return NextResponse.json({
        funnel_columns: funnelRow ? Object.keys(funnelRow) : [],
        funnel_sample: funnelRow,
        error: funnelError?.message,
    });
}
