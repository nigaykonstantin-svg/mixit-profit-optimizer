// Task types with auto-assigned executors
export const TASK_TYPES = {
    'prices': { label: 'Цены, СПП, Акции', executor: 'dasha', color: 'bg-blue-500' },
    'advertising': { label: 'Реклама', executor: 'galina', color: 'bg-purple-500' },
    'promo': { label: 'Промо', executor: 'dasha', color: 'bg-green-500' },
    'seo': { label: 'SEO', executor: 'nastya', color: 'bg-yellow-500' },
    'retention': { label: 'Удержания', executor: 'yana', color: 'bg-red-500' },
    'stocks': { label: 'Стоки', executor: 'nastya', color: 'bg-orange-500' },
    'competitors': { label: 'Отчет по конкурентам', executor: 'arina', color: 'bg-pink-500' },
    'indipa': { label: 'Акции в Индипа', executor: 'galina', color: 'bg-indigo-500' },
} as const;

export type TaskType = keyof typeof TASK_TYPES;

export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface Task {
    id: string;
    type: TaskType;
    title: string;
    description?: string;
    executor: string;
    status: TaskStatus;
    createdAt: string;
    deadline?: string;
    category?: string;
}

// Users data
export const USERS = {
    veronika: { name: 'Вероника', role: 'leader', avatar: '👩‍💼' },
    dasha: { name: 'Даша', role: 'executor', avatar: '👩‍💻' },
    galina: { name: 'Галина', role: 'executor', avatar: '👩‍🎨' },
    nastya: { name: 'Настя', role: 'executor', avatar: '👩‍🔬' },
    yana: { name: 'Яна', role: 'executor', avatar: '👩‍🏫' },
    arina: { name: 'Арина', role: 'executor', avatar: '👩‍✈️' },
} as const;

export type UserId = keyof typeof USERS;

// Categories
export const CATEGORIES = ['Лицо', 'Волосы', 'Макияж', 'Тело'] as const;

// Demo tasks
export const DEMO_TASKS: Task[] = [
    {
        id: '1',
        type: 'prices',
        title: 'Обновить цены на категорию Лицо',
        description: 'Пересмотреть цены по сезону',
        executor: 'dasha',
        status: 'pending',
        createdAt: new Date().toISOString(),
        category: 'Лицо',
    },
    {
        id: '2',
        type: 'advertising',
        title: 'Настроить рекламу новой коллекции',
        executor: 'galina',
        status: 'in_progress',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        category: 'Макияж',
    },
    {
        id: '3',
        type: 'seo',
        title: 'Оптимизация карточек Волосы',
        executor: 'nastya',
        status: 'done',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        category: 'Волосы',
    },
    {
        id: '4',
        type: 'competitors',
        title: 'Анализ конкурентов Q4',
        executor: 'arina',
        status: 'pending',
        createdAt: new Date().toISOString(),
    },
];
