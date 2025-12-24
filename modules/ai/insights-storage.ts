// Service for storing and retrieving AI insights from Supabase
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';
import { InsightRole, CategoryData } from './claude-client';

export interface InsightRecord {
    id: string;
    created_at: string;
    role: InsightRole;
    category_filter: string | null;
    insights_text: string;
    data_snapshot: CategoryData[];
    totals_snapshot: {
        revenue: number;
        orders: number;
        skuCount: number;
    };
}

export async function saveInsight(
    role: InsightRole,
    insightsText: string,
    categories: CategoryData[],
    totals: { revenue: number; orders: number; skuCount: number },
    categoryFilter?: string
): Promise<InsightRecord | null> {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, skipping insight save');
        return null;
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('ai_insights')
        .insert({
            role,
            category_filter: categoryFilter || null,
            insights_text: insightsText,
            data_snapshot: categories,
            totals_snapshot: totals,
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to save insight:', error);
        return null;
    }

    return data as InsightRecord;
}

export async function getRecentInsights(
    role?: InsightRole,
    limit: number = 10
): Promise<InsightRecord[]> {
    if (!isSupabaseConfigured()) {
        return [];
    }

    const supabase = getSupabaseClient();

    let query = supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (role) {
        query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Failed to fetch insights:', error);
        return [];
    }

    return data as InsightRecord[];
}

export async function getInsightsForAnalysis(daysBack: number = 7): Promise<{
    byRole: Record<string, number>;
    totalCount: number;
    recentInsights: InsightRecord[];
}> {
    if (!isSupabaseConfigured()) {
        return { byRole: {}, totalCount: 0, recentInsights: [] };
    }

    const supabase = getSupabaseClient();
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });

    if (error || !data) {
        return { byRole: {}, totalCount: 0, recentInsights: [] };
    }

    const byRole: Record<string, number> = {};
    data.forEach((insight: InsightRecord) => {
        byRole[insight.role] = (byRole[insight.role] || 0) + 1;
    });

    return {
        byRole,
        totalCount: data.length,
        recentInsights: data.slice(0, 5) as InsightRecord[],
    };
}
