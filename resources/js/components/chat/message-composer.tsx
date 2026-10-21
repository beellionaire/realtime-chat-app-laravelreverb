import { SendHorizonal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Button } from "../ui/button";

export function MessageComposer({
    conversationId,
    sending,
    onSend,
    onTyping,
}: {
    conversationId: number;
    sending: boolean;
    onSend: (body: string) => void;
    onTyping: () => void;
}) {
    // State untuk menyimpan teks yang sedang diketik
    const [body, setBody] = useState("");

    // Referensi untuk memanipulasi elemen textarea secara langsung (DOM)
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Efek: Kosongkan input dan langsung arahkan kursor (focus) saat user pindah ruang chat
    useEffect(() => {
        setBody("");
        textareaRef.current?.focus();
    }, [conversationId]);

    // Fungsi agar kotak teks otomatis meninggi saat teks mulai panjang (maksimal 160px)
    const autoGrow = () => {
        const el = textareaRef.current;
        if (!el) return;

        el.style.height = "auto"; // Reset tinggi ke default dulu
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`; // Set sesuai tinggi konten
    };

    // Fungsi untuk mengeksekusi pengiriman pesan
    const submit = () => {
        const trimmed = body.trim();

        // Jangan lakukan apa-apa jika teks hanya berisi spasi kosong
        if (!trimmed) return;

        // Panggil fungsi onSend (disediakan oleh komponen induk) untuk mengirim data
        onSend(trimmed);

        // Reset kolom input dan kembalikan tinggi kotak teks seperti semula
        setBody("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    // Deteksi aksi keyboard pada textarea
    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        // Jika user menekan tombol 'Enter' SAJA (tanpa menahan tombol Shift)
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Cegah enter membuat baris baru di teks
            submit(); // Kirim pesan
        }
    };

    // Dijalankan setiap kali ada huruf baru yang diketik
    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setBody(event.target.value); // Simpan huruf ke state
        autoGrow(); // Sesuaikan tinggi kotak
        onTyping(); // Kirim sinyal "sedang mengetik..." ke backend/lawan bicara
    };

    return (
        <div className="border-t bg-background p-3">
            <div className="flex items-end gap-1.5 rounded-2xl border bg-muted/20 px-2 py-1.5">
                <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    rows={1}
                    className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                />

                {/* PERBAIKAN BUG: Tombol kirim tidak lagi berupa tag penutup mandiri (self-closing) */}
                <Button
                    size="icon"
                    className="size-9 shrink-0 rounded-full"
                    // PERBAIKAN BUG: .trim() adalah function, jadi butuh tanda kurung ()
                    disabled={sending || !body.trim()}
                    onClick={submit}
                    title="Send"
                >
                    {/* PERBAIKAN BUG: Ikon SendHorizonal harus berada DI DALAM tag Button, bukan di luarnya */}
                    <SendHorizonal className="size-4" />
                </Button>
            </div>
        </div>
    );
}
