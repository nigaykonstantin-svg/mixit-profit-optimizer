'use client';

import { Card, Badge, Button } from '@/modules/shared';
import { Sparkles, RefreshCw, ChevronRight } from 'lucide-react';

// Stub AI insights
const STUB_INSIGHTS = [
    {
        id: '1',
        type: 'opportunity',
        title: 'Увеличить цену на MX-001',
        description: 'Высокий спрос и низкие запасы конкурентов. Рекомендуемое повышение: +5%',
        impact: '+45 000 ₽/мес',
        confidence: 85,
    },
    {
        id: '2',
        type: 'risk',
        title: 'Снизить рекламу на MX-003',
        description: 'ДРР 28% превышает целевой. Рекомендуется снизить ставки на 20%',
        impact: 'Экономия 12 000 ₽/нед',
        confidence: 92,
    },
    {
        id: '3',
        type: 'action',
        title: 'Срочно заказать MX-006',
        description: 'Запасов на 5 дней при текущих продажах. Мин. заказ: 500 шт',
        impact: 'Предотвращение OOS',
        confidence: 98,
    },
    {
        id: '4',
        type: 'opportunity',
        title: 'Расширить категорию Волосы',
        description: 'Рост категории +22% vs рынок. Потенциал для новых SKU',
        impact: '+180 000 ₽/мес',
        confidence: 72,
    },
];

export function AiInsightsPanel() {
    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'opportunity':
                return { label: 'Возможность', variant: 'success' as const, color: 'text-green-600' };
            case 'risk':
                return { label: 'Риск', variant: 'warning' as const, color: 'text-yellow-600' };
            case 'action':
                return { label: 'Действие', variant: 'danger' as const, color: 'text-red-600' };
            default:
                return { label: 'Инфо', variant: 'info' as const, color: 'text-blue-600' };
        }
    };

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-500" />
                    <h2 className="font-semibold text-gray-900">AI Рекомендации</h2>
                </div>
                <Button variant="ghost" size="sm">
                    <RefreshCw size={14} />
                    Обновить
                </Button>
            </div>

            <div className="space-y-3">
                {STUB_INSIGHTS.map((insight) => {
                    const typeConfig = getTypeConfig(insight.type);
                    return (
                        <div
                            key={insight.id}
                            className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
                                        <span className="text-xs text-gray-400">
                                            {insight.confidence}% уверенность
                                        </span>
                                    </div>
                                    <h3 className="font-medium text-gray-900 mb-1">{insight.title}</h3>
                                    <p className="text-sm text-gray-500">{insight.description}</p>
                                    <p className={`text-sm font-medium mt-2 ${typeConfig.color}`}>
                                        Эффект: {insight.impact}
                                    </p>
                                </div>
                                <ChevronRight size={16} className="text-gray-400 mt-1" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                    Рекомендации на основе анализа данных за последние 30 дней
                </p>
            </div>
        </Card>
    );
}
