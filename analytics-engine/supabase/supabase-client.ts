// Supabase Client - Database connection management

/**
 * Supabase client configuration
 * 
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL: URL проекта Supabase
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Анонимный ключ для публичного доступа
 * - SUPABASE_SERVICE_ROLE_KEY: Сервисный ключ для серверных операций (опционально)
 */

export interface SupabaseConfig {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
}

/**
 * Get Supabase configuration from environment
 */
export function getSupabaseConfig(): SupabaseConfig {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
        throw new Error(
            'Missing Supabase environment variables. ' +
            'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
        );
    }

    return {
        url,
        anonKey,
        serviceRoleKey,
    };
}

/**
 * Get Supabase client instance
 * 
 * TODO: Implementation steps:
 * 1. npm install @supabase/supabase-js
 * 2. import { createClient } from '@supabase/supabase-js'
 * 3. return createClient(config.url, config.anonKey)
 * 
 * For server-side operations with elevated privileges:
 * - Use serviceRoleKey instead of anonKey
 * - Never expose serviceRoleKey to client-side code
 * 
 * @returns Supabase client instance (stub for now)
 */
export function getSupabaseClient(): unknown {
    // TODO: Implement actual Supabase client creation
    // const config = getSupabaseConfig();
    // return createClient(config.url, config.anonKey);

    console.warn('Supabase client not implemented yet');
    return null;
}

/**
 * Get Supabase admin client (server-side only)
 * 
 * @returns Supabase admin client instance (stub for now)
 */
export function getSupabaseAdminClient(): unknown {
    // TODO: Implement admin client with service role key
    // const config = getSupabaseConfig();
    // return createClient(config.url, config.serviceRoleKey!);

    console.warn('Supabase admin client not implemented yet');
    return null;
}
