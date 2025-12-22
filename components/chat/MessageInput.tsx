"use client";

import { useState } from "react";
import { supabase } from "@/services/supabase/client";

export default function MessageInput({ taskId }: { taskId: string }) {
    const [value, setValue] = useState("");

    async function send() {
        if (!value.trim()) return;

        await supabase.from("task_comments").insert({
            task_id: taskId,
            text: value,
        });

        setValue("");
    }

    return (
        <div style={{ padding: 8, display: "flex", gap: 8 }}>
            <input
                style={{ flex: 1 }}
                placeholder="Напишите сообщение..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />

            <button onClick={send}>Отправить</button>
        </div>
    );
}
