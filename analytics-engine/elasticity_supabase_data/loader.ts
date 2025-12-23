// ================================
// DATA LOADER - Supabase fact2026
// ================================

import { createClient } from '@supabase/supabase-js';
import { ELASTICITY_CONFIG } from './config';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Raw row from fact2026 table
 */
export interface Fact2026Row {
    date: string;
    sku: string;
    views: number;
    clicks: number;
    orders: number;
    revenue: number;
    price: number;
    stock_units: number;
    drr_search?: number;
    drr_media?: number;
    drr_bloggers?: number;
}

/**
 * Load data from fact2026 for date range
 */
export async function loadFact2026(
    startDate: string,
    endDate: string,
    skuFilter?: string[]
): Promise<Fact2026Row[]> {
    let query = supabase
        .from('fact2026')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

    if (skuFilter && skuFilter.length > 0) {
        query = query.in('sku', skuFilter);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Supabase load error:', error);
        throw new Error(`Failed to load fact2026: ${error.message}`);
    }

    // Filter out excluded dates
    const excludedSet = new Set(ELASTICITY_CONFIG.excludeDates);
    return (data || []).filter(row => !excludedSet.has(row.date));
}

/**
 * Load data for last N days
 */
export async function loadLastNDays(
    days: number,
    skuFilter?: string[]
): Promise<Fact2026Row[]> {
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);

    return loadFact2026(startDate, endDate, skuFilter);
}

/**
 * Get unique SKUs from loaded data
 */
export function getUniqueSkus(data: Fact2026Row[]): string[] {
    return [...new Set(data.map(row => row.sku))];
}
