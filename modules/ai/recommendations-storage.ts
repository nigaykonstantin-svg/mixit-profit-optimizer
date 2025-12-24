// Service for storing and analyzing Price Engine recommendations
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

export interface RecommendationRecord {
    id: string;
    created_at: string;
    sku: string;
    category: string | null;
    recommended_action: string;
    reason_code: string | null;
    reason_text: string | null;
    current_price: number | null;
    current_revenue: number | null;
    current_ctr: number | null;
    current_cr: number | null;
    current_stock: number | null;
    was_applied: boolean;
    applied_at: string | null;
    result_revenue_delta: number | null;
    result_cr_delta: number | null;
    result_notes: string | null;
}

export async function saveRecommendation(rec: {
    sku: string;
    category?: string;
    recommendedAction: string;
    reasonCode?: string;
    reasonText?: string;
    currentPrice?: number;
    currentRevenue?: number;
    currentCtr?: number;
    currentCr?: number;
    currentStock?: number;
}): Promise<RecommendationRecord | null> {
    if (!isSupabaseConfigured()) {
        return null;
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('price_recommendations')
        .insert({
            sku: rec.sku,
            category: rec.category || null,
            recommended_action: rec.recommendedAction,
            reason_code: rec.reasonCode || null,
            reason_text: rec.reasonText || null,
            current_price: rec.currentPrice || null,
            current_revenue: rec.currentRevenue || null,
            current_ctr: rec.currentCtr || null,
            current_cr: rec.currentCr || null,
            current_stock: rec.currentStock || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to save recommendation:', error);
        return null;
    }

    return data as RecommendationRecord;
}

export async function saveBatchRecommendations(recommendations: Array<{
    sku: string;
    category?: string;
    recommendedAction: string;
    reasonCode?: string;
    reasonText?: string;
    currentRevenue?: number;
    currentCtr?: number;
    currentCr?: number;
    currentStock?: number;
}>): Promise<number> {
    if (!isSupabaseConfigured() || recommendations.length === 0) {
        return 0;
    }

    const supabase = getSupabaseClient();

    const records = recommendations.map(rec => ({
        sku: rec.sku,
        category: rec.category || null,
        recommended_action: rec.recommendedAction,
        reason_code: rec.reasonCode || null,
        reason_text: rec.reasonText || null,
        current_revenue: rec.currentRevenue || null,
        current_ctr: rec.currentCtr || null,
        current_cr: rec.currentCr || null,
        current_stock: rec.currentStock || null,
    }));

    const { error, count } = await supabase
        .from('price_recommendations')
        .insert(records);

    if (error) {
        console.error('Failed to save batch recommendations:', error);
        return 0;
    }

    return count || recommendations.length;
}

export async function markRecommendationApplied(
    sku: string,
    notes?: string
): Promise<boolean> {
    if (!isSupabaseConfigured()) {
        return false;
    }

    const supabase = getSupabaseClient();

    // Get the latest recommendation for this SKU
    const { data: latest } = await supabase
        .from('price_recommendations')
        .select('id')
        .eq('sku', sku)
        .eq('was_applied', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (!latest) {
        return false;
    }

    const { error } = await supabase
        .from('price_recommendations')
        .update({
            was_applied: true,
            applied_at: new Date().toISOString(),
            result_notes: notes || null,
        })
        .eq('id', latest.id);

    return !error;
}

export async function recordRecommendationResult(
    sku: string,
    revenueDelta: number,
    crDelta: number,
    notes?: string
): Promise<boolean> {
    if (!isSupabaseConfigured()) {
        return false;
    }

    const supabase = getSupabaseClient();

    // Find the most recent applied recommendation for this SKU
    const { data: rec } = await supabase
        .from('price_recommendations')
        .select('id')
        .eq('sku', sku)
        .eq('was_applied', true)
        .is('result_revenue_delta', null)
        .order('applied_at', { ascending: false })
        .limit(1)
        .single();

    if (!rec) {
        return false;
    }

    const { error } = await supabase
        .from('price_recommendations')
        .update({
            result_revenue_delta: revenueDelta,
            result_cr_delta: crDelta,
            result_notes: notes || null,
        })
        .eq('id', rec.id);

    return !error;
}

export async function getRecommendationEffectiveness(): Promise<{
    byAction: Array<{
        action: string;
        total: number;
        applied: number;
        avgCrDelta: number | null;
        avgRevenueDelta: number | null;
    }>;
    recentApplied: RecommendationRecord[];
}> {
    if (!isSupabaseConfigured()) {
        return { byAction: [], recentApplied: [] };
    }

    const supabase = getSupabaseClient();

    // Get effectiveness by action type
    const { data: effectiveness } = await supabase
        .from('recommendation_effectiveness')
        .select('*');

    // Get recent applied recommendations
    const { data: recent } = await supabase
        .from('price_recommendations')
        .select('*')
        .eq('was_applied', true)
        .order('applied_at', { ascending: false })
        .limit(10);

    return {
        byAction: (effectiveness || []).map((e: {
            recommended_action: string;
            total_count: number;
            applied_count: number;
            avg_cr_delta: number | null;
            avg_revenue_delta: number | null;
        }) => ({
            action: e.recommended_action,
            total: e.total_count,
            applied: e.applied_count,
            avgCrDelta: e.avg_cr_delta,
            avgRevenueDelta: e.avg_revenue_delta,
        })),
        recentApplied: recent as RecommendationRecord[] || [],
    };
}

export async function getPendingRecommendations(limit: number = 50): Promise<RecommendationRecord[]> {
    if (!isSupabaseConfigured()) {
        return [];
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('price_recommendations')
        .select('*')
        .eq('was_applied', false)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Failed to get pending recommendations:', error);
        return [];
    }

    return data as RecommendationRecord[];
}
