interface TaskCardProps {
    id: string;
    description: string;
    status: string;
    priority: string;
    assigned_to: string;
    deadline?: string | null;
    onClick?: () => void;
}

export default function TaskCard({
    description, status, priority, assigned_to, deadline, onClick
}: TaskCardProps) {
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-lg p-4 shadow-sm border cursor-pointer hover:shadow-md"
        >
            <p className="font-medium">{description}</p>
            <div className="flex gap-2 mt-2 text-sm">
                <span className="px-2 py-0.5 bg-gray-100 rounded">{status}</span>
                <span className="px-2 py-0.5 bg-blue-100 rounded">{priority}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">→ {assigned_to}</p>
            {deadline && (
                <p className="text-xs text-gray-400">📅 {new Date(deadline).toLocaleDateString()}</p>
            )}
        </div>
    );
}
