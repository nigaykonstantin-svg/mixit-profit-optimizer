// API endpoint for role-based AI insights
import { NextRequest, NextResponse } from 'next/server';
import { generateInsightsForRole, isAnthropicConfigured, CategoryData, InsightRole, INSIGHT_ROLES } from '@/modules/ai/claude-client';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const role = (searchParams.get('role') || 'leader') as InsightRole;
    const category = searchParams.get('category') || undefined;

    if (!isAnthropicConfigured()) {
        return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    // Validate role
    const validRoles = INSIGHT_ROLES.map(r => r.id);
    if (!validRoles.includes(role)) {
        return NextResponse.json({
            error: 'Invalid role',
            validRoles: INSIGHT_ROLES
        }, { status: 400 });
    }

    try {
        // Fetch dashboard data to analyze
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const dashboardRes = await fetch(`${baseUrl}/api/dashboard`, {
            headers: { 'Cache-Control': 'no-cache' }
        });
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

        const insights = await generateInsightsForRole(
            { categories, totals: dashboardData.totals },
            role,
            category
        );

        const roleInfo = INSIGHT_ROLES.find(r => r.id === role);

        return NextResponse.json({
            insights,
            role: roleInfo,
            category: category || null,
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

// Return available roles
export async function OPTIONS() {
    return NextResponse.json({ roles: INSIGHT_ROLES });
}
