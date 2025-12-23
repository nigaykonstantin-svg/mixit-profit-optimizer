// supabase/functions/wb_funnel_import/index.ts
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ============================
   HEADER NORMALIZATION
============================ */

function normalize(h: string): string {
    return h
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^\p{L}\p{N}]/gu, "");
}

/* ============================
   COLUMN MAP - EXACT from Excel
============================ */

const HEADER_MAP: Record<string, string> = {
    // SKU
    "артикул": "sku",
    "артикулwb": "sku",

    // FUNNEL
    "суммапоказы": "views",
    "суммаклики": "clicks",
    "суммавкорзину": "cart",
    "суммазаказаношт": "orders",

    // CONVERSION
    "ctr": "ctr",
    "cr0": "cr_order",
    "crвкорзину": "cr_cart",
    "crвзаказ": "cr_order",

    // PRICES
    "ценаруб": "avg_price",
    "ценапокупателя": "avg_price",

    // REVENUE
    "суммавыручкарубсндс": "revenue",

    // STOCK
    "сумматекущийостатокшт": "stock_units",

    // DRR
    "drrпоиск": "drr_search",
    "drrмедиа": "drr_media",
    "drrблогеры": "drr_bloggers",
    "drростальное": "drr_other",
};

serve(async (req: any) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        let buffer: ArrayBuffer;
        let filename: string;

        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            const { path, bucket = "imports" } = await req.json();

            if (!path) {
                return new Response(
                    JSON.stringify({ error: "path is required" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const { data, error } = await supabase.storage.from(bucket).download(path);

            if (error || !data) {
                return new Response(
                    JSON.stringify({ error: `Storage error: ${JSON.stringify(error)}` }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            buffer = await data.arrayBuffer();
            filename = path;
        } else {
            const formData = await req.formData();
            const file = formData.get("file") as File;

            if (!file) {
                return new Response(
                    JSON.stringify({ error: "file is required" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            buffer = await file.arrayBuffer();
            filename = file.name;
        }

        // Parse Excel
        const uint8Array = new Uint8Array(buffer);
        const workbook = XLSX.read(uint8Array, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

        console.log("Total rows:", raw.length);
        if (raw.length > 0) {
            console.log("Headers:", Object.keys(raw[0]));
        }

        // Map rows
        const rows = raw
            .map((row: any) => {
                const out: any = {};

                for (const col in row) {
                    const key = HEADER_MAP[normalize(col)];
                    if (!key) continue;

                    const val = row[col];

                    if (key === "sku") {
                        out[key] = String(val || "").trim();
                    } else {
                        const num = Number(
                            String(val || "")
                                .replace("%", "")
                                .replace(",", ".")
                        );
                        out[key] = isNaN(num) ? 0 : num;
                    }
                }

                return out.sku ? out : null;
            })
            .filter(Boolean);

        console.log("Mapped rows:", rows.length);
        if (rows.length > 0) {
            console.log("Sample row:", rows[0]);
        }

        // Delete old data
        await supabase.from("wb_funnel").delete().neq("sku", "");

        // Insert new data in batches
        const BATCH_SIZE = 500;
        let inserted = 0;

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const { error: insertError } = await supabase.from("wb_funnel").insert(batch);
            if (insertError) {
                console.error("Insert error:", insertError);
            } else {
                inserted += batch.length;
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                totalRows: raw.length,
                mappedRows: rows.length,
                insertedRows: inserted,
                sampleRow: rows[0] || null,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (e: any) {
        console.error("Error:", e);
        return new Response(
            JSON.stringify({ error: e.message || String(e) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
