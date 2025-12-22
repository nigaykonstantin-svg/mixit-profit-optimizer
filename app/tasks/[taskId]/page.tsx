"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Task {
    id: string;
    created_at: string;
    created_by: string;
    assigned_to: string;
    description: string;
    priority: string;
    deadline: string | null;
    status: string;
}

export default function TaskDetailPage() {
    const params = useParams();
    const taskId = params.taskId as string;

    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);

    async function loadTask() {
        const res = await fetch(`/api/tasks/get?id=${taskId}`);
        const json = await res.json();
        if (json.data) {
            setTask(json.data);
        }
        setLoading(false);
    }

    useEffect(() => {
        loadTask();
    }, [taskId]);

    if (loading) return <p>Загрузка...</p>;
    if (!task) return <p>Задача не найдена</p>;

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">{task.description}</h1>
            <p>Статус: {task.status}</p>
            <p>Приоритет: {task.priority}</p>
            <p>Исполнитель: {task.assigned_to}</p>
            {task.deadline && <p>Дедлайн: {new Date(task.deadline).toLocaleDateString()}</p>}
            <a href={`/tasks/${taskId}/chat`} className="text-blue-600 mt-4 inline-block">
                Открыть чат →
            </a>
        </div>
    );
}
