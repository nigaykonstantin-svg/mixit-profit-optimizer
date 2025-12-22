"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase/client";

export default function MessageList({ taskId }: { taskId: string }) {
    const [messages, setMessages] = useState<any[]>([]);

    useEffect(() => {
        load();

        const channel = supabase
            .channel(`comments-${taskId}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "task_comments" },
                load
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    async function load() {
        const { data } = await supabase
            .from("task_comments")
            .select("*")
            .eq("task_id", taskId)
            .order("created_at", { ascending: true });

        setMessages(data || []);
    }

    return (
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {messages.map((m) => (
                <div key={m.id} style={{ marginBottom: 12 }}>
                    <b>{m.user_name}</b>
                    <div>{m.text}</div>
                    <small>{m.created_at}</small>
                </div>
            ))}
        </div>
    );
}
