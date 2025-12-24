// ============================================
// PRICE OPTIMIZER V1 - Guards & Priority Stack
// ============================================

import {
    PriceEngineInput,
    PriceAction,
    AdsAction,
    DecisionTraceItem,
    ReasonCode,
} from './price-types';
import { OPTIMIZER_CONFIG } from './price-config';

const CONFIG = OPTIMIZER_CONFIG.global;

// ============================================
// Guard Functions (Level 1-4)
// ============================================

export interface GuardResult {
    passed: boolean;
    blocked_actions: string[];
    trace: DecisionTraceItem;
}

// Level 1: Manual Lock
export function checkManualLock(input: PriceEngineInput): GuardResult {
    const blocked = input.manual_lock === true;
    return {
        passed: !blocked,
        blocked_actions: blocked ? ['PRICE_UP', 'PRICE_DOWN', 'ADS_SCALE'] : [],
        trace: {
            level: 1,
            rule: 'MANUAL_LOCK',
            result: blocked ? 'BLOCK' : 'PASS',
            detail: blocked ? 'SKU заблокирован вручную' : undefined,
        },
    };
}

// Level 1: Insufficient Data
export function checkInsufficientData(input: PriceEngineInput): GuardResult {
    const blocked = input.clicks_7d < CONFIG.min_clicks_7d || input.orders_7d < CONFIG.min_orders_7d;
    return {
        passed: !blocked,
        blocked_actions: blocked ? ['PRICE_UP', 'PRICE_DOWN'] : [],
        trace: {
            level: 1,
            rule: 'INSUFFICIENT_DATA',
            result: blocked ? 'BLOCK' : 'PASS',
            detail: blocked ? `clicks=${input.clicks_7d}, orders=${input.orders_7d}` : undefined,
        },
    };
}

