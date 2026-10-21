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

/**
 * Komponen ChatSidebar:
 * Berfungsi menampilkan panel sebelah kiri yang berisi daftar semua percakapan,
 * fitur pencarian obrolan, dan tombol-tombol aksi (grup baru, chat baru).
 */
export function ChatSidebar({
    conversations,
    activeId,
    meId,
    onlineIds,
    typingByConversation,
    onNewChat,
    onNewGroup,
    onSearch,
}: {
    conversations: Conversation[];
    activeId: number | null;
    meId: number;
    onlineIds: Set<number>;
    typingByConversation: Record<number, string[]>;
    onNewChat: () => void;
    onNewGroup: () => void;
    onSearch: () => void;
}) {
    // 1. STATE PENCARIAN
    const [filter, setFilter] = useState("");

    // 2. LOGIKA FILTERING (PENCARIAN)
    // useMemo digunakan agar proses filter (yang lumayan berat jika datanya banyak)
    // hanya dijalankan ulang saat isi ketikan 'filter' atau daftar 'conversations' berubah.
    const filtered = useMemo(() => {
        const query = filter.trim().toLowerCase();

        // Jika kotak pencarian kosong, kembalikan semua data asli
        if (!query) {
            return conversations;
        }

        // Menyaring (filter) daftar percakapan berdasarkan nama yang cocok dengan kata kunci
        return conversations.filter((c) =>
            conversationDisplay(c, meId).name.toLowerCase().includes(query),
        );
    }, [conversations, filter, meId]);

    return (
        <div className="flex h-full w-full flex-col border-r bg-sidebar md:w-80 lg:w-96">
            {/* --- BAGIAN 1: HEADER SIDEBAR --- */}
            <div className="flex items-center justify-between gap-2 border-b p-3">
                <div className="flex items-center gap-1">
                    {/* Tombol kembali ke halaman utama dashboard Laravel */}
                    <Button
                        variant="ghost"
                        size={"icon"}
                        asChild
                        title="Back to Dashboard"
                    >
                        <Link href="/dashboard">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold">Chats</h1>
                </div>

                {/* Kumpulan tombol aksi */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSearch}
                        title="Search Messages"
                    >
                        <Search className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNewGroup}
                        title="New Group"
                    >
                        <Users className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNewChat}
                        title="Chat"
                    >
                        <MessageSquarePlus className="size-4" />
                    </Button>
                </div>
            </div>

            {/* --- BAGIAN 2: KOTAK PENCARIAN (INPUT) --- */}
            <div className="p-3 pb-2">
                <Input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Search or start a new chat"
                    className="h-9"
                />
            </div>

            {/* --- BAGIAN 3: DAFTAR PERCAKAPAN --- */}
            <div className="flex-1 overflow-y-auto">
                {/* Tampilan khusus jika hasil pencarian kosong atau user belum punya chat sama sekali */}
                {filtered.length === 0 && (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                        No conversation yet. Start one with the {""}
                        <MessageSquarePlus className="inline-size-4" /> button.
                    </p>
                )}

                {/* Looping untuk me-render setiap item percakapan yang lolos filter */}
                {filtered.map((conversation) => {
                    const display = conversationDisplay(conversation, meId);
                    const typing = typingLabel(
                        typingByConversation[conversation.id] ?? [],
                    );

                    // Cek apakah lawan bicara sedang online (Hanya berlaku untuk DM, bukan Grup)
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
                            // Menandai percakapan mana yang sedang aktif/dibuka dengan warna background 'bg-accent'
                            className={cn(
                                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/50",
                                activeId === conversation.id && "bg-accent",
                            )}
                        >
                            {/* Menampilkan Foto Profil */}
                            <ChatAvatar
                                name={display.name}
                                avatarUrl={display.avatarUrl}
                                isGroup={conversation.type === "group"}
                                online={online}
                                className="size-11"
                            />

                            {/* Kontainer Teks di Sebelah Foto Profil */}
                            <div className="min-w-0 flex-1">
                                {/* Baris Atas: Nama & Jam Pesan Terakhir */}
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="truncate font-medium">
                                        {display.name}
                                    </span>
                                    {conversation.last_message_at && (
                                        <span
                                            className={cn(
                                                "shrink-0 text-xs",
                                                unread > 0
                                                    ? "font-semibold text-primary" // Warna mencolok jika belum dibaca
                                                    : "text-muted-foreground", // Warna pudar jika sudah dibaca
                                            )}
                                        >
                                            {formatSidebarTime(
                                                conversation.last_message_at,
                                            )}
                                        </span>
                                    )}
                                </div>

                                {/* Baris Bawah: Status Mengetik ATAU Cuplikan Pesan + Badge Unread */}
                                {/* PERBAIKAN: Seluruh elemen di bawah digabungkan dalam SATU kontainer flex ini */}
                                <div className="flex items-center justify-between gap-2">
                                    {/* Sisi Kiri: Pesan atau Status Mengetik */}
                                    {typing ? (
                                        <span className="flex items-center gap-1.5 truncate text-sm text-primary">
                                            {typing} <TypingDots />
                                        </span>
                                    ) : (
                                        <span className="truncate text-sm text-muted-foreground">
                                            {lastMessagePreview(
                                                conversation.last_message,
                                                meId,
                                            )}
                                        </span>
                                    )}

                                    {/* Sisi Kanan: Ikon Mute & Angka Unread */}
                                    <span className="flex shrink-0 items-center gap-1">
                                        {conversation.muted && (
                                            <BellOff className="size-3.5 text-muted-foreground" />
                                        )}
                                        {unread > 0 && (
                                            <Badge className="h-5 min-w-5 rounded-full px-1.5 text-xs">
                                                {unread > 99 ? "99+" : unread}
                                            </Badge>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
