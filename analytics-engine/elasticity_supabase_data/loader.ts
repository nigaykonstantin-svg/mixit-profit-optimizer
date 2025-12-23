// ================================
// DATA LOADER - fact2026 from Supabase
// ================================

import { supabase } from '../supabase/supabase-client';

export async function loadFact2026() {
    const { data, error } = await supabase
        .from('fact2026')
        .select('*');

    if (error) throw error;
    return data;
}
