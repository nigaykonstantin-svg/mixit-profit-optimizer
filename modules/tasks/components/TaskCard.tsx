'use client';

import { Task, TaskStatus, TASK_TYPE_CONFIG, TASK_STATUS_CONFIG, TASK_STATUSES } from '@/modules/tasks/task-model';
import { updateTaskStatus, deleteTask } from '@/modules/tasks/tasks-api';
import { USERS, UserId } from '@/modules/users';
import { Card, Badge, Button } from '@/modules/shared';
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
        <Card hoverable>
            <div className="flex items-start justify-between gap-3 mb-3">
                <Badge className={`text-white ${taskType.color}`}>
                    {taskType.label}
                </Badge>
                <Badge
                    variant={task.status === TASK_STATUSES.DONE ? 'success' : task.status === TASK_STATUSES.IN_PROGRESS ? 'info' : 'default'}
                    icon={<StatusIcon size={12} />}
                >
                    {statusConfig.label}
                </Badge>
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
                    <Badge variant="default" size="sm">
                        {task.category}
                    </Badge>
                )}
            </div>

            {/* Actions for executors */}
            {!isLeader && task.status !== TASK_STATUSES.DONE && (
                <div className="flex gap-2 mt-4">
                    {task.status === TASK_STATUSES.NEW && (
                        <Button
                            onClick={() => handleStatusChange(TASK_STATUSES.IN_PROGRESS)}
                            fullWidth
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            Начать
                        </Button>
                    )}
                    {task.status === TASK_STATUSES.IN_PROGRESS && (
                        <Button
                            onClick={() => handleStatusChange(TASK_STATUSES.DONE)}
                            fullWidth
                            className="bg-green-500 hover:bg-green-600"
                        >
                            Готово
                        </Button>
                    )}
                </div>
            )}

            {/* Delete for leader */}
            {isLeader && (
                <Button
                    variant="danger"
                    onClick={handleDelete}
                    className="mt-4 p-2"
                >
                    <Trash2 size={16} />
                </Button>
            )}
        </Card>
    );
}
