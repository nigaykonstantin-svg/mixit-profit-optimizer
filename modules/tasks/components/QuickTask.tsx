'use client';

import { useState } from 'react';
import { TaskType, TASK_TYPE_CONFIG, CATEGORIES, TASK_STATUSES } from '@/modules/tasks/task-model';
import { addTask } from '@/modules/tasks/tasks-api';
import { USERS, UserId } from '@/modules/users';
import { Card, Button, Input } from '@/modules/shared';
import { Plus, X } from 'lucide-react';

interface QuickTaskProps {
    onTaskAdded: () => void;
}

export function QuickTask({ onTaskAdded }: QuickTaskProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<TaskType | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedType || !title.trim()) return;

        addTask({
            type: selectedType,
            title: title.trim(),
            executor: TASK_TYPE_CONFIG[selectedType].executor,
            status: TASK_STATUSES.NEW,
            category: category || undefined,
        });

        setTitle('');
        setSelectedType(null);
        setCategory('');
        setIsOpen(false);
        onTaskAdded();
    };

    const selectedExecutor = selectedType ? USERS[TASK_TYPE_CONFIG[selectedType].executor as UserId] : null;

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)} fullWidth size="lg">
                <Plus size={20} />
                Новая задача
            </Button>
        );
    }

    return (
        <Card variant="elevated" padding="lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Новая задача</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="p-1 border-0"
                >
                    <X size={20} />
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Task Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Тип задачи
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(TASK_TYPE_CONFIG).map(([key, value]) => (
                            <Button
                                key={key}
                                type="button"
                                variant={selectedType === key ? 'primary' : 'secondary'}
                                onClick={() => setSelectedType(key as TaskType)}
                                className={selectedType === key ? `${value.color} shadow-md` : ''}
                            >
                                {value.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Auto-assigned executor notice */}
                {selectedExecutor && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                        <span className="text-lg">{selectedExecutor.avatar}</span>
                        <span className="text-sm text-gray-600">
                            Исполнитель: <strong>{selectedExecutor.name}</strong>
                        </span>
                    </div>
                )}

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Описание задачи
                    </label>
                    <Input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Что нужно сделать..."
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Категория (опционально)
                    </label>
                    <div className="flex gap-2">
                        {CATEGORIES.map((cat) => (
                            <Button
                                key={cat}
                                type="button"
                                variant={category === cat ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setCategory(category === cat ? '' : cat)}
                                className={category === cat ? 'bg-gray-900' : ''}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={!selectedType || !title.trim()}
                    fullWidth
                >
                    Создать задачу
                </Button>
            </form>
        </Card>
    );
}
