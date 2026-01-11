'use client';

import type { Department } from '../types';
import styles from '../styles/org-structure.module.css';

interface DepartmentSidebarProps {
    departments: Department[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function DepartmentSidebar({ departments, selectedId, onSelect }: DepartmentSidebarProps) {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.sidebarTitle}>Департаменты</div>
            <ul className={styles.deptList}>
                {departments.map(dept => {
                    const avgProgress = dept.goals.length > 0
                        ? Math.round(dept.goals.reduce((sum, g) => sum + g.progress, 0) / dept.goals.length)
                        : 0;

                    const progressClass = avgProgress >= 70
                        ? styles.progressHigh
                        : avgProgress >= 40
                            ? styles.progressMid
                            : styles.progressLow;

                    const isActive = dept.id === selectedId;
                    const borderColor = getDeptBorderColor(dept.color);

                    return (
                        <li
                            key={dept.id}
                            className={`${styles.deptItem} ${isActive ? styles.deptItemActive : ''}`}
                            onClick={() => onSelect(dept.id)}
                            style={{ borderLeft: `3px solid ${borderColor}` }}
                        >
                            <div className={styles.deptItemHeader}>
                                <span className={styles.deptName}>{dept.name}</span>
                                <span className={styles.deptCount}>{dept.goals.length}</span>
                            </div>
                            <div className={styles.deptProgress}>
                                <div
                                    className={`${styles.deptProgressBar} ${progressClass}`}
                                    style={{ width: `${avgProgress}%` }}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}

function getDeptBorderColor(color: string): string {
    const colorMap: Record<string, string> = {
        pink: '#ff4d8d',
        orange: '#f97316',
        teal: '#14b8a6',
        blue: '#3b82f6',
        purple: '#8b5cf6',
        green: '#22c55e',
        gray: '#71717a',
    };
    return colorMap[color] || colorMap.purple;
}
