// PERBAIKAN 1: Mengimpor Link dari Inertia, bukan dari lucide-react
import { Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { ChatAvatar } from "./chat-avatar";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";
import { Button } from "../ui/button";
import { conversationDisplay } from "@/lib/chat-utils";
import type { ChatMessage, Conversation } from "@/types/chat";

/**
 * Komponen ChatPanel:
 * Berfungsi sebagai "kontainer utama" ruang obrolan (layar sebelah kanan).
 * Menyatukan 3 bagian utama: Header (Info Kontak), Tengah (Daftar Pesan), dan Bawah (Input Teks).
 */
export function ChatPanel({
    conversation,
    messages,
    meId,
    hasMore,
    loadingOlder,
    sending,
    onLoadOlder,
    onSend,
    onTyping, // PERBAIKAN 2: Menerima prop onTyping dari ChatIndex
}: {
    conversation: Conversation;
    messages: ChatMessage[];
    meId: number;
    hasMore: boolean;
    loadingOlder: boolean;
    sending: boolean;
    onLoadOlder: () => void;
    onSend: (body: string) => void;
    onTyping: () => void; // PERBAIKAN 2: Definisi tipe data fungsi onTyping
}) {
    // Memproses data percakapan untuk mendapatkan nama & avatar yang tepat (Grup vs DM)
    const display = conversationDisplay(conversation, meId);

    return (
        <div className="flex h-full min-w-0 flex-1 flex-col bg-muted/20">
            {/* --- 1. BAGIAN HEADER (ATAS) --- */}
            <div className="items-center flex gap-3 border-b bg-background px-3 py-2.5">
                {/* Tombol "Back / Kembali": 
                    Hanya muncul di layar HP (md:hidden) karena di HP sidebar tertutup 
                    saat chat dibuka. Klik ini akan kembali ke /chat (menampilkan sidebar lagi). 
                */}
                <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="md:hidden"
                >
                    <Link href="/chat" preserveState>
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>

                {/* Profil Lawan Bicara / Grup */}
                <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <ChatAvatar
                        name={display.name}
                        avatarUrl={display.avatarUrl}
                        isGroup={conversation.type === "group"}
                    />
                    <span className="min-w-0">
                        <span className="block truncate font-semibold">
                            {display.name}
                        </span>
                    </span>
                </div>
            </div>

            {/* --- 2. BAGIAN ISI CHAT (TENGAH) --- */}
            {/* Komponen yang sudah kita bahas sebelumnya untuk merender gelembung pesan 
                dan menangani scroll otomatis. 
            */}
            <MessageList
                messages={messages}
                conversation={conversation}
                meId={meId}
                hasMore={hasMore}
                onLoadOlder={onLoadOlder}
                loadingOlder={loadingOlder}
            />

            {/* --- 3. BAGIAN INPUT PESAN (BAWAH) --- */}
            {/* Komponen kotak teks tempat user mengetik pesan baru */}
            <MessageComposer
                conversationId={conversation.id}
                sending={sending}
                onSend={onSend}
                onTyping={onTyping}
            />
        </div>
    );
}
