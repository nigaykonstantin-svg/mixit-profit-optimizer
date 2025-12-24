'use client';

import { useState } from 'react';
import { Task, TaskStatus, TASK_TYPE_CONFIG, TASK_STATUS_CONFIG, TASK_STATUSES } from '@/modules/tasks/task-model';
import { updateTaskStatus, deleteTask, addComment } from '@/modules/tasks/tasks-api';
import { USERS, UserId } from '@/modules/users';
import { Card, Badge, Button } from '@/modules/shared';
import { Clock, CheckCircle2, Play, Trash2, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';

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
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');

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

    const handleAddComment = () => {
        if (newComment.trim()) {
            const author = isLeader ? 'veronika' : task.executor;
            addComment(task.id, newComment, author);
            setNewComment('');
            onStatusChange?.();
        }
    };

    const comments = task.comments || [];

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

            {/* Status change buttons - for both roles */}
            {task.status !== TASK_STATUSES.DONE && (
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

            {/* Comments Section */}
            <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <MessageSquare size={14} />
                    <span>Комментарии ({comments.length})</span>
                    {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showComments && (
                    <div className="mt-3 space-y-3">
                        {/* Existing comments */}
                        {comments.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {comments.map(comment => {
                                    const commentAuthor = USERS[comment.author as UserId];
                                    return (
                                        <div key={comment.id} className="bg-gray-50 rounded-lg p-2 text-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span>{commentAuthor?.avatar || '👤'}</span>
                                                <span className="font-medium text-gray-700">{commentAuthor?.name || 'Пользователь'}</span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(comment.createdAt).toLocaleDateString('ru-RU')}
                                                </span>
                                            </div>
                                            <p className="text-gray-600">{comment.text}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Add comment input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Написать комментарий..."
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                            />
                            <button
                                onClick={handleAddComment}
                                className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

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
