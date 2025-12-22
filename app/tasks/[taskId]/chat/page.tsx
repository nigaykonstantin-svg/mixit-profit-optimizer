import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";

export default function ChatPage({ params }: { params: { taskId: string } }) {
    const { taskId } = params;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <MessageList taskId={taskId} />
            <MessageInput taskId={taskId} />
        </div>
    );
}
