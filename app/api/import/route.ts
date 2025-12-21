import { NextRequest, NextResponse } from 'next/server';
import { parseExcelFile, parseWbFile, importToFact2026, ImportType } from '@/modules/import';
import { parseFunnelSheet, FunnelRow } from '@/modules/import/funnel-parser';
import { analyzeFunnel } from '@/modules/analytics/funnel-metrics';
import { getSupabaseClient, isSupabaseConfigured } from '@/analytics-engine/supabase/supabase-client';

async function importToWbFunnel(rows: FunnelRow[]): Promise<{ success: boolean; recordsImported: number; errors: string[] }> {
    if (!isSupabaseConfigured()) {
        return { success: false, recordsImported: 0, errors: ['Supabase not configured'] };
    }

    const supabase = getSupabaseClient();

    // Clear old data and insert new
    const { error: deleteError } = await supabase.from('wb_funnel').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
        console.warn('Delete error (may be empty table):', deleteError.message);
    }

    // Insert in batches
    const BATCH_SIZE = 500;
    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE).map(row => ({
            sku: row.sku,
            name: row.name,
            brand: row.brand,
            views: row.views,
            clicks: row.clicks,
            cart: row.cart,
            orders: row.orders,
            ctr: row.ctr,
            cr_cart: row.cr_cart,
            cr_order: row.cr_order,
            avg_price: row.avg_price,
            revenue: row.revenue,
            stock_units: row.stock_units,
            drr_search: row.drr_search,
            drr_media: row.drr_media,
            drr_bloggers: row.drr_bloggers,
            drr_other: row.drr_other,
        }));

        const { error } = await supabase.from('wb_funnel').insert(batch);

        if (error) {
            errors.push(`Batch ${i / BATCH_SIZE + 1}: ${error.message}`);
        } else {
            imported += batch.length;
        }
    }

    return { success: imported > 0, recordsImported: imported, errors };
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const importType = formData.get('importType') as string | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Read file as ArrayBuffer
        const buffer = await file.arrayBuffer();

        // Handle WB Funnel type - save to wb_funnel table
        if (importType === 'wb_funnel') {
            const rows = parseFunnelSheet(Buffer.from(buffer));
            const analyzed = analyzeFunnel(rows);

            // Save raw rows to wb_funnel
            const importResult = await importToWbFunnel(rows);

            return NextResponse.json({
                success: importResult.success,
                rows: analyzed,
                recordsProcessed: rows.length,
                recordsImported: importResult.recordsImported,
                errors: importResult.errors,
            });
        }

        // Validate import type for other types
        if (!importType || !['wb_sales', 'wb_orders', 'wb_stock', 'wb_advertising'].includes(importType)) {
            return NextResponse.json(
                { success: false, error: 'Invalid import type' },
                { status: 400 }
            );
        }

        // Parse Excel
        const rows = parseExcelFile(buffer);
        if (rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'File is empty or could not be parsed' },
                { status: 400 }
            );
        }

        // Parse to FACT2026 format
        const records = parseWbFile(rows, importType as ImportType);
        if (records.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No valid records found. Check column names.',
                    columnsFound: Object.keys(rows[0] || {}),
                },
                { status: 400 }
            );
        }

        // Import to Supabase
        const result = await importToFact2026(records);

        return NextResponse.json({
            success: result.success,
            recordsProcessed: result.recordsProcessed,
            recordsImported: result.recordsImported,
            errors: result.errors,
        });
    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
