// API endpoint for AI-powered insights
import { NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';
import { generateCategoryInsights, isAnthropicConfigured, CategoryData } from '@/modules/ai/claude-client';

export async function GET() {
    if (!isAnthropicConfigured()) {
        return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    try {
        // Fetch dashboard data to analyze
        const dashboardRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard`);
        const dashboardData = await dashboardRes.json();

        if (!dashboardData.categories || dashboardData.categories.length === 0) {
            return NextResponse.json({ error: 'No data to analyze' }, { status: 400 });
        }

        // Transform to CategoryData format
        const categories: CategoryData[] = dashboardData.categories.map((cat: {
            name: string;
            revenue: number;
            orders: number;
            avgCr: number;
            lowStock: number;
            needsPriceDown: number;
            critical: unknown[];
            warning: unknown[];
            recommendations: unknown[];
        }) => ({
            name: cat.name,
            revenue: cat.revenue,
            orders: cat.orders,
            avgCr: cat.avgCr,
            lowStock: cat.lowStock,
            needsPriceDown: cat.needsPriceDown,
            criticalCount: cat.critical?.length || 0,
            warningCount: cat.warning?.length || 0,
            recommendationsCount: cat.recommendations?.length || 0,
        }));

        const insights = await generateCategoryInsights({
            categories,
            totals: dashboardData.totals,
        });

        return NextResponse.json({
            insights,
            generatedAt: new Date().toISOString(),
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Failed to generate insights:', error);
        return NextResponse.json({
            error: 'Failed to generate insights',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
