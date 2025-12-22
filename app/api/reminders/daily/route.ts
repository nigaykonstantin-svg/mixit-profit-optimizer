import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/services/supabase/client";

export async function GET() {
    try {
        const supabase = getSupabaseAdmin();
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get overdue tasks and tasks due today/tomorrow
        const { data: tasks, error } = await supabase
            .from("tasks")
            .select("*")
            .in("status", ["open", "in_progress"])
            .lte("deadline", tomorrow.toISOString())
            .order("deadline", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        const overdue = tasks?.filter(t => t.deadline && new Date(t.deadline) < now) || [];
        const dueToday = tasks?.filter(t => {
            if (!t.deadline) return false;
            const d = new Date(t.deadline);
            return d >= now && d.toDateString() === now.toDateString();
        }) || [];
        const dueTomorrow = tasks?.filter(t => {
            if (!t.deadline) return false;
            const d = new Date(t.deadline);
            return d.toDateString() === tomorrow.toDateString();
        }) || [];

        return NextResponse.json({
            success: true,
            overdue,
            dueToday,
            dueTomorrow,
            total: tasks?.length || 0
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
