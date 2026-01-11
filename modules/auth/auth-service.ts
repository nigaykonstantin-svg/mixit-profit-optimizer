'use client';

import { UserId, USERS, UserRole, ModuleId, hasModuleAccess as checkModuleAccess } from '@/modules/users';

const AUTH_KEY = 'mixit_auth';

export interface AuthUser {
    id: UserId;
    name: string;
    role: UserRole;
    avatar: string;
    departmentId?: string;
}

export function login(username: string, password: string): AuthUser | null {
    // Simple demo auth - password is always 'demo'
    if (password !== 'demo') return null;

    const user = USERS[username as UserId];
    if (!user) return null;

    const authUser: AuthUser = {
        id: username as UserId,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        departmentId: user.departmentId,
    };

    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
    }

    return authUser;
}

export function logout(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_KEY);
    }
}

export function getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;

    try {
        return JSON.parse(stored) as AuthUser;
    } catch {
        return null;
    }
}

// Re-export module access check with AuthUser support
export function canAccessModule(user: AuthUser | null, module: ModuleId): boolean {
    if (!user) return false;
    return checkModuleAccess(user.role, module);
}

// Check if user can access org structure
export function canAccessOrgStructure(user: AuthUser | null): boolean {
    return canAccessModule(user, 'org-structure');
}

