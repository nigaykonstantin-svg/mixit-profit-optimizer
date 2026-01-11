'use client';

import styles from '../../styles/org-structure.module.css';

interface OrgHeaderProps {
    stats: {
        totalGoals: number;
        avgProgress: number;
        departmentCount: number;
        totalEmployees: number;
    };
}

export function OrgHeader({ stats }: OrgHeaderProps) {
    return (
        <div className={styles.headerTop}>
            <div className={styles.logo}>
                <h1>🏢 MIXIT — Платформа управления</h1>
                <span>
                    Матричная организационная структура • {stats.totalEmployees} сотрудников • Q1 2026
                </span>
            </div>
            <div className={styles.headerStats}>
                <div className={styles.headerStat}>
                    <div className={styles.headerStatValue}>{stats.totalGoals}</div>
                    <div className={styles.headerStatLabel}>Целей</div>
                </div>
                <div className={styles.headerStat}>
                    <div className={styles.headerStatValue}>{stats.avgProgress}%</div>
                    <div className={styles.headerStatLabel}>Прогресс</div>
                </div>
                <div className={styles.headerStat}>
                    <div className={styles.headerStatValue}>{stats.departmentCount}</div>
                    <div className={styles.headerStatLabel}>Департаментов</div>
                </div>
            </div>
        </div>
    );
}
