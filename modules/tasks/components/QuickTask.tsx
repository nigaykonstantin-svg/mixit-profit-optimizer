'use client';

import { useState } from 'react';
import { TaskType, TASK_TYPE_CONFIG, CATEGORIES, TASK_STATUSES } from '@/modules/tasks/task-model';
import { addTask } from '@/modules/tasks/task-service';
import { USERS, UserId } from '@/modules/users';
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
            <button
                onClick={() => setIsOpen(true)}
                className="w-full py-4 px-6 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-200"
            >
                <Plus size={20} />
                Новая задача
            </button>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Новая задача</h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Task Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Тип задачи
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(TASK_TYPE_CONFIG).map(([key, value]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedType(key as TaskType)}
                                className={`p-3 rounded-xl text-sm font-medium transition-all ${selectedType === key
                                    ? `${value.color} text-white shadow-md`
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {value.label}
                            </button>
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
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Что нужно сделать..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Категория (опционально)
                    </label>
                    <div className="flex gap-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(category === cat ? '' : cat)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${category === cat
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!selectedType || !title.trim()}
                    className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Создать задачу
                </button>
            </form>
        </div>
    );
}
