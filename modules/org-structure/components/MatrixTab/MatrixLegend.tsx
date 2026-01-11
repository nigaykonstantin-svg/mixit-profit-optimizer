'use client';

import styles from '../../styles/org-structure.module.css';

export function MatrixLegend() {
    return (
        <div className={styles.matrixLegend}>
            <div className={styles.legendItem}>
                <div className={`${styles.legendLine} ${styles.linePrimary}`} />
                <span>Прямое</span>
            </div>
            <div className={styles.legendItem}>
                <div className={`${styles.legendLine} ${styles.lineFunctional}`} />
                <span>Функциональное</span>
            </div>
            <div className={styles.legendItem}>
                <div className={`${styles.legendLine} ${styles.lineProject}`} />
                <span>Проектное</span>
            </div>
        </div>
    );
}
