'use client';

import { useState } from 'react';
import { Card, Button, Badge } from '@/modules/shared';
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

// Stub data - no import from old analytics
const STUB_METRICS = {
    revenue: 14350000,
    orders: 3820,
    avgCheck: 3757,
    margin: 28.5,
    growth: 12.3,
};

const STUB_SIGNALS = [
    { id: '1', type: 'warning', title: 'Низкие запасы', count: 8 },
    { id: '2', type: 'critical', title: 'Высокий ДРР', count: 3 },
    { id: '3', type: 'info', title: 'Рост продаж', count: 12 },
];

export function AnalyticsDashboard() {
    const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

    const formatCurrency = (value: number) => value.toLocaleString('ru-RU') + ' ₽';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <BarChart3 className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Аналитика</h1>
                        <p className="text-sm text-gray-500">Wildberries</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {(['week', 'month', 'quarter'] as const).map((p) => (
                        <Button
                            key={p}
                            variant={period === p ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setPeriod(p)}
                        >
                            {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Квартал'}
                        </Button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <p className="text-sm text-gray-500">Выручка</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(STUB_METRICS.revenue)}</p>
                    <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                        <TrendingUp size={14} />
                        +{STUB_METRICS.growth}%
                    </div>
                </Card>

                <Card>
                    <p className="text-sm text-gray-500">Заказы</p>
                    <p className="text-xl font-bold text-gray-900">{STUB_METRICS.orders.toLocaleString('ru-RU')}</p>
                </Card>

                <Card>
                    <p className="text-sm text-gray-500">Средний чек</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(STUB_METRICS.avgCheck)}</p>
                </Card>

                <Card>
                    <p className="text-sm text-gray-500">Маржа</p>
                    <p className="text-xl font-bold text-gray-900">{STUB_METRICS.margin}%</p>
                </Card>

                <Card>
                    <p className="text-sm text-gray-500">Сигналы</p>
                    <div className="flex items-center gap-2 mt-1">
                        {STUB_SIGNALS.map((s) => (
                            <Badge
                                key={s.id}
                                variant={s.type === 'critical' ? 'danger' : s.type === 'warning' ? 'warning' : 'info'}
                            >
                                {s.count}
                            </Badge>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Signals Summary */}
            <Card>
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={18} className="text-yellow-500" />
                    <h2 className="font-semibold text-gray-900">Активные сигналы</h2>
                </div>
                <div className="space-y-2">
                    {STUB_SIGNALS.map((signal) => (
                        <div key={signal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{signal.title}</span>
                            <Badge
                                variant={signal.type === 'critical' ? 'danger' : signal.type === 'warning' ? 'warning' : 'info'}
                            >
                                {signal.count} SKU
                            </Badge>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
