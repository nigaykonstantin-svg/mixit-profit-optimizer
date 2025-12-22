"use client";
import { useEffect, useState } from "react";

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);

    async function load() {
        const res = await fetch("/api/tasks/list");
        const json = await res.json();
        setTasks(json.data);
    }

    useEffect(() => { load(); }, []);

    return (
        <div>
            <h1>Tasks</h1>
            <div>
                {tasks.map(t => (
                    <div key={t.id}>
                        <b>{t.description}</b>
                        <p>status: {t.status}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
