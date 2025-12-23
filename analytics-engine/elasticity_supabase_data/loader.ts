// ================================
// DATA LOADER - fact2026 from Supabase
// ================================

import { getSupabaseClient } from '../supabase/supabase-client';

export async function loadFact2026() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('fact2026')
        .select('*');

    if (error) throw error;
    return data;
}
