'use client';

import { Task, DEMO_TASKS } from './data';

const TASKS_KEY = 'mixit_tasks';

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
