'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, AuthUser } from '@/modules/auth';
import { getTasks, TaskCard, Task, TaskStatus, TASK_STATUSES } from '@/modules/tasks';
import { USER_ROLES } from '@/modules/users';
import { LogOut, Clock, Play, CheckCircle2 } from 'lucide-react';

const STATUS_TABS: { id: TaskStatus | 'all'; label: string; icon: typeof Clock; color: string }[] = [
    { id: 'all', label: 'Все', icon: Clock, color: 'bg-gray-100 text-gray-700' },
    { id: TASK_STATUSES.NEW, label: 'Новые', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
    { id: TASK_STATUSES.IN_PROGRESS, label: 'В работе', icon: Play, color: 'bg-blue-100 text-blue-700' },
    { id: TASK_STATUSES.DONE, label: 'Готово', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
];

export default function ExecutorDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>(TASK_STATUSES.NEW);
    const [mounted, setMounted] = useState(false);

    const refreshTasks = useCallback(() => {
        setTasks(getTasks());
    }, []);

    useEffect(() => {
        setMounted(true);
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== USER_ROLES.EXECUTOR) {
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

    // Filter tasks for current executor
    const myTasks = tasks.filter((task) => task.executor === user?.id);
    const filteredTasks = myTasks.filter((task) => {
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;
        return true;
    });

    // Stats
    const stats = {
        [TASK_STATUSES.NEW]: myTasks.filter((t) => t.status === TASK_STATUSES.NEW).length,
        [TASK_STATUSES.IN_PROGRESS]: myTasks.filter((t) => t.status === TASK_STATUSES.IN_PROGRESS).length,
        [TASK_STATUSES.DONE]: myTasks.filter((t) => t.status === TASK_STATUSES.DONE).length,
    };

    if (!mounted || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{user.avatar}</span>
                        <div>
                            <h1 className="font-semibold text-gray-900">{user.name}</h1>
                            <p className="text-sm text-gray-500">Исполнитель</p>
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

            <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-yellow-50 rounded-2xl p-4 text-center border border-yellow-100">
                        <p className="text-2xl font-bold text-yellow-700">{stats[TASK_STATUSES.NEW]}</p>
                        <p className="text-xs text-yellow-600">Новых</p>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
                        <p className="text-2xl font-bold text-blue-700">{stats[TASK_STATUSES.IN_PROGRESS]}</p>
                        <p className="text-xs text-blue-600">В работе</p>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
                        <p className="text-2xl font-bold text-green-700">{stats[TASK_STATUSES.DONE]}</p>
                        <p className="text-xs text-green-600">Готово</p>
                    </div>
                </div>

                {/* Status Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {STATUS_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = statusFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all ${isActive
                                        ? 'bg-gray-900 text-white shadow-lg'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                    }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                                {tab.id !== 'all' && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : 'bg-gray-100'
                                        }`}>
                                        {stats[tab.id as TaskStatus]}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tasks */}
                <div className="space-y-4">
                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            isLeader={false}
                            onStatusChange={refreshTasks}
                        />
                    ))}
                </div>

                {filteredTasks.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">🎉</div>
                        <p className="text-gray-500">
                            {statusFilter === TASK_STATUSES.NEW
                                ? 'Нет новых задач!'
                                : statusFilter === TASK_STATUSES.IN_PROGRESS
                                    ? 'Нет задач в работе'
                                    : 'Нет задач по выбранным фильтрам'}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
