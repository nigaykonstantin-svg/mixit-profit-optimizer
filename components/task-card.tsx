'use client';

import { Task, TASK_TYPES, USERS, TaskStatus, UserId } from '@/lib/data';
import { updateTaskStatus, deleteTask } from '@/lib/tasks';
import { Clock, CheckCircle2, Play, Trash2 } from 'lucide-react';

interface TaskCardProps {
    task: Task;
    isLeader?: boolean;
    onStatusChange?: () => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: typeof Clock; className: string }> = {
    pending: { label: 'Ожидает', icon: Clock, className: 'bg-gray-100 text-gray-600' },
    in_progress: { label: 'В работе', icon: Play, className: 'bg-blue-100 text-blue-600' },
    done: { label: 'Готово', icon: CheckCircle2, className: 'bg-green-100 text-green-600' },
};

export function TaskCard({ task, isLeader = false, onStatusChange }: TaskCardProps) {
    const taskType = TASK_TYPES[task.type];
    const executor = USERS[task.executor as UserId];
    const statusConfig = STATUS_CONFIG[task.status];
    const StatusIcon = statusConfig.icon;

    const handleStatusChange = (newStatus: TaskStatus) => {
        updateTaskStatus(task.id, newStatus);
        onStatusChange?.();
    };

    const handleDelete = () => {
        if (confirm('Удалить задачу?')) {
            deleteTask(task.id);
            onStatusChange?.();
        }
    };

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${taskType.color}`}>
                    {taskType.label}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.className}`}>
                    <StatusIcon size={12} />
                    {statusConfig.label}
                </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>

            {task.description && (
                <p className="text-sm text-gray-500 mb-3">{task.description}</p>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{executor.avatar}</span>
                    <span className="text-sm font-medium text-gray-700">{executor.name}</span>
                </div>

                {task.category && (
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                        {task.category}
                    </span>
                )}
            </div>

            {/* Actions for executors */}
            {!isLeader && task.status !== 'done' && (
                <div className="flex gap-2 mt-4">
                    {task.status === 'pending' && (
                        <button
                            onClick={() => handleStatusChange('in_progress')}
                            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                            Начать
                        </button>
                    )}
                    {task.status === 'in_progress' && (
                        <button
                            onClick={() => handleStatusChange('done')}
                            className="flex-1 py-2 px-4 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                            Готово
                        </button>
                    )}
                </div>
            )}

            {/* Delete for leader */}
            {isLeader && (
                <button
                    onClick={handleDelete}
                    className="mt-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    );
}
