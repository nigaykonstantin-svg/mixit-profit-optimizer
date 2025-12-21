'use client';

import { Task, TaskStatus, TASK_TYPE_CONFIG, TASK_STATUS_CONFIG, TASK_STATUSES } from '@/modules/tasks/task-model';
import { updateTaskStatus, deleteTask } from '@/modules/tasks/task-service';
import { USERS, UserId } from '@/modules/users';
import { Clock, CheckCircle2, Play, Trash2 } from 'lucide-react';

interface TaskCardProps {
    task: Task;
    isLeader?: boolean;
    onStatusChange?: () => void;
}

const ICONS = {
    Clock,
    Play,
    CheckCircle2,
};

export function TaskCard({ task, isLeader = false, onStatusChange }: TaskCardProps) {
    const taskType = TASK_TYPE_CONFIG[task.type];
    const executor = USERS[task.executor as UserId];
    const statusConfig = TASK_STATUS_CONFIG[task.status];
    const StatusIcon = ICONS[statusConfig.iconName as keyof typeof ICONS];

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
            {!isLeader && task.status !== TASK_STATUSES.DONE && (
                <div className="flex gap-2 mt-4">
                    {task.status === TASK_STATUSES.NEW && (
                        <button
                            onClick={() => handleStatusChange(TASK_STATUSES.IN_PROGRESS)}
                            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                            Начать
                        </button>
                    )}
                    {task.status === TASK_STATUSES.IN_PROGRESS && (
                        <button
                            onClick={() => handleStatusChange(TASK_STATUSES.DONE)}
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
