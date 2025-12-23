// =========================================
// MODE ENGINE - Detect SKU strategic mode
// =========================================

import { FunnelRow } from '@/modules/import/funnel-parser';
import { SkuMode } from './types';

/**
 * Detect strategic mode for SKU
 * 
 * STOP   - убыточный, revenue <= 0
 * CLEAR  - переизбыток, stock_cover >= 120 дней
 * COW    - дойная корова, стабильный с запасом >= 15 дней
 * GROWTH - рост, всё остальное
 */
export function detectMode(row: FunnelRow): SkuMode {
    // STOP: убыточный
    if (row.revenue <= 0) return 'STOP';

    // Calculate stock cover days
    const stock_cover_days = row.stock_units / Math.max(row.orders, 1);

    // CLEAR: переизбыток стока
    if (stock_cover_days >= 120) return 'CLEAR';

    // COW: дойная корова (прибыльный + достаточный сток)
    if (row.revenue > 0 && stock_cover_days >= 15) return 'COW';

    // GROWTH: всё остальное
    return 'GROWTH';
}
