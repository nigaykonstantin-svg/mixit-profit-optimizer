import { NextRequest, NextResponse } from 'next/server';
import { parseExcelFile, parseWbFile, importToFact2026, ImportType } from '@/modules/import';
import { parseFunnelSheet } from '@/modules/import/funnel-parser';
import { analyzeFunnel } from '@/modules/analytics/funnel-metrics';

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

        // Handle WB Funnel type separately
        if (importType === 'wb_funnel') {
            const rows = parseFunnelSheet(Buffer.from(buffer));
            const analyzed = analyzeFunnel(rows);

            // Save to Supabase fact2026
            const today = new Date().toISOString().split('T')[0];
            const records = analyzed.map(row => ({
                date: today,
                sku: row.sku,
                price: row.price,
                revenue: row.revenue,
                views: row.views,
                orders: row.orders,
                ctr: row.ctr,
                cr_order: row.cr_order,
                stock: row.stock,
                drr_search: row.total_drr,
                source: 'wb_funnel',
            }));

            const importResult = await importToFact2026(records);

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
