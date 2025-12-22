import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/services/supabase/client";

export async function GET(req: Request) {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(req.url);
        const task_id = searchParams.get("task_id");

        if (!task_id) {
            return NextResponse.json({ error: "task_id is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("task_comments")
            .select("*")
            .eq("task_id", task_id)
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
