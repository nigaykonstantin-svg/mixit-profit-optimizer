interface TaskFiltersProps {
    current: string;
    onChange: (filter: string) => void;
}

const filters = [
    { key: "all", label: "Все" },
    { key: "open", label: "Открытые" },
    { key: "in_progress", label: "В работе" },
    { key: "done", label: "Выполнены" },
    { key: "cancelled", label: "Отменены" },
];

export default function TaskFilters({ current, onChange }: TaskFiltersProps) {
    return (
        <div className="flex gap-2">
            {filters.map((f) => (
                <button
                    key={f.key}
                    onClick={() => onChange(f.key)}
                    className={`px-3 py-1 rounded-full text-sm ${current === f.key
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-600 border"
                        }`}
                >
                    {f.label}
                </button>
            ))}
        </div>
    );
}
