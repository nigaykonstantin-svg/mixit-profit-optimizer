'use client';

import { useState, useEffect } from 'react';
import { Category, calculateDeviation, STOCK_STATUS_LABELS, TopProduct, PlanValue } from './category-model';
import { getCategories, getSubcategories, getTopProducts, getPlanFactHistory, updatePlan } from './category-api';
import { Card, Button, Input } from '@/modules/shared';

// ============================================
// CategoryDashboard
// ============================================

interface CategoryDashboardProps {
    onCategorySelect?: (categoryId: string) => void;
}

export function CategoryDashboard({ onCategorySelect }: CategoryDashboardProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await getCategories();
            setCategories(data);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return <div className="p-4 text-gray-500" > Загрузка...</div>;
    }

    return (
        <Card padding= "none" >
        <div className="p-4 border-b border-gray-100" >
            <h2 className="font-semibold text-gray-900" > Категории </h2>
                </div>
                < table className = "w-full" >
                    <thead className="bg-gray-50" >
                        <tr>
                        <th className="text-left p-3 text-sm font-medium text-gray-600" > Название </th>
                            < th className = "text-right p-3 text-sm font-medium text-gray-600" > План </th>
                                < th className = "text-right p-3 text-sm font-medium text-gray-600" > Факт </th>
                                    < th className = "text-right p-3 text-sm font-medium text-gray-600" > Отклонение </th>
                                        </tr>
                                        </thead>
                                        <tbody>
    {
        categories.map((category) => {
            const deviation = calculateDeviation(category.planThisMonth, category.factThisMonth);
            const deviationColor = deviation >= 0 ? 'text-green-600' : 'text-red-600';
            return (
                <tr
                key= { category.id }
            className = "border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
            onClick = {() => onCategorySelect?.(category.id)
        }
              >
            <td className="p-3 text-sm font-medium text-gray-900" > { category.name } </td>
        < td className = "p-3 text-sm text-right text-gray-600" >
        { category.planThisMonth.toLocaleString('ru-RU') } ₽
            </td>
            < td className = "p-3 text-sm text-right text-gray-600" >
            { category.factThisMonth.toLocaleString('ru-RU') } ₽
            </td>
            < td className = {`p-3 text-sm text-right font-medium ${deviationColor}`}>
                { deviation >= 0 ? '+' : ''
} { deviation }%
    </td>
    </tr>
            );
          })}
</tbody>
    </table>
    </Card>
  );
}

// ============================================
// SubcategoryDashboard
// ============================================

interface SubcategoryDashboardProps {
    categoryId: string;
    categoryName?: string;
    onBack?: () => void;
}

export function SubcategoryDashboard({ categoryId, categoryName, onBack }: SubcategoryDashboardProps) {
    const [subcategories, setSubcategories] = useState<Category['subcategories']>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        async function load() {
            const data = await getSubcategories(categoryId);
            setSubcategories(data);
            setLoading(false);
        }
        load();
    }, [categoryId]);

    const handleEditPlan = (id: string, currentPlan: number) => {
        setEditingId(id);
        setEditValue(currentPlan.toString());
    };

    const handleSavePlan = async (subcategoryId: string) => {
        await updatePlan(categoryId, subcategoryId, new Date().toISOString().slice(0, 7), Number(editValue));
        setEditingId(null);
    };

    if (loading) {
        return <div className="p-4 text-gray-500" > Загрузка...</div>;
    }

    return (
        <Card padding= "none" >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between" >
            <div className="flex items-center gap-2" >
                { onBack && (
                    <Button variant="ghost" size = "sm" onClick = { onBack } >
              ← Назад
        </Button>
          )
}
<h2 className="font-semibold text-gray-900" >
    { categoryName || 'Подкатегории'}
</h2>
    </div>
    </div>
    < table className = "w-full" >
        <thead className="bg-gray-50" >
            <tr>
            <th className="text-left p-3 text-sm font-medium text-gray-600" > Название </th>
                < th className = "text-right p-3 text-sm font-medium text-gray-600" > План </th>
                    < th className = "text-right p-3 text-sm font-medium text-gray-600" > Факт </th>
                        < th className = "text-right p-3 text-sm font-medium text-gray-600" > Отклонение </th>
                            < th className = "text-center p-3 text-sm font-medium text-gray-600" > Действия </th>
                                </tr>
                                </thead>
                                <tbody>
{
    subcategories.map((sub) => {
        const deviation = calculateDeviation(sub.planThisMonth, sub.factThisMonth);
        const deviationColor = deviation >= 0 ? 'text-green-600' : 'text-red-600';
        const isEditing = editingId === sub.id;
        return (
            <tr key= { sub.id } className = "border-t border-gray-100" >
                <td className="p-3 text-sm font-medium text-gray-900" > { sub.name } </td>
                    < td className = "p-3 text-sm text-right text-gray-600" >
                        {
                            isEditing?(
                    <Input
                      type = "number"
                      value = { editValue }
                      onChange = {(e) => setEditValue(e.target.value)
    }
                      className = "w-32 text-right"
        />
                  ) : (
        `${sub.planThisMonth.toLocaleString('ru-RU')} ₽`
    )
}
</td>
    < td className = "p-3 text-sm text-right text-gray-600" >
        { sub.factThisMonth.toLocaleString('ru-RU') } ₽
</td>
    < td className = {`p-3 text-sm text-right font-medium ${deviationColor}`}>
        { deviation >= 0 ? '+' : ''}{ deviation }%
            </td>
            < td className = "p-3 text-center" >
                {
                    isEditing?(
                    <Button size = "sm" onClick = {() => handleSavePlan(sub.id)}>
    Сохранить
    </Button>
                  ) : (
    <Button variant= "secondary" size = "sm" onClick = {() => handleEditPlan(sub.id, sub.planThisMonth)}>
        Редактировать план
            </Button>
                  )}
</td>
    </tr>
            );
          })}
</tbody>
    </table>
    </Card>
  );
}

