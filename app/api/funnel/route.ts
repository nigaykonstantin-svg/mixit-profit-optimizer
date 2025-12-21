import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';
import { analyzeFunnel } from '@/modules/analytics/funnel-metrics';
import { FunnelRow } from '@/modules/import/funnel-parser';

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

        // Fetch from wb_funnel table
        const { data, error } = await supabase
            .from('wb_funnel')
            .select('*')
            .order('revenue', { ascending: false });

        if (error) {
            return NextResponse.json({
                success: false,
                error: error.message,
                rows: [],
            });
        }

        // Transform to FunnelRow format and analyze
        const funnelRows: FunnelRow[] = (data || []).map(row => ({
            sku: row.sku || '',
            name: row.name || '',
            brand: row.brand || '',
            views: row.views || 0,
            clicks: row.clicks || 0,
            cart: row.cart || 0,
            orders: row.orders || 0,
            ctr: row.ctr || 0,
            cr_cart: row.cr_cart || 0,
            cr_order: row.cr_order || 0,
            avg_price: row.avg_price || 0,
            revenue: row.revenue || 0,
            stock_units: row.stock_units || 0,
            drr_search: row.drr_search || 0,
            drr_media: row.drr_media || 0,
            drr_bloggers: row.drr_bloggers || 0,
            drr_other: row.drr_other || 0,
        }));

        // Apply analyzeFunnel to add computed fields
        const analyzed = analyzeFunnel(funnelRows);

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
