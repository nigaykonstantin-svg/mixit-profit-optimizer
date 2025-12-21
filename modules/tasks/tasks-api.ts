'use client';

import { Task, TASK_STATUSES } from '@/modules/tasks/task-model';

const TASKS_KEY = 'mixit_tasks';

// Demo tasks for initial state
const DEMO_TASKS: Task[] = [
    {
        id: '1',
        type: 'prices',
        title: 'Обновить цены на категорию Лицо',
        description: 'Пересмотреть цены по сезону',
        executor: 'dasha',
        status: TASK_STATUSES.NEW,
        createdAt: new Date().toISOString(),
        category: 'Лицо',
    },
    {
        id: '2',
        type: 'advertising',
        title: 'Настроить рекламу новой коллекции',
        executor: 'galina',
        status: TASK_STATUSES.IN_PROGRESS,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        category: 'Макияж',
    },
    {
        id: '3',
        type: 'seo',
        title: 'Оптимизация карточек Волосы',
        executor: 'nastya',
        status: TASK_STATUSES.DONE,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        category: 'Волосы',
    },
    {
        id: '4',
        type: 'competitors',
        title: 'Анализ конкурентов Q4',
        executor: 'arina',
        status: TASK_STATUSES.NEW,
        createdAt: new Date().toISOString(),
    },
];

export function getTasks(): Task[] {
    if (typeof window === 'undefined') return DEMO_TASKS;

    const stored = localStorage.getItem(TASKS_KEY);
    if (!stored) {
        localStorage.setItem(TASKS_KEY, JSON.stringify(DEMO_TASKS));
        return DEMO_TASKS;
    }

    try {
        return JSON.parse(stored) as Task[];
    } catch {
        return DEMO_TASKS;
    }
}

export function saveTasks(tasks: Task[]): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    }
}

export function addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const tasks = getTasks();
    const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    saveTasks(tasks);
    return newTask;
}

export function updateTaskStatus(taskId: string, status: Task['status']): void {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = status;
        saveTasks(tasks);
    }
}

export function deleteTask(taskId: string): void {
    const tasks = getTasks().filter(t => t.id !== taskId);
    saveTasks(tasks);
}
