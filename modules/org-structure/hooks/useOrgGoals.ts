'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { fetchGoalsByDepartment, createGoal, updateGoal, deleteGoal, updateGoalProgress } from '../org-service';
import type { Goal, CreateGoalData, UpdateGoalData } from '../types';

export function useOrgGoals(departmentId: string | null) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, error, isLoading, mutate } = useSWR<Goal[]>(
        departmentId ? `org-goals-${departmentId}` : null,
        () => fetchGoalsByDepartment(departmentId!),
        {
            revalidateOnFocus: false,
        }
    );

    const addGoal = async (goalData: Omit<CreateGoalData, 'departmentId'>) => {
        if (!departmentId) return null;

        setIsSubmitting(true);
        try {
            const newGoal = await createGoal({ ...goalData, departmentId });
            await mutate(prev => prev ? [...prev, newGoal] : [newGoal], false);
            return newGoal;
        } finally {
            setIsSubmitting(false);
        }
    };

    const editGoal = async (goalData: UpdateGoalData) => {
        setIsSubmitting(true);
        try {
            const updated = await updateGoal(goalData);
            await mutate(prev => prev?.map(g => g.id === updated.id ? updated : g), false);
            return updated;
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeGoal = async (goalId: string) => {
        setIsSubmitting(true);
        try {
            await deleteGoal(goalId);
            await mutate(prev => prev?.filter(g => g.id !== goalId), false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const setProgress = async (goalId: string, progress: number) => {
        const updated = await updateGoalProgress(goalId, progress);
        await mutate(prev => prev?.map(g => g.id === updated.id ? updated : g), false);
        return updated;
    };

    return {
        goals: data || [],
        isLoading,
        isSubmitting,
        error,
        addGoal,
        editGoal,
        removeGoal,
        setProgress,
        refresh: mutate,
    };
}
