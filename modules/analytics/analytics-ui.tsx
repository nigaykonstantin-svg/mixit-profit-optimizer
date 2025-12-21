'use client';

import { useState, useEffect } from 'react';
import {
    TimePeriod,
    TIME_PERIODS,
    SalesMetrics,
    ConversionFunnel,
    TrafficSource,
    DailyStats,
    TopSku,
    formatCurrency,
    formatPercent,
} from './analytics-model';
import {
    getSalesMetrics,
    getConversionFunnel,
    getTrafficSources,
    getDailyStats,
    getTopSkus,
} from './analytics-api';
import { Card, Button, Badge } from '@/modules/shared';

// Period labels
const PERIOD_LABELS: Record<TimePeriod, string> = {
    [TIME_PERIODS.TODAY]: 'Сегодня',
    [TIME_PERIODS.WEEK]: 'Неделя',
    [TIME_PERIODS.MONTH]: 'Месяц',
    [TIME_PERIODS.QUARTER]: 'Квартал',
    [TIME_PERIODS.YEAR]: 'Год',
};

// ============================================
// PeriodSelector
// ============================================

interface PeriodSelectorProps {
    selected: TimePeriod;
    onChange: (period: TimePeriod) => void;
}

export function PeriodSelector({ selected, onChange }: PeriodSelectorProps) {
    return (
        <div className="flex gap-2">
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                <Button
                    key={key}
                    variant={selected === key ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => onChange(key as TimePeriod)}
                >
                    {label}
                </Button>
            ))}
        </div>
    );
}

// ============================================
// SalesMetricsCard
// ============================================

interface SalesMetricsCardProps {
    period: TimePeriod;
}

export function SalesMetricsCard({ period }: SalesMetricsCardProps) {
    const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getSalesMetrics(period);
            setMetrics(data);
            setLoading(false);
        }
        load();
    }, [period]);

    if (loading || !metrics) {
        return <Card><div className="p-4 text-gray-500">Загрузка...</div></Card>;
    }

    const stats = [
        { label: 'Выручка', value: formatCurrency(metrics.revenue) },
        { label: 'Заказы', value: metrics.orders.toLocaleString('ru-RU') },
        { label: 'Средний чек', value: formatCurrency(metrics.avgOrderValue) },
        { label: 'Продано товаров', value: metrics.itemsSold.toLocaleString('ru-RU') },
        { label: 'Возвраты', value: metrics.returns.toString() },
        { label: '% возвратов', value: formatPercent(metrics.returnRate) },
    ];

    return (
        <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Продажи</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label}>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ============================================
// ConversionFunnelCard
// ============================================

interface ConversionFunnelCardProps {
    period: TimePeriod;
}

