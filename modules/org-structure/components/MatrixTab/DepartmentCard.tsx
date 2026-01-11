'use client';

import type { Department } from '../../types';
import styles from '../../styles/org-structure.module.css';

interface DepartmentCardProps {
    department: Department;
}

export function DepartmentCard({ department }: DepartmentCardProps) {
    const initials = department.headName
        ? department.headName.split(' ').map(n => n[0]).join('')
        : '??';

    const headerColorClass = getColorClass(department.color);

    return (
        <div className={styles.matrixCard}>
            <div className={`${styles.matrixCardHeader} ${headerColorClass}`}>
                <h3>{department.name}</h3>
                <span className={styles.matrixCardCount}>
                    {department.employeeCount} чел
                </span>
            </div>
            <div className={styles.matrixCardBody}>
                {/* Department Head */}
                <div className={styles.matrixHead}>
                    <div className={styles.matrixHeadAvatar}>{initials}</div>
                    <div className={styles.matrixHeadInfo}>
                        <h4>{department.headName || 'Не назначен'}</h4>
                        <span>{department.headTitle || ''}</span>
                    </div>
                </div>

                {/* Subdepartments */}
                {department.subdepartments.length > 0 && (
                    <ul className={styles.matrixSubdeptList}>
                        {department.subdepartments.slice(0, 4).map(subdept => (
                            <li key={subdept.id} className={styles.matrixSubdept}>
                                <div>
                                    <div className={styles.matrixSubdeptName}>
                                        {subdept.name}
                                    </div>
                                    <div className={styles.matrixSubdeptHead}>
                                        {subdept.headName || '—'}
                                    </div>
                                </div>
                                <span className={styles.matrixSubdeptCount}>
                                    {subdept.employeeCount}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Connections */}
                {department.connections.length > 0 && (
                    <div className={styles.matrixConnections}>
                        <div className={styles.matrixConnTitle}>Связи</div>
                        <div className={styles.matrixConnList}>
                            {department.connections.map(conn => (
                                <span
                                    key={conn.id}
                                    className={`${styles.matrixConnTag} ${getConnTagClass(conn.relationType)}`}
                                >
                                    {conn.connectedTo}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function getColorClass(color: string): string {
    const colorMap: Record<string, string> = {
        pink: styles.colorDirection,
        orange: styles.colorCommercial,
        teal: styles.colorDigital,
        blue: styles.colorMarketing,
        purple: styles.colorFinance,
        green: styles.colorLab,
        gray: styles.colorLegal,
    };
    return colorMap[color] || styles.colorExec;
}

function getConnTagClass(type: string): string {
    const classMap: Record<string, string> = {
        primary: styles.connPrimary,
        functional: styles.connFunctional,
        project: styles.connProject,
    };
    return classMap[type] || styles.connPrimary;
}
