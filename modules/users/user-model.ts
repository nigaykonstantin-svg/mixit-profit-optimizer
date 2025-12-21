// User roles
export const USER_ROLES = {
    LEADER: 'leader',
    EXECUTOR: 'executor',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// User interface
export interface User {
    name: string;
    role: UserRole;
    avatar: string;
}

// Users data
export const USERS: Record<string, User> = {
    veronika: { name: 'Вероника', role: USER_ROLES.LEADER, avatar: '👩‍💼' },
    dasha: { name: 'Даша', role: USER_ROLES.EXECUTOR, avatar: '👩‍💻' },
    galina: { name: 'Галина', role: USER_ROLES.EXECUTOR, avatar: '👩‍🎨' },
    nastya: { name: 'Настя', role: USER_ROLES.EXECUTOR, avatar: '👩‍🔬' },
    yana: { name: 'Яна', role: USER_ROLES.EXECUTOR, avatar: '👩‍🏫' },
    arina: { name: 'Арина', role: USER_ROLES.EXECUTOR, avatar: '👩‍✈️' },
};

export type UserId = keyof typeof USERS;

// Helper to get executors only
export function getExecutors(): Array<{ id: string } & User> {
    return Object.entries(USERS)
        .filter(([, user]) => user.role === USER_ROLES.EXECUTOR)
        .map(([id, user]) => ({ id, ...user }));
}
