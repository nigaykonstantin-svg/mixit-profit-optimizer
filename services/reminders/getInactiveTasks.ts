import { getSupabaseAdmin } from "../supabase/client";

export async function getInactiveTasks(days: number = 3) {
    const supabaseAdmin = getSupabaseAdmin();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data, error } = await supabaseAdmin
        .from("tasks")
        .select("*")
        .in("status", ["open", "in_progress"])
        .lt("updated_at", cutoff.toISOString())
        .order("updated_at", { ascending: true });

    if (error) throw error;
    return data || [];
}
