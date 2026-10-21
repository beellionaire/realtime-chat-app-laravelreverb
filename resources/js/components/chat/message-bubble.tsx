import { formatClock } from "@/lib/chat-utils";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

/**
 * Komponen MessageBubble:
 * Menampilkan satu gelembung (bubble) pesan pada room chat.
 * Mendukung tampilan pesan sistem, pesan milik sendiri (dikirim), dan pesan orang lain (diterima).
 */
export function MessageBubble({
    message,
    isMine,
    isGroup,
    showSender,
}: {
    message: ChatMessage; // Objek data pesan
    isMine: boolean; // Status apakah pesan ini dikirim oleh user yang sedang login
    isGroup: boolean; // Status apakah ruang chat ini berjenis grup
    showSender: boolean; // Kontrol tampilnya nama pengirim (mencegah nama muncul berulang pada pesan berturut-turut)
}) {
    // 1. TAMPILAN PESAN SISTEM (Contoh: "Johnson created the Group")
    if (message.type === "system") {
        return (
            <div className="my-2 flex justify-center">
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {message.body}
                </span>
            </div>
        );
    }

    // 2. TAMPILAN PESAN USER (TEKS/BIASA)
    return (
        <div
            id={`message-${message.id}`} // Element ID untuk kemudahan fitur scroll/jump to message
            className={cn(
                "group flex w-full gap-2",
                // Posisi bubble: Kanan untuk pesan sendiri, Kiri untuk pesan lawan bicara
                isMine ? "justify-end" : "justify-start",
            )}
        >
            {/* Wadah Gelembung Pesan (Bubble Container) */}
            <div
                className={cn(
                    "relative max-w-[85%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%]",
                    // Styling beda warna & lekukan sudut bubble antara pengirim dan penerima
                    isMine
                        ? "rounded-br-md bg-primary text-primary-foreground" // Sudut kanan bawah agak lancip, background utama
                        : "rounded-bl-md border bg-card text-card-foreground", // Sudut kiri bawah agak lancip, background card
                )}
            >
                {/* Nama Pengirim: Hanya muncul jika di dalam grup, dari orang lain, dan diawali pesan baru */}
                {showSender && isGroup && !isMine && message.sender && (
                    <p className="mb-0.5 text-xs font-semibold text-primary">
                        {message.sender.name}
                    </p>
                )}

                {/* Isi Teks Pesan (whitespace-pre-wrap mempertahankan enter/baris baru dari teks) */}
                {message.body && (
                    <p className="text-sm wrap-break-word whitespace-pre-wrap">
                        {message.body}
                    </p>
                )}

                {/* Stempel Waktu (Timestamp) di Pojok Kanan Bawah Bubble */}
                <p
                    className={cn(
                        "mt-0.5 flex items-center justify-end gap-1 text-[10px]",
                        isMine
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground",
                    )}
                >
                    <span>{formatClock(message.created_at)}</span>
                </p>
            </div>
        </div>
    );
}
