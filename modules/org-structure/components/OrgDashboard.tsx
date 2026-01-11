'use client';

import { useState } from 'react';
import { useOrgDepartments, useOrgStats, useDepartmentById } from '../hooks/useOrgDepartments';
import { DepartmentSidebar } from './DepartmentSidebar';
import { GoalsView } from './GoalsTab/GoalsView';
import { MatrixView } from './MatrixTab/MatrixView';
import { OrgHeader } from './shared/OrgHeader';
import styles from '../styles/org-structure.module.css';


export type TabId = 'goals' | 'matrix';

export function OrgDashboard() {
    const [activeTab, setActiveTab] = useState<TabId>('goals');
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

    const { departments, isLoading, error } = useOrgDepartments();
    const stats = useOrgStats(departments);
    const selectedDept = useDepartmentById(departments, selectedDeptId);

    // Auto-select first department if none selected
    if (!selectedDeptId && departments.length > 0) {
        setSelectedDeptId(departments[0].id);
    }

    if (error) {
        return (
            <div className={styles.orgModule}>
                <div className={styles.loading}>
                    Ошибка загрузки: {error.message}
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className={styles.orgModule}>
                <div className={styles.loading}>
                    Загрузка организационной структуры...
                </div>
            </div>
        );
    }

    return (
        <div className={styles.orgModule}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <OrgHeader stats={stats} />

                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'goals' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('goals')}
                        >
                            🎯 Цели
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'matrix' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('matrix')}
                        >
                            🔗 Матричная структура
                        </button>
                    </div>
                </header>

                <div className={styles.main}>
                    <DepartmentSidebar
                        departments={departments}
                        selectedId={selectedDeptId}
                        onSelect={setSelectedDeptId}
                    />

                    <main className={styles.content}>
                        {activeTab === 'goals' ? (
                            <GoalsView
                                department={selectedDept}
                                onRefresh={() => { }}
                            />
                        ) : (
                            <MatrixView
                                departments={departments}
                                stats={stats}
                            />
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
