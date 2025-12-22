import TaskCard from "./TaskCard";

interface Task {
    id: string;
    description: string;
    status: string;
    priority: string;
    assigned_to: string;
    deadline?: string | null;
}

interface TaskListProps {
    tasks: Task[];
    onTaskClick?: (id: string) => void;
}

export default function TaskList({ tasks, onTaskClick }: TaskListProps) {
    if (tasks.length === 0) {
        return <p className="text-gray-500">Нет задач</p>;
    }

    return (
        <div className="space-y-3">
            {tasks.map((task) => (
                <TaskCard
                    key={task.id}
                    {...task}
                    onClick={() => onTaskClick?.(task.id)}
                />
            ))}
        </div>
    );
}
