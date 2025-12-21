'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, AuthUser } from '@/modules/auth';
import { getTasks, TaskCard, QuickTask, Task, TASK_STATUSES, TaskStatus } from '@/modules/tasks';
import { USERS, UserId, getExecutors, USER_ROLES } from '@/modules/users';
import { LogOut, Filter, Clock, Play, CheckCircle2 } from 'lucide-react';

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
    const [mounted, setMounted] = useState(false);

    const refreshTasks = useCallback(() => {
        setTasks(getTasks());
    }, []);

    useEffect(() => {
        setMounted(true);
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== USER_ROLES.LEADER) {
            router.push('/');
            return;
        }
        setUser(currentUser);
        refreshTasks();
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
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                {/* Stats */}
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
                </div>

                {/* Quick Task */}
                <QuickTask onTaskAdded={refreshTasks} />

                {/* Filters */}
                <div className="space-y-3">
                    {/* Status Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {STATUS_TABS.map((tab) => {
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
                        })}
                    </div>

                    {/* Executor Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setExecutorFilter('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${executorFilter === 'all'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            Все исполнители
                        </button>
                        {executors.map((executor) => (
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
                        ))}
                    </div>
                </div>

                {/* Tasks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            isLeader
                            onStatusChange={refreshTasks}
                        />
                    ))}
                </div>

                {filteredTasks.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        Нет задач по выбранным фильтрам
                    </div>
                )}
            </main>
        </div>
    );
}
