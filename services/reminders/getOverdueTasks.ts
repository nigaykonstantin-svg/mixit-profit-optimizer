import { getSupabaseAdmin } from "../supabase/client";

export async function getOverdueTasks() {
    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
        .from("tasks")
        .select("*")
        .in("status", ["open", "in_progress"])
        .lt("deadline", now)
        .order("deadline", { ascending: true });

    if (error) throw error;
    return data || [];
}
