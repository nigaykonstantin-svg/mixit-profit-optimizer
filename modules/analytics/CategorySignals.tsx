'use client';

import { Card, Badge } from '@/modules/shared';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Stub data
const STUB_CATEGORIES = [
    { id: '1', name: 'Лицо', revenue: 5200000, growth: 15.2, margin: 32.1, signals: 2 },
    { id: '2', name: 'Волосы', revenue: 3800000, growth: -3.5, margin: 28.4, signals: 1 },
    { id: '3', name: 'Макияж', revenue: 3200000, growth: 8.7, margin: 35.2, signals: 3 },
    { id: '4', name: 'Тело', revenue: 2150000, growth: 22.1, margin: 25.8, signals: 0 },
];

interface CategorySignalsProps {
    onCategoryClick?: (categoryId: string) => void;
}

export function CategorySignals({ onCategoryClick }: CategorySignalsProps) {
    const formatCurrency = (value: number) => (value / 1000000).toFixed(1) + 'M ₽';

    const getGrowthIcon = (growth: number) => {
        if (growth > 5) return <TrendingUp size={14} className="text-green-500" />;
        if (growth < -5) return <TrendingDown size={14} className="text-red-500" />;
        return <Minus size={14} className="text-gray-400" />;
    };

    const getGrowthColor = (growth: number) => {
        if (growth > 5) return 'text-green-600';
        if (growth < -5) return 'text-red-600';
        return 'text-gray-500';
    };

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Сигналы по категориям</h2>
            </div>
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Категория</th>
                        <th className="text-right p-3 text-sm font-medium text-gray-600">Выручка</th>
                        <th className="text-right p-3 text-sm font-medium text-gray-600">Рост</th>
                        <th className="text-right p-3 text-sm font-medium text-gray-600">Маржа</th>
                        <th className="text-center p-3 text-sm font-medium text-gray-600">Сигналы</th>
                    </tr>
                </thead>
                <tbody>
                    {STUB_CATEGORIES.map((cat) => (
                        <tr
                            key={cat.id}
                            className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => onCategoryClick?.(cat.id)}
                        >
                            <td className="p-3 text-sm font-medium text-gray-900">{cat.name}</td>
                            <td className="p-3 text-sm text-right text-gray-600">{formatCurrency(cat.revenue)}</td>
                            <td className={`p-3 text-sm text-right ${getGrowthColor(cat.growth)}`}>
                                <div className="flex items-center justify-end gap-1">
                                    {getGrowthIcon(cat.growth)}
                                    {cat.growth > 0 ? '+' : ''}{cat.growth}%
                                </div>
                            </td>
                            <td className="p-3 text-sm text-right text-gray-600">{cat.margin}%</td>
                            <td className="p-3 text-center">
                                {cat.signals > 0 ? (
                                    <Badge variant="warning">{cat.signals}</Badge>
                                ) : (
                                    <Badge variant="success">OK</Badge>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
}
