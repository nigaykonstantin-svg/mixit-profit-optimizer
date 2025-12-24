// Claude AI client for generating insights
import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
    if (!anthropicClient) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY not configured');
        }
        anthropicClient = new Anthropic({ apiKey });
    }
    return anthropicClient;
}

export function isAnthropicConfigured(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
}

export interface CategoryData {
    name: string;
    revenue: number;
    orders: number;
    avgCr: number;
    lowStock: number;
    needsPriceDown: number;
    criticalCount: number;
    warningCount: number;
    recommendationsCount: number;
}

export interface InsightRequest {
    categories: CategoryData[];
    totals: {
        revenue: number;
        orders: number;
        skuCount: number;
    };
}

export async function generateCategoryInsights(data: InsightRequest): Promise<string> {
    const client = getAnthropicClient();

    const prompt = `Ты — AI-аналитик для руководителя e-commerce на Wildberries (косметика MIXIT).

Вот данные по категориям за период:

${data.categories.map(cat => `
📦 ${cat.name}:
- Выручка: ${(cat.revenue / 1000000).toFixed(2)}M ₽
- Заказов: ${cat.orders.toLocaleString()}
- Средний CR: ${(cat.avgCr * 100).toFixed(2)}%
- Критично (мало стока): ${cat.lowStock} SKU
- Требует внимания: ${cat.warningCount} SKU
- Рекомендации по ценам: ${cat.recommendationsCount} SKU
`).join('\n')}

ИТОГО:
- Общая выручка: ${(data.totals.revenue / 1000000).toFixed(2)}M ₽
- Общие заказы: ${data.totals.orders.toLocaleString()}
- SKU в анализе: ${data.totals.skuCount}

Задача: дай краткий анализ (3-5 ключевых инсайтов) для руководителя:
1. Главные риски (что требует немедленного внимания)
2. Точки роста (где можно увеличить прибыль)
3. Приоритетные действия на сегодня

Формат: используй эмодзи, пиши кратко и по делу. Максимум 200 слов.`;

    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
            { role: 'user', content: prompt }
        ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    return textContent?.text || 'Не удалось сгенерировать инсайты';
}

export async function generateSkuInsight(skuData: {
    sku: string;
    revenue: number;
    orders: number;
    ctr: number;
    cr_order: number;
    stock: number;
    price_action: string;
    reason_text: string;
    category: string;
}): Promise<string> {
    const client = getAnthropicClient();

    const prompt = `Ты — AI-аналитик для e-commerce. Проанализируй SKU:

SKU: ${skuData.sku}
Категория: ${skuData.category}
Выручка: ${(skuData.revenue / 1000).toFixed(1)}K ₽
Заказов: ${skuData.orders}
CTR: ${(skuData.ctr * 100).toFixed(2)}%
CR: ${(skuData.cr_order * 100).toFixed(2)}%
Сток: ${skuData.stock} шт
Рекомендация: ${skuData.price_action} — ${skuData.reason_text}

Дай 2-3 предложения с конкретным анализом и рекомендацией. Пиши кратко.`;

    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [
            { role: 'user', content: prompt }
        ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    return textContent?.text || 'Анализ недоступен';
}
