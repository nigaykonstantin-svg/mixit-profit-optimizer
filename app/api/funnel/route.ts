import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

export async function GET() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Supabase not configured', rows: [] }, { status: 500 });
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('wb_funnel')
        .select('*')
        .order('revenue', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rows: data });
}
