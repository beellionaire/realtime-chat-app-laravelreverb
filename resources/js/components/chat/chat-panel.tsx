import { Link } from "@inertiajs/react";
import { ArrowLeft, MoreVertical, Phone, Search, Video } from "lucide-react"; // ✅ Tambahkan import icon baru
import { ChatAvatar } from "./chat-avatar";
import { TypingDots, typingLabel } from "./typing-indicator";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";
import { Button } from "../ui/button";
import { conversationDisplay, formatLastSeen } from "@/lib/chat-utils";
import type { ChatMessage, Conversation } from "@/types/chat";

export function ChatPanel({
    conversation,
    messages,
    meId,
    onlineIds,
    typingNames,
    hasMore,
    loadingOlder,
    sending,
    onLoadOlder,
    onSend,
    onTyping,
}: {
    conversation: Conversation;
    messages: ChatMessage[];
    meId: number;
    onlineIds: Set<number>;
    typingNames: string[];
    hasMore: boolean;
    loadingOlder: boolean;
    sending: boolean;
    onLoadOlder: () => void;
    onSend: (body: string) => void;
    onTyping: () => void;
}) {
    const display = conversationDisplay(conversation, meId);
    const typing = typingLabel(typingNames);
    const otherOnline =
        !!display.otherUser && onlineIds.has(display.otherUser.id);

    const subtitle = () => {
        if (typing) {
            return (
                <span className="flex items-center gap-1.5 font-bold text-black uppercase tracking-wider text-[10px]">
                    {typing} <TypingDots />
                </span>
            );
        }

        if (conversation.type === "group") {
            const online = conversation.participants.filter(
                (p) => p.id !== meId && onlineIds.has(p.id),
            ).length;
            return `${conversation.participants.length} MEMBERS ${online > 0 ? ` • ${online} ONLINE` : ""}`;
        }

        return otherOnline
            ? "ONLINE"
            : formatLastSeen(
                  display.otherUser?.last_seen_at ?? null,
              )?.toUpperCase();
    };

    return (
        <div className="flex h-full min-w-0 flex-1 flex-col bg-[#FAFAFA]">
            {/* HEADER: Clean Neo-Brutalism (Putih, Border Hitam, Flex Between) */}
            <div className="flex items-center justify-between border-b-2 border-black bg-white px-4 py-3">
                {/* BAGIAN KIRI: Tombol Back, Avatar, dan Nama */}
                <div className="flex min-w-0 items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="md:hidden rounded-none border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                        <Link href="/chat" preserveState>
                            <ArrowLeft className="size-5" strokeWidth={2.5} />
                        </Link>
                    </Button>

                    <ChatAvatar
                        name={display.name}
                        avatarUrl={display.avatarUrl}
                        isGroup={conversation.type === "group"}
                        online={otherOnline}
                        className="size-10 rounded-full border-2 border-black"
                    />

                    <span className="min-w-0 flex flex-col">
                        <span className="block truncate font-black text-lg uppercase tracking-tight text-black">
                            {display.name}
                        </span>
                        <span className="block truncate text-[11px] font-bold text-black/60">
                            {subtitle()}
                        </span>
                    </span>
                </div>

                {/* BAGIAN KANAN: Ikon Aksi ala Referensi Gambar */}
                <div className="flex shrink-0 items-center gap-2">
                    {/* Ikon Video & Telepon: Disembunyikan di HP (hidden sm:inline-flex) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        title="Video Call"
                        className="hidden sm:inline-flex rounded-none border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFD800] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        <Video className="size-4.5" strokeWidth={2.5} />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        title="Voice Call"
                        className="hidden sm:inline-flex rounded-none border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFD800] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        <Phone className="size-4.5" strokeWidth={2.5} />
                    </Button>

                    {/* Ikon Pencarian & Menu: Tetap muncul di HP */}
                    <Button
                        variant="ghost"
                        size="icon"
                        title="Search Conversation"
                        className="rounded-none border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFD800] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        <Search className="size-4.5" strokeWidth={2.5} />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        title="More Options"
                        className="rounded-none border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFD800] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        <MoreVertical className="size-4.5" strokeWidth={2.5} />
                    </Button>
                </div>
            </div>

            {/* AREA DAFTAR PESAN */}
            <MessageList
                messages={messages}
                conversation={conversation}
                meId={meId}
                hasMore={hasMore}
                onLoadOlder={onLoadOlder}
                loadingOlder={loadingOlder}
                otherOnline={otherOnline}
            />

            {/* KOLOM INPUT PESAN */}
            <MessageComposer
                conversationId={conversation.id}
                sending={sending}
                onSend={onSend}
                onTyping={onTyping}
            />
        </div>
    );
}
