interface MessageProps {
    id: string;
    user_name: string;
    text: string;
    created_at: string;
}

export default function Message({ user_name, text, created_at }: MessageProps) {
    return (
        <div className="border-b pb-2">
            <div className="flex justify-between">
                <span className="font-medium text-sm">{user_name}</span>
                <span className="text-xs text-gray-400">
                    {new Date(created_at).toLocaleString()}
                </span>
            </div>
            <p className="text-gray-700">{text}</p>
        </div>
    );
}
