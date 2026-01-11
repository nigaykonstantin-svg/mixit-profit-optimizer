'use client';

import { useState } from 'react';
import type { Department } from '../../types';
import { GoalCard } from './GoalCard';
import { AddGoalModal } from './AddGoalModal';
import { ConnectionsPanel } from '../shared/ConnectionsPanel';
import styles from '../../styles/org-structure.module.css';

interface GoalsViewProps {
    department: Department | null;
    onRefresh: () => void;
}

export function GoalsView({ department, onRefresh }: GoalsViewProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!department) {
        return (
            <div className={styles.emptyState}>
                <p>Выберите департамент в боковой панели</p>
            </div>
        );
    }

    const avgProgress = department.goals.length > 0
        ? Math.round(department.goals.reduce((sum, g) => sum + g.progress, 0) / department.goals.length)
        : 0;

    const onTrack = department.goals.filter(g => g.progress >= 50).length;
    const needsAttention = department.goals.filter(g => g.progress < 40).length;

    const progressColor = avgProgress >= 70 ? '#22c55e' : avgProgress >= 40 ? '#eab308' : '#ef4444';

    return (
        <>
            <div className={styles.contentHeader}>
                <div>
                    <h1 className={styles.deptTitle}>{department.name}</h1>
                    <p className={styles.deptSubtitle}>
                        👤 {department.headName || 'Не назначен'} • {department.headTitle || ''} • {department.employeeCount} сотр.
                    </p>
                </div>
                <button className={styles.addGoalBtn} onClick={() => setIsModalOpen(true)}>
                    ➕ Добавить цель
                </button>
            </div>

            <div className={styles.summaryCards}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryCardTitle}>Целей</div>
                    <div className={styles.summaryCardValue}>{department.goals.length}</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryCardTitle}>Прогресс</div>
                    <div className={styles.summaryCardValue} style={{ color: progressColor }}>
                        {avgProgress}%
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryCardTitle}>В графике</div>
                    <div className={styles.summaryCardValue}>{onTrack}</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryCardTitle}>Внимание</div>
                    <div className={styles.summaryCardValue} style={{ color: '#ef4444' }}>
                        {needsAttention}
                    </div>
                </div>
            </div>

            {department.goals.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>Нет целей для этого департамента</p>
                    <button className={styles.addGoalBtn} onClick={() => setIsModalOpen(true)}>
                        ➕ Добавить первую цель
                    </button>
                </div>
            ) : (
                <div className={styles.goalsGrid}>
                    {department.goals.map(goal => (
                        <GoalCard key={goal.id} goal={goal} />
                    ))}
                </div>
            )}

            <ConnectionsPanel connections={department.connections} />

            {isModalOpen && (
                <AddGoalModal
                    departmentId={department.id}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        onRefresh();
                    }}
                />
            )}
        </>
    );
}