// Level 1: Cooldown
export function checkCooldown(input: PriceEngineInput): GuardResult {
    if (!input.last_price_change_at || !input.today) {
        return {
            passed: true,
            blocked_actions: [],
            trace: { level: 1, rule: 'COOLDOWN', result: 'PASS' },
        };
    }

    const lastChange = new Date(input.last_price_change_at);
    const today = new Date(input.today);
    const daysSince = Math.floor((today.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
    const cooldown = input.is_gold ? CONFIG.cooldown_price_days_gold : CONFIG.cooldown_price_days;
    const blocked = daysSince < cooldown;

    return {
        passed: !blocked,
        blocked_actions: blocked ? ['PRICE_UP', 'PRICE_DOWN'] : [],
        trace: {
            level: 1,
            rule: 'COOLDOWN',
            result: blocked ? 'BLOCK' : 'PASS',
            detail: blocked ? `${daysSince}d < ${cooldown}d` : undefined,
        },
    };
}

// Level 2: Min Margin Guard (blocks price down)
export function checkMinMargin(input: PriceEngineInput, proposedStepPct: number): GuardResult {
    if (!input.current_margin_pct || proposedStepPct >= 0) {
        return {
            passed: true,
            blocked_actions: [],
            trace: { level: 2, rule: 'MIN_MARGIN', result: 'PASS' },
        };
    }

    const newMargin = input.current_margin_pct + proposedStepPct;
    const blocked = newMargin < CONFIG.min_margin_pct;

    return {
        passed: !blocked,
        blocked_actions: blocked ? ['PRICE_DOWN'] : [],
        trace: {
            level: 2,
            rule: 'MIN_MARGIN',
            result: blocked ? 'BLOCK' : 'PASS',
            detail: blocked ? `margin ${(newMargin * 100).toFixed(1)}% < min ${(CONFIG.min_margin_pct * 100).toFixed(1)}%` : undefined,
        },
    };
}

// Level 2: Low Stock Guard (blocks ads scale and aggressive price down)
export function checkLowStockGuard(input: PriceEngineInput): GuardResult {
    const stockCover = input.stock_cover_days ?? (input.orders_7d > 0 ? (input.stock_units / input.orders_7d) * 7 : 999);
    const blocked = stockCover <= CONFIG.low_stock_cover_days;

    return {
        passed: !blocked,
        blocked_actions: blocked ? ['ADS_SCALE', 'PRICE_DOWN_AGGRESSIVE'] : [],
        trace: {
            level: 2,
            rule: 'LOW_STOCK_GUARD',
            result: blocked ? 'BLOCK' : 'PASS',
            detail: blocked ? `stock_cover ${stockCover.toFixed(0)}d <= ${CONFIG.low_stock_cover_days}d` : undefined,
        },
    };
}

// Level 3: Gold Protection
export function checkGoldProtection(input: PriceEngineInput, proposedStepPct: number): GuardResult {
    if (!input.is_gold) {
        return {
            passed: true,
            blocked_actions: [],
            trace: { level: 3, rule: 'GOLD_PROTECTION', result: 'PASS' },
        };
    }

    const maxStep = CONFIG.gold_max_step_pct;
    const limited = Math.abs(proposedStepPct) > maxStep;

    return {
        passed: true, // Gold doesn't block, just limits
        blocked_actions: [],
        trace: {
            level: 3,
            rule: 'GOLD_PROTECTION',
            result: limited ? 'MODIFY' : 'PASS',
            detail: limited ? `step limited to ±${(maxStep * 100).toFixed(0)}%` : undefined,
        },
    };
}

// ============================================
// Apply All Guards
// ============================================

export interface AllGuardsResult {
    can_change_price: boolean;
    price_action_allowed: PriceAction[];
    ads_action_allowed: AdsAction[];
    blocked_actions: string[];
    decision_trace: DecisionTraceItem[];
    blocking_reason?: ReasonCode;
    max_step_pct: number;
}

export function applyAllGuards(input: PriceEngineInput, proposedStepPct: number = 0): AllGuardsResult {
    const trace: DecisionTraceItem[] = [];
    const blocked: string[] = [];

    // Level 1 guards
    const manualLock = checkManualLock(input);
    trace.push(manualLock.trace);
    blocked.push(...manualLock.blocked_actions);
    if (!manualLock.passed) {
        return {
            can_change_price: false,
            price_action_allowed: ['HOLD'],
            ads_action_allowed: ['HOLD'],
            blocked_actions: blocked,
            decision_trace: trace,
            blocking_reason: 'MANUAL_LOCK',
            max_step_pct: 0,
        };
    }

    const insufficientData = checkInsufficientData(input);
    trace.push(insufficientData.trace);
    blocked.push(...insufficientData.blocked_actions);
    if (!insufficientData.passed) {
        return {
            can_change_price: false,
            price_action_allowed: ['HOLD'],
            ads_action_allowed: ['HOLD', 'DOWN', 'PAUSE'],
            blocked_actions: blocked,
            decision_trace: trace,
            blocking_reason: 'INSUFFICIENT_DATA',
            max_step_pct: 0,
        };
    }

    const cooldown = checkCooldown(input);
    trace.push(cooldown.trace);
    blocked.push(...cooldown.blocked_actions);
    if (!cooldown.passed) {
        return {
            can_change_price: false,
            price_action_allowed: ['HOLD'],
            ads_action_allowed: ['HOLD', 'SCALE', 'DOWN', 'PAUSE'],
            blocked_actions: blocked,
            decision_trace: trace,
            blocking_reason: 'COOLDOWN_ACTIVE',
            max_step_pct: 0,
        };
    }

    // Level 2-3 guards
    const minMargin = checkMinMargin(input, proposedStepPct);
    trace.push(minMargin.trace);
    blocked.push(...minMargin.blocked_actions);

    const lowStock = checkLowStockGuard(input);
    trace.push(lowStock.trace);
    blocked.push(...lowStock.blocked_actions);

    const gold = checkGoldProtection(input, proposedStepPct);
    trace.push(gold.trace);

    // Determine max step
    let maxStep = CONFIG.max_price_step_pct;
    if (input.is_gold) {
        maxStep = CONFIG.gold_max_step_pct;
    }

    // Determine allowed actions
    const priceActionsAllowed: PriceAction[] = ['HOLD'];
    if (!blocked.includes('PRICE_UP')) priceActionsAllowed.push('UP');
    if (!blocked.includes('PRICE_DOWN')) priceActionsAllowed.push('DOWN');

    const adsActionsAllowed: AdsAction[] = ['HOLD', 'DOWN', 'PAUSE'];
    if (!blocked.includes('ADS_SCALE')) adsActionsAllowed.push('SCALE');

    return {
        can_change_price: priceActionsAllowed.length > 1,
        price_action_allowed: priceActionsAllowed,
        ads_action_allowed: adsActionsAllowed,
        blocked_actions: [...new Set(blocked)],
        decision_trace: trace,
        max_step_pct: maxStep,
    };
}
