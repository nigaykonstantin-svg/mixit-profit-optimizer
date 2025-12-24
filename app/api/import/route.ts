import { NextRequest, NextResponse } from 'next/server';
import { parseExcelFile, parseWbFile, importToFact2026, saveFunnelToDb, ImportType } from '@/modules/import';
import { parseFunnelSheet } from '@/modules/import/funnel-parser';
import { analyzeFunnel } from '@/modules/analytics/funnel-metrics';
import { upsertSkuCatalog, SkuCatalogEntry } from '@/modules/import/sku-catalog';

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

            console.log('Parsed rows count:', rows.length);
            console.log('First row sample:', rows[0]);
            console.log('First row with data:', rows.find(r => r.sku));

            // If no valid rows, return error with debug info
            if (rows.length === 0 || !rows.find(r => r.sku)) {
                return NextResponse.json({
                    success: false,
                    error: 'No valid rows parsed. Check column names match Excel headers.',
                    recordsProcessed: rows.length,
                    recordsImported: 0,
                    debug: { firstRow: rows[0] }
                });
            }

            // Save to wb_funnel table
            try {
                await saveFunnelToDb(rows);
            } catch (dbError: unknown) {
                const errorMessage = dbError instanceof Error
                    ? dbError.message
                    : (typeof dbError === 'object' && dbError !== null && 'message' in dbError)
                        ? String((dbError as { message: unknown }).message)
                        : JSON.stringify(dbError);
                return NextResponse.json({
                    success: false,
                    error: `Database error: ${errorMessage}`,
                    recordsProcessed: rows.length,
                    recordsImported: 0,
                });
            }

            // Auto-sync categories to sku_catalog if category column exists
            const rowsWithCategory = rows.filter(r => r.category && r.category.trim());
            if (rowsWithCategory.length > 0) {
                console.log(`Found ${rowsWithCategory.length} rows with category data, syncing to sku_catalog...`);

                const catalogEntries: SkuCatalogEntry[] = rowsWithCategory.map(r => ({
                    sku: r.sku,
                    category: r.category!,
                    name: r.name || undefined,
                }));

                try {
                    const syncResult = await upsertSkuCatalog(catalogEntries);
                    console.log(`Synced ${syncResult.count} categories to sku_catalog`);
                } catch (syncError) {
                    console.error('Failed to sync categories:', syncError);
                    // Don't fail the whole import, just log the error
                }
            }

            // Return analyzed data
            const analyzed = analyzeFunnel(rows);

            return NextResponse.json({
                success: true,
                rows: analyzed,
                recordsProcessed: rows.length,
                recordsImported: rows.length,
                categoriesSynced: rowsWithCategory.length,
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
