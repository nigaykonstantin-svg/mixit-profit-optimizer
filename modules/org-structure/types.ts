// Org Structure Module Types

export interface Department {
    id: string;
    slug: string;
    name: string;
    headName: string | null;
    headTitle: string | null;
    employeeCount: number;
    color: string;
    subdepartments: Subdepartment[];
    connections: MatrixConnection[];
    goals: Goal[];
}

export interface Subdepartment {
    id: string;
    departmentId: string;
    name: string;
    headName: string | null;
    employeeCount: number;
}

export interface Goal {
    id: string;
    departmentId: string;
    title: string;
    description: string | null;
    goalType: 'revenue' | 'growth' | 'efficiency' | 'quality';
    priority: 1 | 2 | 3;
    currentValue: string | null;
    targetValue: string | null;
    progress: number;
    ownerName: string | null;
    deadline: string | null;
    quarter: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface MatrixConnection {
    id: string;
    departmentId: string;
    relationType: 'primary' | 'functional' | 'project';
    connectedTo: string;
    description?: string;
}

export interface Employee {
    id: string;
    departmentId: string | null;
    subdepartmentId: string | null;
    fullName: string;
    position: string | null;
    email: string | null;
    phone: string | null;
    bitrixId: string | null;
    isHead: boolean;
}

export interface OrgAccess {
    id: string;
    userId: string;
    role: 'viewer' | 'editor' | 'admin';
    departmentScope: string[];
    canManageGoals: boolean;
    canManageStructure: boolean;
}

// Goal type display info
export const GOAL_TYPES = {
    revenue: { label: '💰 Выручка', className: 'type-revenue' },
    growth: { label: '📈 Рост', className: 'type-growth' },
    efficiency: { label: '⚡ Эффективность', className: 'type-efficiency' },
    quality: { label: '✨ Качество', className: 'type-quality' },
} as const;

// Connection type display info
export const CONNECTION_TYPES = {
    primary: { label: 'Основное', className: 'conn-primary' },
    functional: { label: 'Функциональное', className: 'conn-functional' },
    project: { label: 'Проектное', className: 'conn-project' },
} as const;

// Department color mapping to CSS var colors
export const DEPT_COLORS: Record<string, string> = {
    pink: 'var(--pink)',
    orange: 'var(--orange)',
    teal: 'var(--teal)',
    blue: 'var(--blue)',
    purple: 'var(--purple)',
    green: 'var(--green)',
    gray: 'var(--muted)',
};

// New goal form data
export interface CreateGoalData {
    departmentId: string;
    title: string;
    description?: string;
    goalType: Goal['goalType'];
    priority: Goal['priority'];
    currentValue?: string;
    targetValue?: string;
    ownerName?: string;
    deadline?: string;
}

// Update goal form data
export interface UpdateGoalData {
    id: string;
    title?: string;
    description?: string;
    goalType?: Goal['goalType'];
    priority?: Goal['priority'];
    currentValue?: string;
    targetValue?: string;
    progress?: number;
    ownerName?: string;
    deadline?: string;
}
