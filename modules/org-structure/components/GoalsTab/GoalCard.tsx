'use client';

import type { Goal } from '../../types';
import { GOAL_TYPES } from '../../types';
import styles from '../../styles/org-structure.module.css';

interface GoalCardProps {
    goal: Goal;
    onEdit?: (goal: Goal) => void;
}

export function GoalCard({ goal, onEdit }: GoalCardProps) {
    const typeInfo = GOAL_TYPES[goal.goalType];
    const progressColor = goal.progress >= 70 ? '#22c55e' : goal.progress >= 40 ? '#eab308' : '#ef4444';

    const initials = goal.ownerName
        ? goal.ownerName.split(' ').map(n => n[0]).join('')
        : '??';

    const formattedDeadline = goal.deadline
        ? new Date(goal.deadline).toLocaleDateString('ru-RU')
        : 'Не указан';

    return (
        <div className={styles.goalCard} onClick={() => onEdit?.(goal)}>
            <div className={styles.goalHeader}>
                <span className={`${styles.goalType} ${getTypeClassName(goal.goalType)}`}>
                    {typeInfo.label}
                </span>
                <div className={styles.goalPriority}>
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`${styles.priorityDot} ${i <= goal.priority ? styles.priorityDotActive : ''}`}
                        />
                    ))}
                </div>
            </div>

            <h3 className={styles.goalTitle}>{goal.title}</h3>
            <p className={styles.goalDescription}>{goal.description || ''}</p>

            <div className={styles.goalMetrics}>
                <div className={styles.goalMetric}>
                    <div className={styles.metricLabel}>Текущее</div>
                    <div className={`${styles.metricValue} ${styles.metricCurrent}`}>
                        {goal.currentValue || '—'}
                    </div>
                </div>
                <div className={styles.goalMetric}>
                    <div className={styles.metricLabel}>Цель</div>
                    <div className={`${styles.metricValue} ${styles.metricTarget}`}>
                        {goal.targetValue || '—'}
                    </div>
                </div>
            </div>

            <div className={styles.goalProgressBar}>
                <div
                    className={styles.goalProgressFill}
                    style={{ width: `${goal.progress}%`, background: progressColor }}
                />
            </div>

            <div className={styles.goalFooter}>
                <div className={styles.goalOwner}>
                    <div className={styles.ownerAvatar}>{initials}</div>
                    <span>{goal.ownerName || 'Не назначен'}</span>
                </div>
                <div className={styles.goalDeadline}>📅 {formattedDeadline}</div>
            </div>
        </div>
    );
}

function getTypeClassName(goalType: Goal['goalType']): string {
    const classMap: Record<Goal['goalType'], string> = {
        revenue: styles.typeRevenue,
        growth: styles.typeGrowth,
        efficiency: styles.typeEfficiency,
        quality: styles.typeQuality,
    };
    return classMap[goalType] || styles.typeGrowth;
}
