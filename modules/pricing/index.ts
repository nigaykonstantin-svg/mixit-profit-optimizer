// ============================================
// PRICE OPTIMIZER V1 - Module Exports
// ============================================

// Types
export type {
    PriceAction,
    AdsAction,
    ReasonCode,
    SkuMode,
    SkuRole,
    DecisionTraceItem,
    PriceEngineInput,
    PriceRecommendation,
    OptimizerConfig,
} from './price-types';

// Config
export { OPTIMIZER_CONFIG, getCategoryConfig, getReasonText, REASON_TEXTS } from './price-config';

// Guards
export { applyAllGuards } from './price-guards';
export type { GuardResult, AllGuardsResult } from './price-guards';

// Engine
export { priceEngineV1, runPriceOptimizer } from './price-engine';
