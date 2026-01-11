'use client';

import { useState } from 'react';
import { useOrgGoals } from '../../hooks/useOrgGoals';
import type { Goal, CreateGoalData } from '../../types';
import styles from '../../styles/org-structure.module.css';

interface AddGoalModalProps {
    departmentId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddGoalModal({ departmentId, onClose, onSuccess }: AddGoalModalProps) {
    const { addGoal, isSubmitting } = useOrgGoals(departmentId);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        goalType: 'growth' as Goal['goalType'],
        priority: 2 as Goal['priority'],
        currentValue: '',
        targetValue: '',
        ownerName: '',
        deadline: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) return;

        try {
            await addGoal({
                title: formData.title,
                description: formData.description || undefined,
                goalType: formData.goalType,
                priority: formData.priority,
                currentValue: formData.currentValue || undefined,
                targetValue: formData.targetValue || undefined,
                ownerName: formData.ownerName || undefined,
                deadline: formData.deadline || undefined,
            });
            onSuccess();
        } catch (error) {
            console.error('Failed to create goal:', error);
        }
    };

    const handleChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h2>➕ Новая цель</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Название цели</label>
                        <input
                            type="text"
                            placeholder="Увеличить выручку на 20%"
                            value={formData.title}
                            onChange={e => handleChange('title', e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Описание</label>
                        <textarea
                            rows={2}
                            placeholder="Описание..."
                            value={formData.description}
                            onChange={e => handleChange('description', e.target.value)}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Тип</label>
                            <select
                                value={formData.goalType}
                                onChange={e => handleChange('goalType', e.target.value)}
                            >
                                <option value="revenue">💰 Выручка</option>
                                <option value="growth">📈 Рост</option>
                                <option value="efficiency">⚡ Эффективность</option>
                                <option value="quality">✨ Качество</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Приоритет</label>
                            <select
                                value={formData.priority}
                                onChange={e => handleChange('priority', Number(e.target.value))}
                            >
                                <option value={3}>🔥 Высокий</option>
                                <option value={2}>🔶 Средний</option>
                                <option value={1}>🔹 Низкий</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Текущее значение</label>
                            <input
                                type="text"
                                placeholder="100M"
                                value={formData.currentValue}
                                onChange={e => handleChange('currentValue', e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Целевое значение</label>
                            <input
                                type="text"
                                placeholder="120M"
                                value={formData.targetValue}
                                onChange={e => handleChange('targetValue', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Ответственный</label>
                            <input
                                type="text"
                                placeholder="Имя Фамилия"
                                value={formData.ownerName}
                                onChange={e => handleChange('ownerName', e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Дедлайн</label>
                            <input
                                type="date"
                                value={formData.deadline}
                                onChange={e => handleChange('deadline', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className={styles.btnPrimary}
                            disabled={isSubmitting || !formData.title.trim()}
                        >
                            {isSubmitting ? 'Создание...' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
