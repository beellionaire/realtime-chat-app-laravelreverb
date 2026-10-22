import { Link } from "@inertiajs/react";
import {
    ArrowLeft,
    BellOff,
    MessageSquarePlus,
    Search,
    Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ChatAvatar } from "./chat-avatar";
import { TypingDots, typingLabel } from "./typing-indicator";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    conversationDisplay,
    formatSidebarTime,
    lastMessagePreview,
} from "@/lib/chat-utils";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/chat";

export function ChatSidebar({
    conversations,
    activeId,
    meId,
    onlineIds,
    typingByConversation,
    onNewChat,
    onNewGroup,
    onSearch,
}: any) {
    const [filter, setFilter] = useState("");

    const filtered = useMemo(() => {
        const query = filter.trim().toLowerCase();
        if (!query) return conversations;
        return conversations.filter((c: any) =>
            conversationDisplay(c, meId).name.toLowerCase().includes(query),
        );
    }, [conversations, filter, meId]);

    return (
        // PERUBAHAN: bg-white diubah menjadi bg-[#121212]
        <div className="flex h-full w-full flex-col border-r-2 border-black bg-[#FAFAFA] md:w-80 lg:w-[400px]">
            {/* HEADER SIDEBAR */}
            <div className="flex items-center justify-between gap-2 border-b-2 border-black bg-white p-4">
                {/* Hanya Title "Chats" di sebelah kiri */}
                <div className="flex items-center gap-3 pl-1">
                    <h1 className="text-2xl font-black uppercase tracking-tight text-black">
                        Chats
                    </h1>
                </div>

                {/* Tombol Aksi di sebelah kanan */}
                <div className="flex items-center gap-2">
                    {[
                        { icon: Search, onClick: onSearch },
                        { icon: Users, onClick: onNewGroup },
                        { icon: MessageSquarePlus, onClick: onNewChat },
                    ].map((btn, i) => (
                        <Button
                            key={i}
                            variant="ghost"
                            size="icon"
                            onClick={btn.onClick}
                            className="rounded-none border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFD800] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            <btn.icon className="size-4.5" strokeWidth={2.5} />
                        </Button>
                    ))}
                </div>
            </div>

            {/* KOTAK PENCARIAN */}
            <div className="relative border-b-2 border-black bg-[#FFD800] p-4">
                {/* Pola Titik (Dot Grid) */}
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px]" />
                <Input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="SEARCH CHATS..."
                    className="relative z-10 h-11 rounded-none border-2 border-black bg-white p-3 text-sm font-bold placeholder:text-black/40 focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow text-black"
                />
            </div>

            {/* DAFTAR PERCAKAPAN */}
            {/* PERUBAHAN: bg-white diubah menjadi bg-[#121212] */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFAFA]">
                {filtered.map((conversation: any) => {
                    const display = conversationDisplay(conversation, meId);
                    const typing = typingLabel(
                        typingByConversation[conversation.id] ?? [],
                    );
                    const online =
                        conversation.type === "direct" &&
                        !!display.otherUser &&
                        onlineIds.has(display.otherUser.id);
                    const unread = conversation.unread_count ?? 0;

                    return (
                        <Link
                            key={conversation.id}
                            href={`/chat/${conversation.id}`}
                            preserveState
                            preserveScroll
                            className={cn(
                                "flex w-full items-center gap-4 border-2 border-black p-3.5 text-left transition-all bg-white",
                                activeId === conversation.id
                                    ? "translate-x-[2px] translate-y-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                            )}
                        >
                            {/* Avatar */}
                            <ChatAvatar
                                name={display.name}
                                avatarUrl={display.avatarUrl}
                                isGroup={conversation.type === "group"}
                                online={online}
                                className="size-12 rounded-full border-2 border-black"
                            />

                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between gap-2">
                                    <span className="truncate font-bold text-[15px] text-black">
                                        {display.name}
                                    </span>
                                    {conversation.last_message_at && (
                                        <span className="text-[10px] font-bold text-black/50">
                                            {formatSidebarTime(
                                                conversation.last_message_at,
                                            )}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-1">
                                    <span className="truncate text-xs font-medium text-black/70">
                                        {typing ? (
                                            <span className="text-black font-bold uppercase">
                                                {typing} <TypingDots />
                                            </span>
                                        ) : (
                                            lastMessagePreview(
                                                conversation.last_message,
                                                meId,
                                            )
                                        )}
                                    </span>
                                    {/* Titik Notifikasi Pesan Baru ala Referensi Gambar */}
                                    {unread > 0 && (
                                        <div className="size-2.5 shrink-0 rounded-full bg-black" />
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
