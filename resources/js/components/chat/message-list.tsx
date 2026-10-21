import { useEffect, useLayoutEffect, useRef } from "react";
import type { UIEvent } from "react";
import { MessageBubble } from "./message-bubble";
import { Spinner } from "../ui/spinner";
import { formatDayLabel, isSameDay } from "@/lib/chat-utils";
import type { ChatMessage, Conversation } from "@/types/chat";

export function MessageList({
    messages,
    conversation,
    meId,
    hasMore,
    loadingOlder,
    onLoadOlder,
}: {
    messages: ChatMessage[];
    conversation: Conversation;
    meId: number;
    hasMore: boolean;
    loadingOlder: boolean;
    onLoadOlder: () => void;
}) {
    // Referensi ke elemen pembungkus list (untuk memanipulasi posisi scroll)
    const containerRef = useRef<HTMLDivElement>(null);

    // Melacak apakah user sedang membaca chat di bagian paling bawah
    const stickToBottomRef = useRef(true);

    // Menyimpan tinggi area scroll sebelum riwayat pesan lama dimuat
    // (berguna untuk mencegah layar melompat tak terkendali ke atas)
    const prevScrollHeightRef = useRef<number | null>(null);

    // Menyimpan ID pesan paling terakhir untuk mendeteksi datangnya pesan baru
    const lastMessageIdRef = useRef<number | null>(null);

    // useLayoutEffect: Mengatur kalkulasi scroll secara sinkron tepat sebelum UI di-render.
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // 1. Mempertahankan posisi baca (scroll) saat riwayat pesan lama ditambahkan di atas layar
        if (prevScrollHeightRef.current !== null) {
            el.scrollTop += el.scrollHeight - prevScrollHeightRef.current;
            prevScrollHeightRef.current = null;
            return;
        }

        // 2. Logika Auto-Scroll ke bawah saat ada pesan baru masuk
        const lastId = messages.at(-1)?.id ?? null;
        if (lastId !== lastMessageIdRef.current) {
            lastMessageIdRef.current = lastId;

            // Cek apakah pesan baru tersebut dikirim oleh kita sendiri
            const lastIsMine = messages.at(-1)?.user_id === meId;

            // Otomatis scroll ke bawah HANYA JIKA user memang sedang berada di paling bawah,
            // ATAU jika user sendiri yang mengirim pesan tersebut.
            if (stickToBottomRef.current || lastIsMine) {
                el.scrollTop = el.scrollHeight;
            }
        }
    }, [messages, meId]);

    // useEffect: Langsung lompat ke paling bawah saat user berpindah/membuka percakapan baru
    useEffect(() => {
        const el = containerRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
        stickToBottomRef.current = true;
    }, [conversation.id]);

    // handleScroll: Mendeteksi pergerakan scroll manual dari user
    const handleScroll = (event: UIEvent<HTMLDivElement>) => {
        const el = event.currentTarget;

        // Jika jarak scroll ke ujung bawah kurang dari 80px, tandai bahwa user sedang "stay di bawah"
        stickToBottomRef.current = el.scrollHeight - el.scrollTop < 80;

        // Infinite Scroll: Jika user men-scroll mendekati ujung atas (< 60px) dan histori masih ada,
        // panggil fungsi onLoadOlder() untuk mengambil pesan lama dari server.
        if (el.scrollTop < 60 && hasMore && !loadingOlder) {
            prevScrollHeightRef.current = el.scrollHeight;
            onLoadOlder();
        }
    };

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        >
            {/* Indikator Spinner saat memuat riwayat pesan di atas */}
            {loadingOlder && (
                <div className="flex justify-center py-2">
                    <Spinner className="size-5" />
                </div>
            )}

            {/* Render daftar pesan */}
            {messages.map((message, index) => {
                // PERBAIKAN: Kode asli Anda menulis 'message[index - 1]'.
                // Seharusnya mengambil dari array 'messages', bukan object 'message'.
                const prev = messages[index - 1];

                // Pengecekan apakah pesan ini berada di hari yang berbeda dari pesan sebelumnya
                const newDay =
                    !prev ||
                    !isSameDay(
                        new Date(prev.created_at),
                        new Date(message.created_at),
                    );

                // Menentukan apakah nama pengirim perlu ditampilkan.
                // Ditampilkan jika: pesan pertama, atau pengirimnya beda dari pesan sebelumnya,
                // atau setelah pesan sistem, atau terjadi pergantian hari.
                const showSender =
                    !prev ||
                    prev.user_id !== message.user_id ||
                    prev.type === "system" ||
                    newDay;

                return (
                    <div key={message.id} className="space-y-3">
                        {/* Lencana Tanggal (contoh: "Today", "12 Oct") pembatas hari */}
                        {newDay && (
                            <div className="my-3 flex justify-center">
                                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                    {formatDayLabel(message.created_at)}
                                </span>
                            </div>
                        )}

                        {/* Gelembung Pesan */}
                        <MessageBubble
                            message={message}
                            isMine={message.user_id === meId}
                            isGroup={conversation.type === "group"}
                            showSender={showSender}
                        />
                    </div>
                );
            })}
        </div>
    );
}
