// Task status constants
export const TASK_STATUSES = {
    NEW: 'pending',
    IN_PROGRESS: 'in_progress',
    DONE: 'done',
} as const;

export type TaskStatus = typeof TASK_STATUSES[keyof typeof TASK_STATUSES];

// Task type constants
export const TASK_TYPES = {
    PRICES: 'prices',
    ADS: 'advertising',
    PROMO: 'promo',
    SEO: 'seo',
    RETENTION: 'retention',
    STOCKS: 'stocks',
    COMPETITORS: 'competitors',
    INDIPA_PROMOS: 'indipa',
} as const;

export type TaskType = typeof TASK_TYPES[keyof typeof TASK_TYPES];

// Task type configurations with labels, executors and colors
export const TASK_TYPE_CONFIG: Record<TaskType, { label: string; executor: string; color: string }> = {
    [TASK_TYPES.PRICES]: { label: 'Цены, СПП, Акции', executor: 'dasha', color: 'bg-blue-500' },
    [TASK_TYPES.ADS]: { label: 'Реклама', executor: 'galina', color: 'bg-purple-500' },
    [TASK_TYPES.PROMO]: { label: 'Промо', executor: 'dasha', color: 'bg-green-500' },
    [TASK_TYPES.SEO]: { label: 'SEO', executor: 'nastya', color: 'bg-yellow-500' },
    [TASK_TYPES.RETENTION]: { label: 'Удержания', executor: 'yana', color: 'bg-red-500' },
    [TASK_TYPES.STOCKS]: { label: 'Стоки', executor: 'nastya', color: 'bg-orange-500' },
    [TASK_TYPES.COMPETITORS]: { label: 'Отчет по конкурентам', executor: 'arina', color: 'bg-pink-500' },
    [TASK_TYPES.INDIPA_PROMOS]: { label: 'Акции в Индипа', executor: 'galina', color: 'bg-indigo-500' },
};

// Status configurations with labels, icons and styles
export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; iconName: string; className: string }> = {
    [TASK_STATUSES.NEW]: { label: 'Ожидает', iconName: 'Clock', className: 'bg-gray-100 text-gray-600' },
    [TASK_STATUSES.IN_PROGRESS]: { label: 'В работе', iconName: 'Play', className: 'bg-blue-100 text-blue-600' },
    [TASK_STATUSES.DONE]: { label: 'Готово', iconName: 'CheckCircle2', className: 'bg-green-100 text-green-600' },
};

// Task interface
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

// Categories
export const CATEGORIES = ['Лицо', 'Волосы', 'Макияж', 'Тело'] as const;
export type Category = typeof CATEGORIES[number];
