// Supabase Client - Database connection management

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client singleton
 */
let supabaseClient: SupabaseClient | null = null;

/**
 * Get Supabase client instance
 * Uses environment variables for configuration
 */
export function getSupabaseClient(): SupabaseClient {
    if (supabaseClient) {
        return supabaseClient;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error(
            'Missing Supabase environment variables. ' +
            'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
        );
    }

    supabaseClient = createClient(url, anonKey);
    return supabaseClient;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
    return !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
}
