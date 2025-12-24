'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, AuthUser } from '@/modules/auth';
import { getTasks, TaskCard, QuickTask, Task, TASK_STATUSES, TaskStatus } from '@/modules/tasks';
import { USERS, UserId, getExecutors, USER_ROLES } from '@/modules/users';
import { LogOut, Filter, Clock, Play, CheckCircle2, LayoutGrid, Settings, Upload, TrendingDown, Columns3, Table, List, RefreshCw } from 'lucide-react';

interface CategoryData {
    id: string;
    name: string;
    icon: string;
    revenue: number;
    orders: number;
    avgCr: number;
    lowStock: number;
    needsPriceDown: number;
    critical: { sku: string; reason: string }[];
    warning: { sku: string; reason: string }[];
    recommendations: { sku: string; action: string }[];
}

interface DashboardData {
    categories: CategoryData[];
    totals: {
        revenue: number;
        orders: number;
        views: number;
        clicks: number;
        skuCount: number;
    };
}

const STATUS_TABS: { id: TaskStatus | 'all'; label: string; icon: typeof Clock }[] = [
    { id: 'all', label: 'Все', icon: Filter },
    { id: TASK_STATUSES.NEW, label: 'Ожидают', icon: Clock },
    { id: TASK_STATUSES.IN_PROGRESS, label: 'В работе', icon: Play },
    { id: TASK_STATUSES.DONE, label: 'Готово', icon: CheckCircle2 },
];

