import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

export async function GET() {
    try {
        if (!isSupabaseConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Supabase not configured',
                rows: [],
            });
        }

        const supabase = getSupabaseClient();

        // Fetch FACT2026 data
        const { data, error } = await supabase
            .from('fact2026')
            .select('*')
            .order('revenue', { ascending: false });

        if (error) {
            return NextResponse.json({
                success: false,
                error: error.message,
                rows: [],
            });
        }

        // Transform to analyzed format
        const analyzed = (data || []).map(row => {
            const views = row.views || 0;
            const clicks = row.clicks || 0;
            const orders = row.orders || 0;
            const revenue = row.revenue || 0;
            const stock = row.stock || 0;
            const total_drr = (row.drr_search || 0) + (row.drr_media || 0) + (row.drr_bloggers || 0) + (row.drr_other || 0);
            const ctr = row.ctr || (views > 0 ? (clicks / views) * 100 : 0);
            const cr_order = row.cr_order || (views > 0 ? (orders / views) * 100 : 0);

            // Determine conversion quality
            let conversion_quality: 'Normal' | 'Overpriced' | 'Low stock' = 'Normal';
            if (ctr > 2 && cr_order < 1.5) {
                conversion_quality = 'Overpriced';
            } else if (stock < 10) {
                conversion_quality = 'Low stock';
            }

            return {
                sku: row.sku,
                revenue,
                views,
                orders,
                ctr,
                cr_order,
                revenue_per_view: views > 0 ? revenue / views : 0,
                cpc: clicks > 0 ? revenue / clicks : 0,
                conversion_quality,
                stock,
                price: row.price || 0,
                total_drr,
            };
        });

        return NextResponse.json({
            success: true,
            rows: analyzed,
            total: analyzed.length,
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: String(error),
            rows: [],
        });
    }
}
