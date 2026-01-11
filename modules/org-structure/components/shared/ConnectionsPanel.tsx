'use client';

import type { MatrixConnection } from '../../types';
import { CONNECTION_TYPES } from '../../types';
import styles from '../../styles/org-structure.module.css';

interface ConnectionsPanelProps {
    connections: MatrixConnection[];
}

export function ConnectionsPanel({ connections }: ConnectionsPanelProps) {
    if (connections.length === 0) return null;

    return (
        <div className={styles.connectionsPanel}>
            <div className={styles.connectionsTitle}>🔗 Матричные связи</div>
            <div className={styles.connectionsGrid}>
                {connections.map(conn => {
                    const typeInfo = CONNECTION_TYPES[conn.relationType];
                    return (
                        <div
                            key={conn.id}
                            className={`${styles.connectionItem} ${getConnectionClassName(conn.relationType)}`}
                        >
                            <div className={styles.connectionType}>
                                {typeInfo.label}
                            </div>
                            <div className={styles.connectionName}>
                                {conn.connectedTo}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function getConnectionClassName(type: MatrixConnection['relationType']): string {
    const classMap: Record<MatrixConnection['relationType'], string> = {
        primary: styles.connectionPrimary,
        functional: styles.connectionFunctional,
        project: styles.connectionProject,
    };
    return classMap[type] || styles.connectionPrimary;
}