export default function LeaderDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
    const [executorFilter, setExecutorFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
    const [mounted, setMounted] = useState(false);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshTasks = useCallback(() => {
        setTasks(getTasks());
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard');
            const data = await res.json();
            setDashboardData(data);
            // Set first category as default if not set
            if (!categoryFilter && data.categories?.length > 0) {
                setCategoryFilter(data.categories[0].id);
            }
        } catch (e) {
            console.error('Failed to fetch dashboard data:', e);
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
        refreshTasks();
        fetchDashboardData();
    }, [router, refreshTasks]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const filteredTasks = tasks.filter((task) => {
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;
        if (executorFilter !== 'all' && task.executor !== executorFilter) return false;
        return true;
    });

    const executors = getExecutors();

    // Stats
    const stats = {
        pending: tasks.filter((t) => t.status === TASK_STATUSES.NEW).length,
        in_progress: tasks.filter((t) => t.status === TASK_STATUSES.IN_PROGRESS).length,
        done: tasks.filter((t) => t.status === TASK_STATUSES.DONE).length,
    };

    if (!mounted || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{user.avatar}</span>
                        <div>
                            <h1 className="font-semibold text-gray-900">{user.name}</h1>
                            <p className="text-sm text-gray-500">Руководитель</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push('/leader/funnel')}
                            className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                        >
                            <TrendingDown size={18} />
                            Воронка
                        </button>
                        <button
                            onClick={() => router.push('/leader/import')}
                            className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                        >
                            <Upload size={18} />
                            Импорт
                        </button>
                        <button
                            onClick={() => router.push('/leader/config')}
                            className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                        >
                            <Settings size={18} />
                            Настройки
                        </button>
                        <button
                            onClick={() => router.push('/categories')}
                            className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                        >
                            <LayoutGrid size={18} />
                            Категории
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                {/* Category Tabs */}
                <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100 flex gap-1">
                    {loading ? (
                        <div className="flex-1 py-4 text-center text-gray-400">Загрузка...</div>
                    ) : (
                        dashboardData?.categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setCategoryFilter(cat.id)}
                                className={`flex-1 py-3 px-4 rounded-xl transition-all cursor-pointer ${categoryFilter === cat.id
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-xl">{cat.icon}</span>
                                    <span className="font-medium">{cat.name}</span>
                                </div>
                                <div className={`text-sm mt-1 ${categoryFilter === cat.id ? 'text-purple-200' : 'text-gray-400'}`}>
                                    {(cat.revenue / 1000000).toFixed(1)}M ₽ • {cat.orders.toLocaleString()} заказов
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Category Stats */}
                {(() => {
                    const selectedCat = dashboardData?.categories.find(c => c.id === categoryFilter);
                    if (!selectedCat) return null;
                    return (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className="text-3xl font-bold text-gray-900">{(selectedCat.revenue / 1000000).toFixed(1)}M ₽</div>
                                    <div className="text-sm text-gray-500 mt-1">Выручка категории</div>
                                </div>
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className="text-3xl font-bold text-gray-900">{(selectedCat.avgCr * 100).toFixed(2)}%</div>
                                    <div className="text-sm text-gray-500 mt-1">Средний CR</div>
                                </div>
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className={`text-3xl font-bold ${selectedCat.lowStock > 10 ? 'text-red-600' : 'text-gray-900'}`}>{selectedCat.lowStock}</div>
                                    <div className="text-sm text-gray-500 mt-1">Мало стока</div>
                                    <div className="text-xs text-gray-400 mt-2">SKU с остатком &lt;20</div>
                                </div>
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                    <div className={`text-3xl font-bold ${selectedCat.needsPriceDown > 10 ? 'text-orange-600' : 'text-gray-900'}`}>{selectedCat.needsPriceDown}</div>
                                    <div className="text-sm text-gray-500 mt-1">Нужно снизить цену</div>
                                    <div className="text-xs text-gray-400 mt-2">Низкий CR при высоком CTR</div>
                                </div>
                            </div>

                            {/* Action Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span className="font-medium text-red-900">Критично</span>
                                        <span className="text-sm text-red-600 ml-auto">{selectedCat.critical.length} SKU</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        {selectedCat.critical.slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex justify-between text-red-800">
                                                <span>{item.sku}</span>
                                                <span>{item.reason}</span>
                                            </div>
                                        ))}
                                        {selectedCat.critical.length === 0 && (
                                            <div className="text-red-400">Нет критичных SKU</div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                        <span className="font-medium text-yellow-900">Требует внимания</span>
                                        <span className="text-sm text-yellow-600 ml-auto">{selectedCat.warning.length} SKU</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        {selectedCat.warning.slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex justify-between text-yellow-800">
                                                <span>{item.sku}</span>
                                                <span>{item.reason}</span>
                                            </div>
                                        ))}
                                        {selectedCat.warning.length === 0 && (
                                            <div className="text-yellow-400">Нет предупреждений</div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="font-medium text-green-900">Рекомендации</span>
                                        <span className="text-sm text-green-600 ml-auto">{selectedCat.recommendations.length} SKU</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        {selectedCat.recommendations.slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex justify-between text-green-800">
                                                <span>{item.sku}</span>
                                                <span>{item.action}</span>
                                            </div>
                                        ))}
                                        {selectedCat.recommendations.length === 0 && (
                                            <div className="text-green-400">Нет рекомендаций</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    );
                })()}

                {/* Task Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Clock className="text-yellow-600" size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                                <p className="text-sm text-gray-500">Ожидают</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Play className="text-blue-600" size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.in_progress}</p>
                                <p className="text-sm text-gray-500">В работе</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <CheckCircle2 className="text-green-600" size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.done}</p>
                                <p className="text-sm text-gray-500">Готово</p>
                            </div>
                        </div>
                    </div>
                </div >

                {/* Quick Task */}
                < QuickTask onTaskAdded={refreshTasks} />

                {/* Filters */}
                < div className="space-y-3" >
                    {/* Status Filter */}
                    < div className="flex gap-2 overflow-x-auto pb-2" >
                        {
                            STATUS_TABS.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setStatusFilter(tab.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all ${statusFilter === tab.id
                                            ? 'bg-gray-900 text-white'
                                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        {tab.label}
                                    </button>
                                );
                            })
                        }
                    </div >

                    {/* Executor Filter */}
                    < div className="flex gap-2 overflow-x-auto pb-2" >
                        <button
                            onClick={() => setExecutorFilter('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${executorFilter === 'all'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            Все исполнители
                        </button>
                        {
                            executors.map((executor) => (
                                <button
                                    key={executor.id}
                                    onClick={() => setExecutorFilter(executor.id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all ${executorFilter === executor.id
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    <span>{executor.avatar}</span>
                                    {executor.name}
                                </button>
                            ))
                        }
                    </div >
                </div >

                {/* View Toggle */}
                < div className="flex items-center justify-between" >
                    <h2 className="font-semibold text-gray-900">Задачи</h2>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Columns3 size={16} />
                            Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Table size={16} />
                            Таблица
                        </button>
                    </div>
                </div >

                {/* Kanban View */}
                {
                    viewMode === 'kanban' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Pending Column */}
                            <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="text-yellow-600" size={18} />
                                    <span className="font-medium text-yellow-900">Ожидают</span>
                                    <span className="text-sm text-yellow-600 ml-auto">{tasks.filter(t => t.status === TASK_STATUSES.NEW).length}</span>
                                </div>
                                <div className="space-y-3">
                                    {tasks.filter(t => t.status === TASK_STATUSES.NEW).map(task => (
                                        <TaskCard key={task.id} task={task} isLeader onStatusChange={refreshTasks} />
                                    ))}
                                </div>
                            </div>
                            {/* In Progress Column */}
                            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <Play className="text-blue-600" size={18} />
                                    <span className="font-medium text-blue-900">В работе</span>
                                    <span className="text-sm text-blue-600 ml-auto">{tasks.filter(t => t.status === TASK_STATUSES.IN_PROGRESS).length}</span>
                                </div>
                                <div className="space-y-3">
                                    {tasks.filter(t => t.status === TASK_STATUSES.IN_PROGRESS).map(task => (
                                        <TaskCard key={task.id} task={task} isLeader onStatusChange={refreshTasks} />
                                    ))}
                                </div>
                            </div>
                            {/* Done Column */}
                            <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <CheckCircle2 className="text-green-600" size={18} />
                                    <span className="font-medium text-green-900">Готово</span>
                                    <span className="text-sm text-green-600 ml-auto">{tasks.filter(t => t.status === TASK_STATUSES.DONE).length}</span>
                                </div>
                                <div className="space-y-3">
                                    {tasks.filter(t => t.status === TASK_STATUSES.DONE).map(task => (
                                        <TaskCard key={task.id} task={task} isLeader onStatusChange={refreshTasks} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Table View */}
                {
                    viewMode === 'table' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Задача</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Тип</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Исполнитель</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Категория</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600">Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map(task => (
                                        <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium text-gray-900">{task.title}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.type === 'advertising' ? 'bg-red-100 text-red-700' :
                                                    task.type === 'retention' ? 'bg-yellow-100 text-yellow-700' :
                                                        task.type === 'seo' ? 'bg-blue-100 text-blue-700' :
                                                            task.type === 'prices' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {task.type === 'advertising' ? 'Реклама' :
                                                        task.type === 'retention' ? 'Удержание' :
                                                            task.type === 'seo' ? 'SEO' :
                                                                task.type === 'prices' ? 'Цены' :
                                                                    task.type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span>{USERS[task.executor as UserId]?.avatar}</span>
                                                    <span className="text-gray-600">{USERS[task.executor as UserId]?.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">{task.category || '—'}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === TASK_STATUSES.NEW ? 'bg-yellow-100 text-yellow-700' :
                                                    task.status === TASK_STATUSES.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {task.status === TASK_STATUSES.NEW ? 'Ожидает' : task.status === TASK_STATUSES.IN_PROGRESS ? 'В работе' : 'Готово'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {tasks.length === 0 && (
                                <div className="text-center py-12 text-gray-500">Нет задач</div>
                            )}
                        </div>
                    )
                }

                {
                    filteredTasks.length === 0 && viewMode !== 'kanban' && viewMode !== 'table' && (
                        <div className="text-center py-12 text-gray-500">
                            Нет задач по выбранным фильтрам
                        </div>
                    )
                }
            </main >
        </div >
    );
}
