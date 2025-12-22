import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/services/supabase/client";

export async function POST(req: Request) {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { task_id, user_name, text } = body;

        const { data, error } = await supabase
            .from("task_comments")
            .insert([{ task_id, user_name, text }])
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
