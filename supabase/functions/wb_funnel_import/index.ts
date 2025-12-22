// supabase/functions/wb_funnel_import/index.ts
// Supports: FormData file upload OR JSON { "path": "bucket/file.xlsx" }

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import Papa from "https://esm.sh/papaparse@5.4.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // CORS preflight
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
            // --- JSON Mode: Read from Supabase Storage ---
            const { path, bucket = "imports" } = await req.json();

            if (!path) {
                return new Response(
                    JSON.stringify({ error: "path is required" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            console.log(`Downloading from storage: ${bucket}/${path}`);

            const { data, error } = await supabase.storage.from(bucket).download(path);

            if (error || !data) {
                return new Response(
                    JSON.stringify({ error: `Storage error: ${error?.message || "File not found"}` }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            buffer = await data.arrayBuffer();
            filename = path.toLowerCase();

        } else if (contentType.includes("multipart/form-data")) {
            // --- FormData Mode: Direct file upload ---
            const form = await req.formData();
            const file = form.get("file") as File;

            if (!file) {
                return new Response(
                    JSON.stringify({ error: "file missing" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            buffer = await file.arrayBuffer();
            filename = file.name.toLowerCase();

        } else {
            return new Response(
                JSON.stringify({ error: "Unsupported content type. Use multipart/form-data or application/json" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // --- Parse file ---
        let jsonRows: any[] = [];
        let sheetNames: string[] = [];

        if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
            const uint8Array = new Uint8Array(buffer);
            const workbook = XLSX.read(uint8Array, { type: "array" });

            sheetNames = workbook.SheetNames;
            console.log("Available sheets:", sheetNames);

            // WB Funnel export: 4th sheet (index 3) contains "Товары"
            const sheetIndex = Math.min(3, sheetNames.length - 1);
            const sheetName = sheetNames[sheetIndex];

            console.log(`Using sheet [${sheetIndex}]: ${sheetName}`);
            const sheet = workbook.Sheets[sheetName];

            // Parse with range option to skip potential header rows
            // First get all rows without headers
            const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // Find the row with actual headers (contains "Артикул")
            let headerRowIndex = 0;
            for (let i = 0; i < Math.min(10, allRows.length); i++) {
                const row = allRows[i] as any[];
                if (row && row.some((cell: any) => String(cell).includes("Артикул"))) {
                    headerRowIndex = i;
                    break;
                }
            }

            console.log("Header row index:", headerRowIndex);

            // Re-parse with correct range
            jsonRows = XLSX.utils.sheet_to_json(sheet, {
                defval: null,
                range: headerRowIndex
            });

            console.log("Sheet count:", sheetNames.length);
            console.log("All headers:", jsonRows[0] ? Object.keys(jsonRows[0]) : "empty");

        } else if (filename.endsWith(".csv")) {
            const decoder = new TextDecoder("utf-8");
            const text = decoder.decode(buffer);
            const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
            jsonRows = parsed.data;

        } else {
            return new Response(
                JSON.stringify({ error: "Unsupported file type. Use .xlsx or .csv" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Parsed ${jsonRows.length} rows`);

        // ---- Нормализация заголовков ----
        const normalize = (s: string) =>
            s
                .toLowerCase()
                .replace(/\s+/g, "")
                .replace(/[^\p{L}\p{N}]/gu, "")
                .trim();

        // ---- Маппинг ключевых колонок ----
        const headerMap: Record<string, string> = {
            "артикулwb": "sku",
            "артикулпродавца": "sku",
            "артикул": "sku",
            "название": "name",
            "бренд": "brand",

            "показы": "views",
            "просмотры": "views",
            "клики": "clicks",
            "переходы": "clicks",
            "переходывкарточку": "clicks",
            "вкорзину": "cart",
            "положиливкорзину": "cart",
            "корзина": "cart",

            // Orders - different variations
            "заказы": "orders",
            "заказали": "orders",
            "заказалишт": "orders",
            "заказовшт": "orders",
            "заказов": "orders",

            "ctr": "ctr",
            "crвкорзину": "cr_cart",
            "конверсиявкорзину": "cr_cart",
            "crвзаказ": "cr_order",
            "конверсиявзаказ": "cr_order",

            "средняяцена": "avg_price",
            "средняяцена₽": "avg_price",
            "выручка": "revenue",
            "заказалинасумму": "revenue",
            "заказалинасумму₽": "revenue",

            // Stock - use склад ВБ only (МП is usually 0 and would overwrite)
            "остатки": "stock_units",
            "остаткискладвб": "stock_units",
            "остаткискладвбшт": "stock_units",
            "остаткисклад": "stock_units",
            "остаткискладwb": "stock_units",
            "остаткискладwbшт": "stock_units",
            "остаткишт": "stock_units",

            // DRR - different variations
            "drrпоиск": "drr_search",
            "drrпоиска": "drr_search",
            "drrмедиа": "drr_media",
            "drrблогеры": "drr_bloggers",
            "drростальное": "drr_other",
            "drrдругое": "drr_other",
        };

        // DEBUG: Log normalized headers and their mappings
        if (jsonRows.length > 0) {
            const row = jsonRows[0];
            const debugMapping: Record<string, { normalized: string; mapped: string | null }> = {};
            for (const col of Object.keys(row)) {
                const normalized = normalize(col);
                const mapped = headerMap[normalized] || null;
                if (col.toLowerCase().includes("остатки")) {
                    debugMapping[col] = { normalized, mapped };
                }
            }
            console.log("Stock column debug:", JSON.stringify(debugMapping));
        }

        // ---- Преобразуем строки ----
        const finalData = jsonRows
            .map((row) => {
                const clean = Object.entries(row).reduce(
                    (acc: any, [col, value]) => {
                        const key = normalize(col);
                        const mapped = headerMap[key];
                        if (mapped) acc[mapped] = value;
                        return acc;
                    },
                    {}
                );

                if (!clean.sku) return null;
                return clean;
            })
            .filter(Boolean);

        console.log(`Valid rows with SKU: ${finalData.length}`);

        if (finalData.length === 0) {
            return new Response(
                JSON.stringify({
                    error: "No valid rows found. Check column names.",
                    parsedRows: jsonRows.length,
                    sheetNames: sheetNames,
                    sampleHeaders: jsonRows[0] ? Object.keys(jsonRows[0]).slice(0, 10) : []
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // ---- Delete old data ----
        await supabase.from("wb_funnel").delete().neq("id", "00000000-0000-0000-0000-000000000000");

        // ---- Batch insert ----
        const chunk = 300;
        let insertedCount = 0;

        for (let i = 0; i < finalData.length; i += chunk) {
            const slice = finalData.slice(i, i + chunk);
            const { error } = await supabase.from("wb_funnel").insert(slice);
            if (error) {
                console.error("Insert error:", error);
                throw error;
            }
            insertedCount += slice.length;
        }
        // Create stock debug info
        let stockDebug: Record<string, { normalized: string; mapped: string | null }> = {};
        if (jsonRows.length > 0) {
            for (const col of Object.keys(jsonRows[0])) {
                if (col.toLowerCase().includes("остатки")) {
                    stockDebug[col] = {
                        normalized: normalize(col),
                        mapped: headerMap[normalize(col)] || null
                    };
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                inserted: insertedCount,
                parsed: jsonRows.length,
                stockDebug: stockDebug,
                sampleRow: finalData[0] || null
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (e) {
        console.error("Error:", e);
        return new Response(
            JSON.stringify({ error: e.toString() }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
