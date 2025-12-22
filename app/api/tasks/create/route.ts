import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/services/supabase/client";

export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();
    const body = await req.json();

    const {
        created_by,
        assigned_to,
        assigned_cc,
        sku_list,
        description,
        priority,
        deadline
    } = body;

    const { data, error } = await supabase
        .from("tasks")
        .insert([
            {
                created_by,
                assigned_to,
                assigned_cc,
                sku_list,
                description,
                priority,
                deadline
            }
        ]);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
}
