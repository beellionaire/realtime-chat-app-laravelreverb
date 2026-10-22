import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Button } from "../ui/button";

export function MessageComposer({
    conversationId,
    sending,
    onSend,
    onTyping,
}: any) {
    const [body, setBody] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setBody("");
        textareaRef.current?.focus();
    }, [conversationId]);

    const autoGrow = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    };

    const submit = () => {
        const trimmed = body.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setBody("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
        }
    };

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setBody(event.target.value);
        autoGrow();
        onTyping();
    };

    return (
        <div className="bg-[#FAFAFA] p-4 border-t-2 border-black">
            <div className="flex items-end gap-3 max-w-4xl mx-auto w-full">
                <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => {
                        setBody(e.target.value);
                        onTyping();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            submit();
                        }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="max-h-40 min-h-[52px] flex-1 resize-none rounded-none border-2 border-black bg-white p-3.5 text-sm font-medium text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none placeholder:text-black/40 focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                />

                {/* Tombol Send Hitam Solid */}
                <Button
                    size="icon"
                    disabled={sending || !body.trim()}
                    onClick={submit}
                    className="size-[52px] shrink-0 rounded-none border-2 border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFD800] hover:text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-50 transition-all"
                >
                    <Send className="size-5" strokeWidth={2.5} />
                </Button>
            </div>
        </div>
    );
}