export function ConversionFunnelCard({ period }: ConversionFunnelCardProps) {
    const [funnel, setFunnel] = useState<ConversionFunnel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getConversionFunnel(period);
            setFunnel(data);
            setLoading(false);
        }
        load();
    }, [period]);

    if (loading || !funnel) {
        return <Card><div className="p-4 text-gray-500">Загрузка...</div></Card>;
    }

    const steps = [
        { label: 'Просмотры', value: funnel.views, rate: null },
        { label: 'Корзина', value: funnel.addToCart, rate: funnel.viewToCartRate },
        { label: 'Оформление', value: funnel.checkout, rate: funnel.cartToCheckoutRate },
        { label: 'Покупка', value: funnel.purchase, rate: funnel.checkoutToPurchaseRate },
    ];

    const maxValue = funnel.views;

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Воронка конверсии</h3>
                <Badge variant="primary">{formatPercent(funnel.overallConversion)} общая</Badge>
            </div>
            <div className="space-y-3">
                {steps.map((step, index) => (
                    <div key={step.label}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{step.label}</span>
                            <span className="text-gray-900 font-medium">
                                {step.value.toLocaleString('ru-RU')}
                                {step.rate !== null && (
                                    <span className="text-gray-400 ml-2">({formatPercent(step.rate)})</span>
                                )}
                            </span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                                style={{ width: `${(step.value / maxValue) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ============================================
// TrafficSourcesCard
// ============================================

interface TrafficSourcesCardProps {
    period: TimePeriod;
}

export function TrafficSourcesCard({ period }: TrafficSourcesCardProps) {
    const [sources, setSources] = useState<TrafficSource[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getTrafficSources(period);
            setSources(data);
            setLoading(false);
        }
        load();
    }, [period]);

    if (loading) {
        return <Card><div className="p-4 text-gray-500">Загрузка...</div></Card>;
    }

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Источники трафика</h3>
            </div>
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Источник</th>
                        <th className="text-right p-3 text-sm font-medium text-gray-600">Посетители</th>
                        <th className="text-right p-3 text-sm font-medium text-gray-600">Заказы</th>
                        <th className="text-right p-3 text-sm font-medium text-gray-600">Выручка</th>
                        <th className="text-right p-3 text-sm font-medium text-gray-600">CR</th>
                    </tr>
                </thead>
                <tbody>
                    {sources.map((source) => (
                        <tr key={source.source} className="border-t border-gray-100">
                            <td className="p-3 text-sm font-medium text-gray-900">{source.source}</td>
                            <td className="p-3 text-sm text-right text-gray-600">
                                {source.visitors.toLocaleString('ru-RU')}
                            </td>
                            <td className="p-3 text-sm text-right text-gray-600">
                                {source.orders.toLocaleString('ru-RU')}
                            </td>
                            <td className="p-3 text-sm text-right text-gray-600">
                                {formatCurrency(source.revenue)}
                            </td>
                            <td className="p-3 text-sm text-right font-medium text-green-600">
                                {formatPercent(source.conversion)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
}

// ============================================
// RevenueTrendCard
// ============================================

interface RevenueTrendCardProps {
    period: TimePeriod;
}

export function RevenueTrendCard({ period }: RevenueTrendCardProps) {
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const data = await getDailyStats(period);
            setDailyStats(data);
            setLoading(false);
        }
        load();
    }, [period]);

    if (loading) {
        return <Card><div className="p-4 text-gray-500">Загрузка...</div></Card>;
    }

    const maxRevenue = Math.max(...dailyStats.map(d => d.revenue));
    const totalRevenue = dailyStats.reduce((sum, d) => sum + d.revenue, 0);
    const avgRevenue = totalRevenue / dailyStats.length;

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Динамика выручки</h3>
                <div className="text-sm text-gray-500">
                    Среднее: {formatCurrency(Math.round(avgRevenue))}
                </div>
            </div>
            <div className="flex items-end gap-1 h-32">
                {dailyStats.map((day, index) => (
                    <div
                        key={day.date}
                        className="flex-1 bg-gradient-to-t from-violet-500 to-purple-400 rounded-t hover:from-violet-600 hover:to-purple-500 transition-all cursor-pointer"
                        style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                        title={`${day.date}: ${formatCurrency(day.revenue)}`}
                    />
                ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{dailyStats[0]?.date}</span>
                <span>{dailyStats[dailyStats.length - 1]?.date}</span>
            </div>
        </Card>
    );
}

// ============================================
// TopSkusCard
// ============================================

interface TopSkusCardProps {
    metric: 'revenue' | 'orders' | 'growth';
    title: string;
    valueLabel: string;
    formatValue?: (value: number) => string;
}

export function TopSkusCard({
    metric,
    title,
    valueLabel,
    formatValue = (v) => v.toLocaleString('ru-RU')
}: TopSkusCardProps) {
    const [skus, setSkus] = useState<TopSku[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await getTopSkus(metric, 5);
            setSkus(data);
            setLoading(false);
        }
        load();
    }, [metric]);

    if (loading) {
        return <Card><div className="p-4 text-gray-500">Загрузка...</div></Card>;
    }

    return (
        <Card>
            <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
            <div className="space-y-3">
                {skus.map((sku, index) => (
                    <div key={sku.sku} className="flex items-center gap-3">
                        <span className="text-sm text-gray-400 w-4">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{sku.name}</p>
                            <p className="text-xs text-gray-500">{sku.sku}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{formatValue(sku.value)}</p>
                            <p className={`text-xs ${sku.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {sku.change >= 0 ? '+' : ''}{sku.change}%
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ============================================
// AnalyticsDashboard (main component)
// ============================================

export function AnalyticsDashboard() {
    const [period, setPeriod] = useState<TimePeriod>(TIME_PERIODS.MONTH);

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Аналитика</h2>
                <PeriodSelector selected={period} onChange={setPeriod} />
            </div>

            {/* Top Row: Sales + Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SalesMetricsCard period={period} />
                <ConversionFunnelCard period={period} />
            </div>

            {/* Revenue Trend */}
            <RevenueTrendCard period={period} />

            {/* Traffic Sources */}
            <TrafficSourcesCard period={period} />

            {/* Top SKUs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TopSkusCard
                    metric="revenue"
                    title="Топ по выручке"
                    valueLabel="Выручка"
                    formatValue={formatCurrency}
                />
                <TopSkusCard
                    metric="orders"
                    title="Топ по заказам"
                    valueLabel="Заказы"
                    formatValue={(v) => v.toLocaleString('ru-RU') + ' шт'}
                />
                <TopSkusCard
                    metric="growth"
                    title="Топ по росту"
                    valueLabel="Рост"
                    formatValue={formatCurrency}
                />
            </div>
        </div>
    );
}
