'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, AuthUser } from '@/modules/auth';
import { USER_ROLES, getExecutors } from '@/modules/users';
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
    ArrowDown,
    Loader2,
    CheckSquare,
    Square,
    ListTodo,
    X,
    Download
} from 'lucide-react';
import { AnalyzedFunnelRow } from '@/modules/analytics/funnel-metrics';
import { getSkuCatalog } from '@/modules/import/sku-catalog';
import { setCategoryConfigCache } from '@/modules/pricing/price-config';

type QualityFilter = 'all' | 'normal' | 'low_stock' | 'overpriced' | 'high_drr';
type SortField = 'sku' | 'revenue' | 'views' | 'orders' | 'ctr' | 'cr_order' | 'total_drr' | 'stock';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 100;

function FunnelPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState<AnalyzedFunnelRow[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination, search, filter, sort state
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState(searchParams.get('sku') || '');
    const [filter, setFilter] = useState<QualityFilter>('all');
    const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'revenue', dir: 'desc' });

    // Selection state
    const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskAssignee, setTaskAssignee] = useState('');
    const [taskNote, setTaskNote] = useState('');

    // Column visibility state
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
        'sku', 'revenue', 'views', 'orders', 'ctr', 'cr_order', 'kp_pct',
        'drr_search', 'drr_media', 'drr_bloggers', 'stock', 'price_action', 'new_price', 'reason', 'ads_action', 'category'
    ]));

    const allColumns = [
        { id: 'sku', label: 'SKU', group: 'Основное' },
        { id: 'revenue', label: 'Выручка', group: 'Основное' },
        { id: 'views', label: 'Просмотры', group: 'Воронка' },
        { id: 'orders', label: 'Заказы', group: 'Воронка' },
        { id: 'ctr', label: 'CTR', group: 'Конверсия' },
        { id: 'cr_order', label: 'CR', group: 'Конверсия' },
        { id: 'kp_pct', label: 'КП%', group: 'Прибыль' },
        { id: 'drr_search', label: 'DRR Поиск', group: 'Реклама' },
        { id: 'drr_media', label: 'DRR Медиа', group: 'Реклама' },
        { id: 'drr_bloggers', label: 'DRR Блогеры', group: 'Реклама' },
        { id: 'drr_other', label: 'DRR Другое', group: 'Реклама' },
        { id: 'stock', label: 'Сток', group: 'Основное' },
        { id: 'price_action', label: 'Реком.', group: 'Действия' },
        { id: 'new_price', label: 'Новая цена', group: 'Действия' },
        { id: 'reason', label: 'Причина', group: 'Действия' },
        { id: 'ads_action', label: 'Реклама', group: 'Действия' },
        { id: 'category', label: 'Категория', group: 'Основное' },
        { id: 'avg_price', label: 'Ср. цена', group: 'Цены' },
        { id: 'client_price', label: 'Цена клиента', group: 'Цены' },
    ];

    const toggleColumn = (colId: string) => {
        const newSet = new Set(visibleColumns);
        if (newSet.has(colId)) {
            newSet.delete(colId);
        } else {
            newSet.add(colId);
        }
        setVisibleColumns(newSet);
    };

    // Fetch data from API
    const fetchData = async () => {
        setLoading(true);
        try {
            // Load category configs into cache first
            const configRes = await fetch('/api/config/categories');
            if (configRes.ok) {
                const configs = await configRes.json();
                setCategoryConfigCache(configs);
            }

            const res = await fetch('/api/funnel');
            const { rows } = await res.json();

            // Enrich with category data from local catalog
            const catalog = getSkuCatalog();
            const enrichedRows = (rows || []).map((row: AnalyzedFunnelRow) => {
                const catalogEntry = catalog.get(row.sku);
                return {
                    ...row,
                    category: catalogEntry?.category || row.category,
                    subcategory: catalogEntry?.subcategory || row.subcategory,
                };
            });

            setData(enrichedRows);
        } catch (error) {
            console.error('Failed to fetch funnel data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== USER_ROLES.LEADER) {
            router.push('/');
            return;
        }
        setUser(currentUser);
        fetchData();
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

    // Selection helpers
    const toggleSelectAll = () => {
        if (selectedSkus.size === paginatedData.length) {
            setSelectedSkus(new Set());
        } else {
            setSelectedSkus(new Set(paginatedData.map(r => r.sku)));
        }
    };

    const toggleSelectSku = (sku: string) => {
        const newSet = new Set(selectedSkus);
        if (newSet.has(sku)) {
            newSet.delete(sku);
        } else {
            newSet.add(sku);
        }
        setSelectedSkus(newSet);
    };

    const selectAllWithRecommendation = () => {
        const skusWithAction = paginatedData.filter(r => r.price_action && r.price_action !== 'HOLD').map(r => r.sku);
        setSelectedSkus(new Set(skusWithAction));
    };

    const clearSelection = () => setSelectedSkus(new Set());

    const handleCreateTasks = async () => {
        // TODO: integrate with task API
        const selectedRows = data.filter(r => selectedSkus.has(r.sku));
        console.log('Creating tasks for:', selectedRows);
        alert(`Создано ${selectedRows.length} задач для менеджера: ${taskAssignee || 'Не указан'}`);
        setShowTaskModal(false);
        clearSelection();
    };

    const exportSelectedCsv = () => {
        const selectedRows = data.filter(r => selectedSkus.has(r.sku));
        const headers = ['SKU', 'Выручка', 'Заказы', 'Сток', 'Рекомендация', 'Новая цена'];
        const rows = selectedRows.map(r => [
            r.sku, r.revenue, r.orders, r.stock, r.price_action || '-', r.recommended_price || '-'
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'selected_skus.csv';
        a.click();
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-600">
                    <Loader2 className="animate-spin" size={24} />
                    <span>Загрузка данных...</span>
                </div>
            </div>
        );
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
                    <div className="flex items-center gap-2">
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
                        <div className="relative">
                            <button
                                onClick={() => setShowColumnSelector(!showColumnSelector)}
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-all"
                            >
                                <Filter size={16} />
                                Колонки
                            </button>
                            {showColumnSelector && (
                                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-medium text-gray-900">Выбрать колонки</span>
                                        <button onClick={() => setShowColumnSelector(false)} className="text-gray-400 hover:text-gray-600">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto space-y-3">
                                        {['Основное', 'Воронка', 'Конверсия', 'Прибыль', 'Реклама', 'Цены', 'Действия'].map(group => (
                                            <div key={group}>
                                                <div className="text-xs text-gray-500 font-medium mb-1">{group}</div>
                                                <div className="space-y-1">
                                                    {allColumns.filter(c => c.group === group).map(col => (
                                                        <label key={col.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                            <input
                                                                type="checkbox"
                                                                checked={visibleColumns.has(col.id)}
                                                                onChange={() => toggleColumn(col.id)}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <span className="text-sm text-gray-700">{col.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bulk Actions Panel */}
                {selectedSkus.size > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="font-medium text-purple-900">{selectedSkus.size} SKU выбрано</span>
                            <button
                                onClick={selectAllWithRecommendation}
                                className="text-sm text-purple-600 hover:text-purple-800 underline"
                            >
                                Выбрать все с рекомендацией
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportSelectedCsv}
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-all"
                            >
                                <Download size={16} />
                                Экспорт CSV
                            </button>
                            <button
                                onClick={() => setShowTaskModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-all"
                            >
                                <ListTodo size={16} />
                                Создать задачи
                            </button>
                            <button
                                onClick={clearSelection}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

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
                                    <th className="py-3 px-2">
                                        <button onClick={toggleSelectAll} className="text-gray-500 hover:text-purple-600">
                                            {selectedSkus.size === paginatedData.length && paginatedData.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                                        </button>
                                    </th>
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
                                    <th className="text-right py-3 px-2 font-medium text-gray-600">КП%</th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600">DRR Поиск</th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600">DRR Медиа</th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600">DRR Блогеры</th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('stock')}>
                                        <div className="flex items-center justify-end gap-1">Сток {getSortIcon('stock')}</div>
                                    </th>
                                    <th className="text-center py-3 px-2 font-medium text-gray-600">Реком.</th>
                                    <th className="text-right py-3 px-2 font-medium text-gray-600">Новая цена</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-600">Причина</th>
                                    <th className="text-center py-3 px-2 font-medium text-gray-600">Реклама</th>
                                    <th className="text-left py-3 px-2 font-medium text-gray-600">Категория</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row) => (
                                    <tr key={row.sku} className={`border-b border-gray-100 hover:bg-gray-50 ${selectedSkus.has(row.sku) ? 'bg-purple-50' : ''}`}>
                                        <td className="py-3 px-2">
                                            <button onClick={() => toggleSelectSku(row.sku)} className="text-gray-500 hover:text-purple-600">
                                                {selectedSkus.has(row.sku) ? <CheckSquare size={18} className="text-purple-600" /> : <Square size={18} />}
                                            </button>
                                        </td>
                                        <td className="py-3 px-2 font-mono text-gray-900">{row.sku}</td>
                                        <td className="py-3 px-2 text-right font-medium">{(row.revenue / 1000).toFixed(0)}K ₽</td>
                                        <td className="py-3 px-2 text-right text-gray-600">{(row.views / 1000).toFixed(1)}K</td>
                                        <td className="py-3 px-2 text-right text-gray-600">{row.orders}</td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={row.ctr * 100 > 2 ? 'text-green-600' : 'text-gray-600'}>{(row.ctr * 100).toFixed(1)}%</span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={row.cr_order * 100 < 1 ? 'text-orange-600' : 'text-gray-600'}>{(row.cr_order * 100).toFixed(2)}%</span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={row.kp_pct > 0.25 ? 'text-green-600 font-medium' : row.kp_pct < 0.15 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                                {(row.kp_pct * 100).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={row.drr_search > 0.2 ? 'text-red-600 font-medium' : 'text-gray-600'}>{(row.drr_search * 100).toFixed(1)}%</span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={row.drr_media > 0.2 ? 'text-red-600 font-medium' : 'text-gray-600'}>{(row.drr_media * 100).toFixed(1)}%</span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={row.drr_bloggers > 0.2 ? 'text-red-600 font-medium' : 'text-gray-600'}>{(row.drr_bloggers * 100).toFixed(1)}%</span>
                                        </td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={row.stock < 20 ? 'text-red-600 font-medium' : 'text-gray-600'}>{row.stock}</span>
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.price_action === 'UP' ? 'bg-green-100 text-green-700' :
                                                row.price_action === 'DOWN' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {row.price_action === 'UP' ? '↑' : row.price_action === 'DOWN' ? '↓' : '—'} {row.price_step_pct ? `${(row.price_step_pct * 100).toFixed(0)}%` : ''}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-right text-gray-600">
                                            {row.recommended_price ? `${row.recommended_price.toLocaleString()} ₽` : '—'}
                                        </td>
                                        <td className="py-3 px-2 text-left text-xs text-gray-500 max-w-[120px] truncate" title={row.reason_text}>
                                            {row.reason_text || '—'}
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.ads_action === 'SCALE' ? 'bg-green-100 text-green-700' :
                                                row.ads_action === 'DOWN' ? 'bg-orange-100 text-orange-700' :
                                                    row.ads_action === 'PAUSE' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-500'
                                                }`}>
                                                {row.ads_action === 'SCALE' ? '↑ Масштаб' :
                                                    row.ads_action === 'DOWN' ? '↓ Снизить' :
                                                        row.ads_action === 'PAUSE' ? '⏸ Пауза' : '—'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-left text-xs">
                                            {row.category ? (
                                                <div>
                                                    <span className="text-gray-700">{row.category}</span>
                                                    {row.subcategory && (
                                                        <span className="text-gray-400 ml-1">/ {row.subcategory}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
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

            {/* Task Creation Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Создать задачи</h3>
                            <button onClick={() => setShowTaskModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Выбрано SKU</label>
                                <div className="text-2xl font-bold text-purple-600">{selectedSkus.size}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Менеджер</label>
                                <select
                                    value={taskAssignee}
                                    onChange={(e) => setTaskAssignee(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Выберите менеджера</option>
                                    {getExecutors().map(exec => (
                                        <option key={exec.id} value={exec.id}>{exec.avatar} {exec.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                                <textarea
                                    value={taskNote}
                                    onChange={(e) => setTaskNote(e.target.value)}
                                    placeholder="Инструкции для менеджера..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowTaskModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleCreateTasks}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                                >
                                    Создать {selectedSkus.size} задач
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function FunnelPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-600">
                    <Loader2 className="animate-spin" size={24} />
                    <span>Загрузка воронки...</span>
                </div>
            </div>
        }>
            <FunnelPageContent />
        </Suspense>
    );
}
