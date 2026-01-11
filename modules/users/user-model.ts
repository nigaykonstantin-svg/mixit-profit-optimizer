// User roles - extended for org structure module
export const USER_ROLES = {
    LEADER: 'leader',
    EXECUTOR: 'executor',
    HR_MANAGER: 'hr_manager',
    DEPARTMENT_HEAD: 'department_head',
    CEO: 'ceo',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Module permissions - which roles can access which modules
export const MODULE_PERMISSIONS = {
    'dashboard': [USER_ROLES.LEADER, USER_ROLES.EXECUTOR, USER_ROLES.CEO, USER_ROLES.HR_MANAGER, USER_ROLES.DEPARTMENT_HEAD],
    'tasks': [USER_ROLES.LEADER, USER_ROLES.EXECUTOR, USER_ROLES.CEO],
    'org-structure': [USER_ROLES.CEO, USER_ROLES.HR_MANAGER, USER_ROLES.DEPARTMENT_HEAD],
    'settings': [USER_ROLES.LEADER, USER_ROLES.CEO],
} as const;

export type ModuleId = keyof typeof MODULE_PERMISSIONS;

// User interface
export interface User {
    name: string;
    role: UserRole;
    avatar: string;
    departmentId?: string; // For department_head role - which department they manage
}

// Users data - extended with new roles
export const USERS: Record<string, User> = {
    // Existing users
    veronika: { name: 'Вероника', role: USER_ROLES.LEADER, avatar: '👩‍💼' },
    dasha: { name: 'Даша', role: USER_ROLES.EXECUTOR, avatar: '👩‍💻' },
    galina: { name: 'Галина', role: USER_ROLES.EXECUTOR, avatar: '👩‍🎨' },
    nastya: { name: 'Настя', role: USER_ROLES.EXECUTOR, avatar: '👩‍🔬' },
    yana: { name: 'Яна', role: USER_ROLES.EXECUTOR, avatar: '👩‍🏫' },
    arina: { name: 'Арина', role: USER_ROLES.EXECUTOR, avatar: '👩‍✈️' },
    // New org structure users
    oleg: { name: 'Олег Пай', role: USER_ROLES.CEO, avatar: '👔' },
    konstantin: { name: 'Константин Нигай', role: USER_ROLES.CEO, avatar: '🎯' },
    natalia: { name: 'Наталия Субботина', role: USER_ROLES.HR_MANAGER, avatar: '📋' },
    filipp: { name: 'Филипп Дубин', role: USER_ROLES.DEPARTMENT_HEAD, avatar: '📊', departmentId: 'commercial' },
    maxim: { name: 'Максим Смородинов', role: USER_ROLES.DEPARTMENT_HEAD, avatar: '💻', departmentId: 'digital' },
    elena: { name: 'Елена Назарова', role: USER_ROLES.DEPARTMENT_HEAD, avatar: '📣', departmentId: 'marketing' },
};

export type UserId = keyof typeof USERS;

// Helper to get executors only
export function getExecutors(): Array<{ id: string } & User> {
    return Object.entries(USERS)
        .filter(([, user]) => user.role === USER_ROLES.EXECUTOR)
        .map(([id, user]) => ({ id, ...user }));
}

// Helper to check module access
export function hasModuleAccess(role: UserRole, module: ModuleId): boolean {
    const allowedRoles = MODULE_PERMISSIONS[module];
    return (allowedRoles as readonly UserRole[]).includes(role);
}

// Helper to get users with org structure access
export function getOrgStructureUsers(): Array<{ id: string } & User> {
    return Object.entries(USERS)
        .filter(([, user]) => hasModuleAccess(user.role, 'org-structure'))
        .map(([id, user]) => ({ id, ...user }));
}
