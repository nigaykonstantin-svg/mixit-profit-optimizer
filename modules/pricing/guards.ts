// =========================================
// GUARDS - Safety checks before price changes
// =========================================

import { FunnelRow } from '@/modules/import/funnel-parser';
import { BlockReason } from './types';

export interface GuardResult {
    blocked: boolean;
    reason?: BlockReason;
}

/**
 * Check all guards before allowing price change
 */
export function checkGuards(row: FunnelRow): GuardResult {
    // Guard 1: Insufficient data
    if (row.clicks < 30 || row.orders < 10) {
        return { blocked: true, reason: 'INSUFFICIENT_DATA' };
    }

    // Guard 2: Low stock protection
    if (row.stock_units < 10) {
        return { blocked: true, reason: 'LOW_STOCK_GUARD' };
    }

    // All guards passed
    return { blocked: false };
}
