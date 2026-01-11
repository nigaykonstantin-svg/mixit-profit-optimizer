'use client';

import useSWR from 'swr';
import { fetchDepartments } from '../org-service';
import type { Department } from '../types';

export function useOrgDepartments() {
    const { data, error, isLoading, mutate } = useSWR<Department[]>(
        'org-departments',
        fetchDepartments,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000, // 30 seconds
        }
    );

    return {
        departments: data || [],
        isLoading,
        error,
        refresh: mutate,
    };
}

// Get a single department by ID or slug
export function useDepartmentById(departments: Department[], idOrSlug: string | null) {
    if (!idOrSlug) return null;
    return departments.find(d => d.id === idOrSlug || d.slug === idOrSlug) || null;
}

// Calculate aggregate stats
export function useOrgStats(departments: Department[]) {
    const totalGoals = departments.reduce((sum, d) => sum + d.goals.length, 0);
    const totalEmployees = departments.reduce((sum, d) => sum + d.employeeCount, 0);

    const allGoals = departments.flatMap(d => d.goals);
    const avgProgress = allGoals.length > 0
        ? Math.round(allGoals.reduce((sum, g) => sum + g.progress, 0) / allGoals.length)
        : 0;

    const onTrack = allGoals.filter(g => g.progress >= 50).length;
    const needsAttention = allGoals.filter(g => g.progress < 40).length;

    return {
        totalGoals,
        totalEmployees,
        avgProgress,
        onTrack,
        needsAttention,
        departmentCount: departments.length,
    };
}
