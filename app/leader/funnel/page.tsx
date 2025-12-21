'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, AuthUser } from '@/modules/auth';
import { USER_ROLES } from '@/modules/users';
import { Card, Button, Input } from '@/modules/shared';
import {
    ArrowLeft,
    TrendingDown,
    AlertTriangle,
    Eye,
    MousePointer,
    ShoppingCart,
    Package,
    Filter,
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { AnalyzedFunnelRow } from '@/modules/analytics/funnel-metrics';

// Mock data for demonstration (will be replaced with real data)
const MOCK_FUNNEL_DATA: AnalyzedFunnelRow[] = [
    { sku: '123456789', revenue: 450000, views: 15000, orders: 120, ctr: 3.2, cr_order: 0.8, revenue_per_view: 30, cpc: 375, conversion_quality: 'Normal', stock: 150, price: 3750, total_drr: 12 },
    { sku: '987654321', revenue: 280000, views: 22000, orders: 85, ctr: 2.8, cr_order: 0.4, revenue_per_view: 12.7, cpc: 127, conversion_quality: 'Overpriced', stock: 200, price: 3294, total_drr: 28 },
    { sku: '456789123', revenue: 95000, views: 8000, orders: 45, ctr: 4.1, cr_order: 0.6, revenue_per_view: 11.9, cpc: 290, conversion_quality: 'Low stock', stock: 8, price: 2111, total_drr: 15 },
    { sku: '111222333', revenue: 520000, views: 18000, orders: 150, ctr: 3.8, cr_order: 0.9, revenue_per_view: 28.9, cpc: 400, conversion_quality: 'Normal', stock: 280, price: 3467, total_drr: 10 },
    { sku: '444555666', revenue: 180000, views: 25000, orders: 60, ctr: 2.2, cr_order: 0.3, revenue_per_view: 7.2, cpc: 100, conversion_quality: 'Overpriced', stock: 320, price: 3000, total_drr: 35 },
    { sku: '777888999', revenue: 75000, views: 6000, orders: 30, ctr: 3.5, cr_order: 0.5, revenue_per_view: 12.5, cpc: 250, conversion_quality: 'Low stock', stock: 5, price: 2500, total_drr: 18 },
];

type QualityFilter = 'all' | 'normal' | 'low_stock' | 'overpriced' | 'high_drr';
type SortField = 'sku' | 'revenue' | 'views' | 'orders' | 'ctr' | 'cr_order' | 'total_drr' | 'stock';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 100;

export default function FunnelPage() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [mounted, setMounted] = useState(false);
    const [data] = useState<AnalyzedFunnelRow[]>(MOCK_FUNNEL_DATA);

    // Pagination, search, filter, sort state
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<QualityFilter>('all');
    const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'revenue', dir: 'desc' });

    useEffect(() => {
        setMounted(true);
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== USER_ROLES.LEADER) {
            router.push('/');
            return;
        }
        setUser(currentUser);
    }, [router]);

    // Filtered, sorted, paginated data
    const processedData = useMemo(() => {
        let result = [...data];

        // Search by SKU
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            result = result.filter(row => row.sku.toLowerCase().includes(searchLower));
        }

        // Filter by threshold
        result = result.filter(row => {
            if (filter === 'low_stock') return row.stock < 20;
            if (filter === 'overpriced') return row.cr_order < 0.5;
            if (filter === 'high_drr') return row.total_drr > 20;
            if (filter === 'normal') return row.conversion_quality === 'Normal';
            return true; // 'all'
        });

        // Sort
        result.sort((a, b) => {
            const x = a[sort.field] as number;
            const y = b[sort.field] as number;
            return sort.dir === 'asc' ? x - y : y - x;
        });

        return result;
    }, [data, filter, search, sort]);

    // Pagination
    const totalPages = Math.ceil(processedData.length / PAGE_SIZE);
    const paginatedData = processedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Reset page on filter/search change
    useEffect(() => {
        setPage(1);
    }, [filter, search]);

    const handleSort = (field: SortField) => {
        setSort(prev => ({
            field,
            dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc',
        }));
    };

    const getSortIcon = (field: SortField) => {
        if (sort.field !== field) return <ArrowUpDown size={14} className="text-gray-400" />;
        return sort.dir === 'desc' ? <ArrowDown size={14} className="text-purple-600" /> : <ArrowUp size={14} className="text-purple-600" />;
    };

    const stats = {
        totalRevenue: data.reduce((sum, row) => sum + row.revenue, 0),
        totalOrders: data.reduce((sum, row) => sum + row.orders, 0),
        totalViews: data.reduce((sum, row) => sum + row.views, 0),
        avgDrr: data.length > 0 ? data.reduce((sum, row) => sum + row.total_drr, 0) / data.length : 0,
        overpriced: data.filter(r => r.conversion_quality === 'Overpriced').length,
        lowStock: data.filter(r => r.conversion_quality === 'Low stock').length,
    };

    const getQualityColor = (quality: string) => {
        switch (quality) {
            case 'Overpriced': return 'bg-orange-100 text-orange-700';
            case 'Low stock': return 'bg-red-100 text-red-700';
            default: return 'bg-green-100 text-green-700';
        }
    };

    if (!mounted || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/leader')}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <TrendingDown className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="font-semibold text-gray-900">Воронка продаж</h1>
                            <p className="text-sm text-gray-500">Анализ конверсии WB</p>
                        </div>
                    </div>
                    <Button onClick={() => router.push('/leader/import')}>
                        Импорт данных
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <Card className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{(stats.totalRevenue / 1000000).toFixed(2)}M ₽</div>
                        <div className="text-sm text-gray-500">Выручка</div>
                    </Card>
                    <Card className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Заказов</div>
                    </Card>
                    <Card className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{(stats.totalViews / 1000).toFixed(1)}K</div>
                        <div className="text-sm text-gray-500">Просмотров</div>
                    </Card>
                    <Card className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.avgDrr.toFixed(1)}%</div>
                        <div className="text-sm text-gray-500">Сред. ДРР</div>
                    </Card>
                    <Card className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{stats.overpriced}</div>
                        <div className="text-sm text-gray-500">Переоценены</div>
                    </Card>
                    <Card className="text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
                        <div className="text-sm text-gray-500">Мало стока</div>
                    </Card>
                </div>

                {/* Funnel Visualization */}
                <Card>
                    <h2 className="font-semibold text-gray-900 mb-4">Общая воронка</h2>
                    <div className="flex items-end justify-between gap-4 h-40">
                        <div className="flex-1 flex flex-col items-center">
                            <div className="w-full bg-blue-500 rounded-t-lg" style={{ height: '100%' }} />
                            <Eye className="mt-2 text-blue-500" size={20} />
                            <div className="text-sm font-medium mt-1">{(stats.totalViews / 1000).toFixed(0)}K</div>
                            <div className="text-xs text-gray-500">Показы</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                            <div className="w-full bg-purple-500 rounded-t-lg" style={{ height: '60%' }} />
                            <MousePointer className="mt-2 text-purple-500" size={20} />
                            <div className="text-sm font-medium mt-1">{(stats.totalViews * 0.03 / 1000).toFixed(1)}K</div>
                            <div className="text-xs text-gray-500">Клики</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                            <div className="w-full bg-amber-500 rounded-t-lg" style={{ height: '25%' }} />
                            <ShoppingCart className="mt-2 text-amber-500" size={20} />
                            <div className="text-sm font-medium mt-1">{(stats.totalOrders * 1.5).toFixed(0)}</div>
                            <div className="text-xs text-gray-500">Корзина</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                            <div className="w-full bg-green-500 rounded-t-lg" style={{ height: '12%' }} />
                            <Package className="mt-2 text-green-500" size={20} />
                            <div className="text-sm font-medium mt-1">{stats.totalOrders}</div>
                            <div className="text-xs text-gray-500">Заказы</div>
                        </div>
                    </div>
                </Card>

                {/* Search & Filter */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-gray-400" />
                        <div className="flex gap-2 flex-wrap">
                            {([
                                { id: 'all', label: 'Все' },
                                { id: 'normal', label: 'Норма' },
                                { id: 'low_stock', label: 'Мало стока' },
                                { id: 'overpriced', label: 'Низкий CR' },
                                { id: 'high_drr', label: 'Высокий ДРР' },
                            ] as { id: QualityFilter; label: string }[]).map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === f.id
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Поиск по SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* SKU Table */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-900">SKU анализ</h2>
                        <div className="text-sm text-gray-500">
                            Показано {paginatedData.length} из {processedData.length}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('sku')}>
                                        <div className="flex items-center gap-1">SKU {getSortIcon('sku')}</div>
                                    </th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('revenue')}>
                                        <div className="flex items-center justify-end gap-1">Выручка {getSortIcon('revenue')}</div>
                                    </th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('views')}>
                                        <div className="flex items-center justify-end gap-1">Просмотры {getSortIcon('views')}</div>
                                    </th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('orders')}>
                                        <div className="flex items-center justify-end gap-1">Заказы {getSortIcon('orders')}</div>
                                    </th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('ctr')}>
                                        <div className="flex items-center justify-end gap-1">CTR {getSortIcon('ctr')}</div>
                                    </th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('cr_order')}>
                                        <div className="flex items-center justify-end gap-1">CR {getSortIcon('cr_order')}</div>
                                    </th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('total_drr')}>
                                        <div className="flex items-center justify-end gap-1">ДРР {getSortIcon('total_drr')}</div>
                                    </th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('stock')}>
                                        <div className="flex items-center justify-end gap-1">Сток {getSortIcon('stock')}</div>
                                    </th>
                                    <th className="text-center py-3 px-2 font-medium text-gray-600">Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row) => (
                                    <tr key={row.sku} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-2 font-mono text-gray-900">{row.sku}</td>
                                        <td className="py-3 px-2 text-right font-medium">{(row.revenue / 1000).toFixed(0)}K ₽</td>
                                        <td className="py-3 px-2 text-right text-gray-600">{(row.views / 1000).toFixed(1)}K</td>
                                        <td className="py-3 px-2 text-right text-gray-600">{row.orders}</td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={row.ctr > 2 ? 'text-green-600' : 'text-gray-600'}>{row.ctr.toFixed(1)}%</span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={row.cr_order < 1 ? 'text-orange-600' : 'text-gray-600'}>{row.cr_order.toFixed(2)}%</span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={row.total_drr > 20 ? 'text-red-600 font-medium' : 'text-gray-600'}>{row.total_drr.toFixed(1)}%</span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={row.stock < 20 ? 'text-red-600 font-medium' : 'text-gray-600'}>{row.stock}</span>
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(row.conversion_quality)}`}>
                                                {row.conversion_quality === 'Normal' ? '✓' : row.conversion_quality === 'Overpriced' ? '↓' : '⚠'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {paginatedData.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            {search ? 'SKU не найден' : 'Нет данных. Импортируйте файл WB Funnel.'}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                            <div className="text-sm text-gray-500">
                                Страница {page} из {totalPages}
                            </div>
                            <div className="flex gap-1">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-all text-sm"
                                >
                                    Назад
                                </button>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i + 1)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${page === i + 1
                                                ? 'bg-gray-900 text-white'
                                                : 'border border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-all text-sm"
                                >
                                    Вперед
                                </button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Alerts */}
                {(stats.overpriced > 0 || stats.lowStock > 0) && (
                    <Card className="border-l-4 border-l-orange-500">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-orange-500 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-semibold text-gray-900">Требуют внимания</h3>
                                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                                    {stats.overpriced > 0 && <li>• {stats.overpriced} SKU переоценены (CTR {'>'} 2%, CR {'<'} 1.5%)</li>}
                                    {stats.lowStock > 0 && <li>• {stats.lowStock} SKU с критически низким стоком ({'<'} 10 шт)</li>}
                                </ul>
                            </div>
                        </div>
                    </Card>
                )}
            </main>
        </div>
    );
}
