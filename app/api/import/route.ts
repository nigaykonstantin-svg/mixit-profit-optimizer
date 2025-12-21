import { NextRequest, NextResponse } from 'next/server';
import { parseExcelFile, parseWbFile, importToFact2026, ImportType } from '@/modules/import';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const importType = formData.get('importType') as ImportType | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!importType || !['wb_sales', 'wb_orders', 'wb_stock', 'wb_advertising'].includes(importType)) {
            return NextResponse.json(
                { success: false, error: 'Invalid import type' },
                { status: 400 }
            );
        }

        // Read file as ArrayBuffer
        const buffer = await file.arrayBuffer();

        // Parse Excel
        const rows = parseExcelFile(buffer);
        if (rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'File is empty or could not be parsed' },
                { status: 400 }
            );
        }

        // Parse to FACT2026 format
        const records = parseWbFile(rows, importType);
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
