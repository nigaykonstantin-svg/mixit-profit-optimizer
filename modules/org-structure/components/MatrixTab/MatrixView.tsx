'use client';

import type { Department } from '../../types';
import { DepartmentCard } from './DepartmentCard';
import { MatrixLegend } from './MatrixLegend';
import styles from '../../styles/org-structure.module.css';

interface MatrixViewProps {
    departments: Department[];
    stats: {
        totalEmployees: number;
        departmentCount: number;
    };
}

export function MatrixView({ departments, stats }: MatrixViewProps) {
    // Find the CEO/Direction department
    const ceo = departments.find(d => d.slug === 'direction');

    return (
        <div className={styles.matrixView}>
            <div className={styles.matrixHeader}>
                <div>
                    <h2 className={styles.matrixTitle}>Матричная организационная структура</h2>
                    <p className={styles.matrixSubtitle}>
                        {stats.totalEmployees} сотрудников • {stats.departmentCount} департаментов • 50+ отделов
                    </p>
                </div>
                <MatrixLegend />
            </div>

            {/* CEO Section */}
            <div className={styles.ceoSection}>
                <div className={styles.ceoCard}>
                    <div className={styles.ceoName}>
                        {ceo?.headName || 'Олег Пай'}
                    </div>
                    <div className={styles.ceoTitle}>
                        Генеральный директор
                    </div>
                    <div className={styles.ceoCount}>
                        {stats.totalEmployees} сотрудников
                    </div>
                </div>
            </div>

            {/* Matrix Grid */}
            <div className={styles.matrixGrid}>
                {departments
                    .filter(d => d.slug !== 'direction') // Exclude CEO card
                    .map(dept => (
                        <DepartmentCard key={dept.id} department={dept} />
                    ))}
            </div>
        </div>
    );
}
