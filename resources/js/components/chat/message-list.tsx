import { useEffect, useLayoutEffect, useRef } from "react";
import type { UIEvent } from "react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Spinner } from "@/components/ui/spinner";
import { formatDayLabel, isSameDay } from "@/lib/chat-utils";
import type { ChatMessage, Conversation } from "@/types/chat";

export function MessageList({
    messages,
    conversation,
    meId,
    hasMore,
    loadingOlder,
    onLoadOlder,
    otherOnline,
}: any) {
    // 1. REF (REFERENSI UNTUK MENGONTROL SCROLL)
    const containerRef = useRef<HTMLDivElement>(null); // Jangkar untuk div utama agar bisa di-scroll via kode
    const stickToBottomRef = useRef(true); // Status: Apakah posisi user sedang mentok di bawah layar?
    const prevScrollHeightRef = useRef<number | null>(null); // Menyimpan tinggi layar sebelum pesan lama di-load
    const lastMessageIdRef = useRef<number | null>(null); // Menyimpan ID pesan paling terakhir

    // 2. EFEK UTAMA: MENGATUR POSISI SCROLL (Auto-scroll & Pertahankan Posisi)
    // Menggunakan useLayoutEffect agar pergeseran layar terjadi SEBELUM browser selesai menggambar, sehingga tidak "berkedip".
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // SKENARIO A: User men-scroll ke atas dan pesan lama berhasil dimuat.
        // Tahan layar agar tidak terlempar paksa ke paling atas.
        if (prevScrollHeightRef.current !== null) {
            el.scrollTop += el.scrollHeight - prevScrollHeightRef.current;
            prevScrollHeightRef.current = null;
            return; // Hentikan eksekusi, jangan lanjut ke kode bawah.
        }

        // SKENARIO B: Ada pesan baru masuk
        const lastId = messages.at(-1)?.id ?? null; // Ambil ID pesan terbawah saat ini

        if (lastId !== lastMessageIdRef.current) {
            lastMessageIdRef.current = lastId; // Update memori ID terakhir

            // Cek apakah pesan baru ini kita sendiri yang kirim
            const lastIsMine = messages.at(-1)?.user_id === meId;

            // SCROLL OTOMATIS KE BAWAH JIKA:
            // 1. Posisi layar user memang sedang mentok di bawah (stickToBottomRef), ATAU
            // 2. Pesan itu dikirim oleh diri kita sendiri (selalu paksa scroll ke bawah)
            if (stickToBottomRef.current || lastIsMine) {
                el.scrollTop = el.scrollHeight;
            }
        }
    }, [messages, meId]);

    // 3. EFEK GANTI RUANG OBROLAN
    // Jika user mengklik nama orang lain di Sidebar, langsung paksa layar mentok ke bawah.
    useEffect(() => {
        const el = containerRef.current;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
        stickToBottomRef.current = true; // Reset status
    }, [conversation.id]);

    // 4. DETEKSI SCROLL MANUAL OLEH USER
    const handleScroll = (event: UIEvent<HTMLDivElement>) => {
        const el = event.currentTarget;

        // Cek: Apakah jarak pandang saat ini dengan dasar layar kurang dari 80px?
        // Jika ya, anggap user sedang "mentok di bawah".
        stickToBottomRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 80;

        // INFINITE SCROLL: Jika user men-scroll ke atas (sisa jarak < 60px) & pesan lama masih ada & tidak sedang loading...
        if (el.scrollTop < 60 && hasMore && !loadingOlder) {
            prevScrollHeightRef.current = el.scrollHeight; // Simpan tinggi layar saat ini
            onLoadOlder(); // Tembak API untuk ambil pesan lama
        }
    };

    // 5. RENDER TAMPILAN
    return (
        <div
            ref={containerRef} // Pasang jangkar di sini
            onScroll={handleScroll} // Pantau pergerakan scroll
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        >
            {/* Indikator loading saat men-scroll ke atas */}
            {loadingOlder && (
                <div className="flex justify-center py-2">
                    <Spinner className="size-5" />
                </div>
            )}

            {/* Render daftar gelembung pesan */}
            {messages.map((message, index) => {
                const prev = messages[index - 1]; // Lihat data pesan sebelumnya

                // Cek apakah pesan ini dikirim di hari yang berbeda dari pesan sebelumnya
                const newDay =
                    !prev ||
                    !isSameDay(
                        new Date(prev.created_at),
                        new Date(message.created_at),
                    );

                // Cek apakah perlu menampilkan Foto Profil/Nama?
                // Tampilkan jika: Ini pesan pertama, ATAU pengirimnya beda dengan pesan di atasnya, ATAU beda hari.
                const showSender =
                    !prev ||
                    prev.user_id !== message.user_id ||
                    prev.type === "system" ||
                    newDay;

                return (
                    <div key={message.id} className="space-y-3">
                        {/* Lencana Hari (Misal: "Today", "Yesterday") */}
                        {newDay && (
                            <div className="my-3 flex justify-center">
                                <span className="rounded-none border-2 border-black bg-black px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]">
                                    {formatDayLabel(message.created_at)}
                                </span>
                            </div>
                        )}

                        {/* Komponen Gelembung Pesannya */}
                        <MessageBubble
                            message={message}
                            isMine={message.user_id === meId}
                            isGroup={conversation.type === "group"}
                            showSender={showSender}
                            otherOnline={otherOnline}
                        />
                    </div>
                );
            })}
        </div>
    );
}
