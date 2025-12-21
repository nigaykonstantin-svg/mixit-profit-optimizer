// WB Rules Engine - Dynamic decision engine with configurable rules

import { WbSku, WbSale, WbOrder, WbStock, WbAdvertising } from './wb-types';
import { CategoryConfig } from './wb-config-loader';
import { ElasticityResult } from './wb-elasticity';

/**
 * Input data for SKU decision
 */
export interface SkuData {
    sku: WbSku;
    sale: WbSale;
    order: WbOrder;
    stock: WbStock;
    advertising: WbAdvertising;
    stock_cover_days: number; // calculated: stock_units / avg_daily_sales
}

/**
 * Decision result for a SKU
 */
export interface SkuDecision {
    price: 'up' | 'down' | 'hold';
    priceStepPct: number;
    ads: 'scale' | 'reduce' | 'pause' | 'off' | 'hold';
    reason: string;
    rule: string;
}

/**
 * Get decision for a SKU based on data, config, and elasticity
 * 
 * Rules priority (first match wins):
 * 1. STOP: profit <= 0 → price=up, ads=pause
 * 2. CLEAR: stock_cover_days >= 120 → price=down
 * 3. LOW_STOCK: stock_cover_days <= 10 → price=up
 * 4. OVERPRICED: ctr >= warning AND cr_order < warning → price=down
 * 5. DRR_SPIKE: drr_search > drr_warning → ads=reduce
 * 6. ELASTICITY: checks based on elasticity values
 * 7. DEFAULT: hold
 */
export function getDecisionForSku(
    skuData: SkuData,
    categoryConfig: CategoryConfig,
    elasticity: ElasticityResult
): SkuDecision {
    const { sale, order, stock, advertising } = skuData;
    const {
        min_margin_pct,
        ctr_warning,
        cr_order_warning,
        price_step_pct,
        drr_warning,
        stock_critical_days,
        stock_overstock_days
    } = categoryConfig;

    // Rule 1: STOP - убыточный товар
    if (sale.profit_before_mkt <= 0) {
        return {
            price: 'up',
            priceStepPct: price_step_pct,
            ads: 'pause',
            reason: `Убыточный товар. Прибыль: ${sale.profit_before_mkt.toFixed(0)}₽`,
            rule: 'STOP',
        };
    }

    // Rule 2: CLEAR - затоваривание
    if (skuData.stock_cover_days >= stock_overstock_days) {
        return {
            price: 'down',
            priceStepPct: price_step_pct,
            ads: 'scale',
            reason: `Затоваривание. Покрытие: ${skuData.stock_cover_days} дней (норма ≤${stock_overstock_days})`,
            rule: 'CLEAR',
        };
    }

    // Rule 3: LOW_STOCK - низкие запасы
    if (skuData.stock_cover_days <= stock_critical_days) {
        // Check elasticity before allowing price up
        if (elasticity.priceElasticity < -1) {
            return {
                price: 'hold',
                priceStepPct: 0,
                ads: 'reduce',
                reason: `Низкие запасы (${skuData.stock_cover_days}д), но эластичный спрос (${elasticity.priceElasticity.toFixed(2)}). Цену не повышаем.`,
                rule: 'LOW_STOCK_ELASTIC',
            };
        }
        if (elasticity.drrElasticity > 0) {
            return {
                price: 'hold',
                priceStepPct: 0,
                ads: 'reduce',
                reason: `Низкие запасы (${skuData.stock_cover_days}д), но ДРР растет с ценой. Цену не повышаем.`,
                rule: 'LOW_STOCK_DRR',
            };
        }
        return {
            price: 'up',
            priceStepPct: elasticity.priceElasticity > 0 ? price_step_pct * 2 : price_step_pct,
            ads: 'reduce',
            reason: `Низкие запасы. Покрытие: ${skuData.stock_cover_days} дней (критично ≤${stock_critical_days})`,
            rule: 'LOW_STOCK',
        };
    }

    // Rule 4: OVERPRICED - высокий CTR, но низкая конверсия → цена слишком высокая
    if (order.ctr >= ctr_warning && order.cr_order < cr_order_warning) {
        return {
            price: 'down',
            priceStepPct: price_step_pct,
            ads: 'hold',
            reason: `Переоценка. CTR ${order.ctr.toFixed(1)}% (норма), CR ${order.cr_order.toFixed(2)}% (низкий <${cr_order_warning}%)`,
            rule: 'OVERPRICED',
        };
    }

    // Rule 5: DRR_SPIKE - высокий ДРР рекламы
    const total_drr = advertising.ad_search_drr + advertising.ad_media_drr +
        advertising.ad_bloggers_drr + advertising.ad_other_drr;
    if (total_drr > drr_warning) {
        return {
            price: 'hold',
            priceStepPct: 0,
            ads: 'reduce',
            reason: `Высокий ДРР: ${total_drr.toFixed(1)}% (порог ${drr_warning}%)`,
            rule: 'DRR_SPIKE',
        };
    }

    // Rule 6: ELASTICITY checks for price optimization
    // Если маржа выше минимума и эластичность позволяет — можно поднять цену
    if (sale.profit_margin_before_mkt > min_margin_pct) {
        // Aggressive up if Giffen good
        if (elasticity.priceElasticity > 0) {
            return {
                price: 'up',
                priceStepPct: price_step_pct * 2,
                ads: 'scale',
                reason: `Премиум товар. Эластичность ${elasticity.priceElasticity.toFixed(2)} > 0. Агрессивное повышение.`,
                rule: 'ELASTICITY_PREMIUM',
            };
        }
        // Normal up if inelastic
        if (elasticity.priceElasticity > -0.3 && elasticity.drrElasticity <= 0) {
            return {
                price: 'up',
                priceStepPct: price_step_pct,
                ads: 'hold',
                reason: `Неэластичный спрос (${elasticity.priceElasticity.toFixed(2)}). Можно повысить цену.`,
                rule: 'ELASTICITY_INELASTIC',
            };
        }
    }

    // Rule 7: DEFAULT - всё в норме
    return {
        price: 'hold',
        priceStepPct: 0,
        ads: 'hold',
        reason: 'Показатели в норме. Без изменений.',
        rule: 'DEFAULT',
    };
}

/**
 * Detect signals at SKU level (legacy function, now uses getDecisionForSku internally)
 */
export function detectSkuSignals(
    sales: WbSale[],
    orders: WbOrder[],
    stock: WbStock[],
    adv: WbAdvertising[],
    sku: WbSku[]
): Record<string, unknown>[] {
    // TODO: Iterate over SKUs, get config and elasticity, call getDecisionForSku
    return [];
}

/**
 * Detect signals at Category level
 */
export function detectCategorySignals(
    sales: WbSale[],
    orders: WbOrder[],
    stock: WbStock[],
    adv: WbAdvertising[],
    sku: WbSku[]
): Record<string, unknown>[] {
    // TODO: Aggregate signals by category
    return [];
}

/**
 * Detect global signals across all data
 */
export function detectGlobalSignals(
    sales: WbSale[],
    orders: WbOrder[],
    stock: WbStock[],
    adv: WbAdvertising[],
    sku: WbSku[]
): Record<string, unknown>[] {
    // TODO: Detect global trends and anomalies
    return [];
}
