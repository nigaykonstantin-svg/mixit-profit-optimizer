'use client';

import { useState } from 'react';
import { Card, Badge, Button, Input } from '@/modules/shared';
import { Search, AlertCircle, AlertTriangle, Info, TrendingUp, TrendingDown } from 'lucide-react';

// Stub data
const STUB_SKUS = [
    { sku: 'MX-001', name: 'Крем увлажняющий', revenue: 1850000, growth: 12.5, stock: 7, signal: 'warning', signalText: 'Низкие запасы' },
    { sku: 'MX-002', name: 'Сыворотка витамин C', revenue: 1420000, growth: 8.3, stock: 25, signal: null, signalText: null },
    { sku: 'MX-003', name: 'Шампунь восстанавливающий', revenue: 980000, growth: -12.1, stock: 3, signal: 'critical', signalText: 'Критические запасы' },
    { sku: 'MX-004', name: 'Помада матовая', revenue: 890000, growth: 15.7, stock: 42, signal: null, signalText: null },
    { sku: 'MX-005', name: 'Тушь для ресниц', revenue: 780000, growth: 5.2, stock: 18, signal: 'info', signalText: 'Высокий рост' },
    { sku: 'MX-006', name: 'Маска для лица', revenue: 650000, growth: -8.4, stock: 5, signal: 'warning', signalText: 'Низкие запасы' },
];

interface SkuSignalsProps {
    categoryId?: string;
}

export function SkuSignals({ categoryId }: SkuSignalsProps) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'warning' | 'critical'>('all');

    const filteredSkus = STUB_SKUS.filter((sku) => {
        if (search && !sku.name.toLowerCase().includes(search.toLowerCase()) && !sku.sku.toLowerCase().includes(search.toLowerCase())) {
            return false;
        }
        if (filter === 'warning' && sku.signal !== 'warning') return false;
        if (filter === 'critical' && sku.signal !== 'critical') return false;
        return true;
    });

    const formatCurrency = (value: number) => value.toLocaleString('ru-RU') + ' ₽';

    const getSignalIcon = (signal: string | null) => {
        switch (signal) {
            case 'critical': return <AlertCircle size={14} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={14} className="text-yellow-500" />;
            case 'info': return <Info size={14} className="text-blue-500" />;
            default: return null;
        }
    };

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-100 space-y-3">
                <h2 className="font-semibold text-gray-900">Сигналы по SKU</h2>

                <div className="flex gap-3">
                    <div className="flex-1">
                        <Input
                            placeholder="Поиск по SKU или названию..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={<Search size={16} />}
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'warning', 'critical'] as const).map((f) => (
                            <Button
                                key={f}
                                variant={filter === f ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setFilter(f)}
                            >
                                {f === 'all' ? 'Все' : f === 'warning' ? 'Внимание' : 'Критично'}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">SKU</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Название</th>
                        <th className="text-right p-3 text-sm font-medium text-gray-600">Выручка</th>
                        <th className="text-right p-3 text-sm font-medium text-gray-600">Рост</th>
                        <th className="text-right p-3 text-sm font-medium text-gray-600">Дней запаса</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Сигнал</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSkus.map((sku) => (
                        <tr key={sku.sku} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="p-3 text-sm text-gray-500 font-mono">{sku.sku}</td>
                            <td className="p-3 text-sm font-medium text-gray-900">{sku.name}</td>
                            <td className="p-3 text-sm text-right text-gray-600">{formatCurrency(sku.revenue)}</td>
                            <td className={`p-3 text-sm text-right ${sku.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                <div className="flex items-center justify-end gap-1">
                                    {sku.growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {sku.growth > 0 ? '+' : ''}{sku.growth}%
                                </div>
                            </td>
                            <td className={`p-3 text-sm text-right ${sku.stock <= 7 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                {sku.stock}
                            </td>
                            <td className="p-3">
                                {sku.signal && sku.signalText && (
                                    <div className="flex items-center gap-1">
                                        {getSignalIcon(sku.signal)}
                                        <span className="text-xs text-gray-600">{sku.signalText}</span>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {filteredSkus.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    Нет SKU по выбранным фильтрам
                </div>
            )}
        </Card>
    );
}