// ============================================
// TopProductsTable
// ============================================

interface TopProductsTableProps {
    limit?: number;
}

export function TopProductsTable({ limit = 20 }: TopProductsTableProps) {
    const [products, setProducts] = useState<TopProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await getTopProducts(limit);
            setProducts(data);
            setLoading(false);
        }
        load();
    }, [limit]);

    if (loading) {
        return <div className="p-4 text-gray-500" > Загрузка...</div>;
    }

    const getStockStatusStyle = (status: TopProduct['stockStatus']) => {
        switch (status) {
            case 'in_stock': return 'bg-green-100 text-green-700';
            case 'low_stock': return 'bg-yellow-100 text-yellow-700';
            case 'out_of_stock': return 'bg-red-100 text-red-700';
        }
    };

    return (
        <Card padding= "none" >
        <div className="p-4 border-b border-gray-100" >
            <h2 className="font-semibold text-gray-900" > ТОП - { limit } товаров </h2>
                </div>
                < table className = "w-full" >
                    <thead className="bg-gray-50" >
                        <tr>
                        <th className="text-left p-3 text-sm font-medium text-gray-600" > SKU </th>
                            < th className = "text-left p-3 text-sm font-medium text-gray-600" > Название </th>
                                < th className = "text-right p-3 text-sm font-medium text-gray-600" > Продажи </th>
                                    < th className = "text-right p-3 text-sm font-medium text-gray-600" > Прибыль </th>
                                        < th className = "text-center p-3 text-sm font-medium text-gray-600" > Статус запасов </th>
                                            </tr>
                                            </thead>
                                            <tbody>
    {
        products.map((product, index) => (
            <tr key= { product.id } className = "border-t border-gray-100 hover:bg-gray-50" >
            <td className="p-3 text-sm text-gray-500" > { product.sku } </td>
        < td className = "p-3 text-sm font-medium text-gray-900" >
        <span className="text-gray-400 mr-2" > { index + 1}.</span>
    { product.name }
    </td>
        < td className = "p-3 text-sm text-right text-gray-600" >
            { product.sales.toLocaleString('ru-RU') } шт
                </td>
                < td className = "p-3 text-sm text-right text-gray-600" >
                    { product.profit.toLocaleString('ru-RU') } ₽
    </td>
        < td className = "p-3 text-center" >
            <span className={ `px-2 py-1 rounded-full text-xs font-medium ${getStockStatusStyle(product.stockStatus)}` }>
                { STOCK_STATUS_LABELS[product.stockStatus]}
                </span>
                </td>
                </tr>
          ))
}
</tbody>
    </table>
    </Card>
  );
}

// ============================================
// PlanFactChart
// ============================================

interface PlanFactChartProps {
    categoryId?: string;
}

export function PlanFactChart({ categoryId }: PlanFactChartProps) {
    const [data, setData] = useState<PlanValue[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const history = await getPlanFactHistory(categoryId);
            setData(history);
            setLoading(false);
        }
        load();
    }, [categoryId]);

    if (loading) {
        return <div className="p-4 text-gray-500" > Загрузка...</div>;
    }

    // Find max value for scaling
    const maxValue = Math.max(...data.flatMap(d => [d.plan, d.fact]));

    return (
        <Card>
        <div className= "mb-4" >
        <h2 className="font-semibold text-gray-900" > План / Факт по месяцам </h2>
            </div>

    {/* Simple bar chart visualization */ }
    <div className="space-y-3" >
        {
            data.map((item) => (
                <div key= { item.month } className = "flex items-center gap-3" >
                <div className="w-20 text-sm text-gray-500" > { item.month } </div>
            < div className = "flex-1 space-y-1" >
            {/* Plan bar */ }
            < div className = "flex items-center gap-2" >
            <div className="w-12 text-xs text-gray-400" > План </div>
            < div className = "flex-1 h-4 bg-gray-100 rounded overflow-hidden" >
            <div
                    className="h-full bg-blue-400 rounded"
                    style = {{ width: `${(item.plan / maxValue) * 100}%` }}
        />
        </div>
        < div className = "w-24 text-xs text-right text-gray-500" >
            {(item.plan / 1000000).toFixed(1)
} M ₽
</div>
    </div>
{/* Fact bar */ }
<div className="flex items-center gap-2" >
    <div className="w-12 text-xs text-gray-400" > Факт </div>
        < div className = "flex-1 h-4 bg-gray-100 rounded overflow-hidden" >
            <div
                    className={ `h-full rounded ${item.fact >= item.plan ? 'bg-green-400' : 'bg-red-400'}` }
style = {{ width: `${(item.fact / maxValue) * 100}%` }}
                  />
    </div>
    < div className = "w-24 text-xs text-right text-gray-500" >
        {(item.fact / 1000000).toFixed(1)}M ₽
</div>
    </div>
    </div>
    </div>
        ))}
</div>

{/* Legend */ }
<div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-xs" >
    <div className="flex items-center gap-1" >
        <div className="w-3 h-3 rounded bg-blue-400" />
            <span className="text-gray-500" > План </span>
                </div>
                < div className = "flex items-center gap-1" >
                    <div className="w-3 h-3 rounded bg-green-400" />
                        <span className="text-gray-500" > Факт ≥ План </span>
                            </div>
                            < div className = "flex items-center gap-1" >
                                <div className="w-3 h-3 rounded bg-red-400" />
                                    <span className="text-gray-500" > Факт & lt; План </span>
                                        </div>
                                        </div>
                                        </Card>
  );
}
