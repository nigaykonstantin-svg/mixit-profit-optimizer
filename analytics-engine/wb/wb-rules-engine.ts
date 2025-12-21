// WB Rules Engine - Business rules and signal detection

import { WbSku, WbSale, WbOrder, WbStock, WbAdvertising } from './wb-types';

// TODO: Import elasticity when implemented
// import { getElasticityForSku } from './wb-elasticity';

/**
 * TODO: Elasticity-based price change rules
 * 
 * Перед изменением цены вызвать getElasticityForSku(sku):
 * 
 * 1. Если priceElasticity < -1:
 *    → price_up ЗАПРЕЩЁН
 *    → Спрос эластичный, повышение цены снизит выручку
 * 
 * 2. Если priceElasticity > -0.3:
 *    → price_up РАЗРЕШЁН
 *    → Спрос неэластичный, можно поднять цену
 * 
 * 3. Если priceElasticity > 0:
 *    → АГРЕССИВНЫЙ price_up
 *    → Аномалия: рост цены увеличивает спрос (товар Гиффена или премиум)
 * 
 * 4. Если drrElasticity > 0:
 *    → price_up ЗАПРЕЩЁН
 *    → При росте цены растет ДРР, что съедает маржу
 * 
 * Example implementation:
 * 
 * async function canIncreasePrice(sku: string): Promise<{allowed: boolean, aggressive: boolean, reason: string}> {
 *   const { priceElasticity, drrElasticity } = await getElasticityForSku(sku);
 *   
 *   if (drrElasticity > 0) {
 *     return { allowed: false, aggressive: false, reason: 'DRR растет при повышении цены' };
 *   }
 *   
 *   if (priceElasticity < -1) {
 *     return { allowed: false, aggressive: false, reason: 'Эластичный спрос' };
 *   }
 *   
 *   if (priceElasticity > 0) {
 *     return { allowed: true, aggressive: true, reason: 'Товар Гиффена / премиум' };
 *   }
 *   
 *   if (priceElasticity > -0.3) {
 *     return { allowed: true, aggressive: false, reason: 'Неэластичный спрос' };
 *   }
 *   
 *   return { allowed: false, aggressive: false, reason: 'Пограничная эластичность' };
 * }
 */

/**
 * Detect signals at SKU level
 * @returns массив сигналов по отдельным SKU
 */
export function detectSkuSignals(
    sales: WbSale[],
    orders: WbOrder[],
    stock: WbStock[],
    adv: WbAdvertising[],
    sku: WbSku[]
): Record<string, unknown>[] {
    // placeholder
    return [];
}

/**
 * Detect signals at Category level
 * @returns массив сигналов по категориям
 */
export function detectCategorySignals(
    sales: WbSale[],
    orders: WbOrder[],
    stock: WbStock[],
    adv: WbAdvertising[],
    sku: WbSku[]
): Record<string, unknown>[] {
    // placeholder
    return [];
}

/**
 * Detect global signals across all data
 * @returns массив глобальных сигналов
 */
export function detectGlobalSignals(
    sales: WbSale[],
    orders: WbOrder[],
    stock: WbStock[],
    adv: WbAdvertising[],
    sku: WbSku[]
): Record<string, unknown>[] {
    // placeholder
    return [];
}
