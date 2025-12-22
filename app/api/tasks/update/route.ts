import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/services/supabase/client";

export async function PATCH(req: Request) {
    try {
        const supabase = getSupabaseAdmin();
        const body = await req.json();
        const { id, ...updates } = body;

        const { data, error } = await supabase
            .from("tasks")
            .update(updates)
            .eq("id", id)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
