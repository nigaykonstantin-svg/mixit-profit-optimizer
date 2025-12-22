interface Task {
    id: string;
    description: string;
    assigned_to: string;
    deadline?: string | null;
    status: string;
}

export function formatOverdueMessage(tasks: Task[]): string {
    if (tasks.length === 0) return "";

    let msg = `⚠️ Просроченные задачи (${tasks.length}):\n\n`;

    for (const t of tasks) {
        msg += `• ${t.description}\n`;
        msg += `  → ${t.assigned_to}\n`;
        if (t.deadline) {
            msg += `  📅 Дедлайн: ${new Date(t.deadline).toLocaleDateString()}\n`;
        }
        msg += "\n";
    }

    return msg;
}

export function formatDailyDigest(overdue: Task[], dueToday: Task[]): string {
    let msg = "📋 Ежедневный дайджест задач\n\n";

    if (overdue.length > 0) {
        msg += `🔴 Просрочено: ${overdue.length}\n`;
    }

    if (dueToday.length > 0) {
        msg += `🟡 На сегодня: ${dueToday.length}\n`;
    }

    if (overdue.length === 0 && dueToday.length === 0) {
        msg += "✅ Все задачи в порядке!";
    }

    return msg;
}
