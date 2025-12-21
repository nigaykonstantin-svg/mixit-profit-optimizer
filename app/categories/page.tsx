'use client';

import { useState } from 'react';
import { CategoryDashboard, SubcategoryDashboard, TopProductsTable, PlanFactChart } from '@/modules/categories';
import { Button } from '@/modules/shared';

export default function CategoriesPage() {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [categoryName, setCategoryName] = useState<string>('');

    const handleCategorySelect = (categoryId: string) => {
        const names: Record<string, string> = {
            '1': 'Лицо',
            '2': 'Волосы',
            '3': 'Макияж',
            '4': 'Тело',
        };
        setSelectedCategory(categoryId);
        setCategoryName(names[categoryId] || '');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
                    <Button variant="secondary" onClick={() => window.location.href = '/leader'}>
                        ← На главную
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Categories or Subcategories */}
                    <div>
                        {selectedCategory ? (
                            <SubcategoryDashboard
                                categoryId={selectedCategory}
                                categoryName={categoryName}
                                onBack={() => setSelectedCategory(null)}
                            />
                        ) : (
                            <CategoryDashboard onCategorySelect={handleCategorySelect} />
                        )}
                    </div>

                    {/* Plan/Fact Chart */}
                    <div>
                        <PlanFactChart categoryId={selectedCategory || undefined} />
                    </div>
                </div>

                {/* Top Products */}
                <TopProductsTable limit={20} />
            </div>
        </div>
    );
}
