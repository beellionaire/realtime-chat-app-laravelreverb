import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { ChatAvatar } from "./chat-avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogHeader,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";
import { chatApi } from "@/lib/chat-api";
import type { ChatUser } from "@/types/chat";

/**
 * 1. CUSTOM HOOK: useUserDirectory
 * Fungsinya: Menangani logika pencarian nama user ke database (Backend).
 * Dipisahkan ke hook khusus agar kode komponen UI di bawahnya tetap bersih.
 */
export function useUserDirectory(open: boolean) {
    const [query, setQuery] = useState(""); // Menyimpan teks yang diketik di kolom pencarian
    const [users, setUsers] = useState<ChatUser[]>([]); // Menyimpan daftar user hasil pencarian
    const [loading, setLoading] = useState(false); // Indikator loading saat mencari

    // useEffect ini akan otomatis berjalan setiap kali pop-up dibuka (open) ATAU teks pencarian (query) berubah
    useEffect(() => {
        // Jika pop-up sedang ditutup, hentikan proses (jangan lakukan pencarian)
        if (!open) return;

        // TEKNIK DEBOUNCE (250ms delay):
        // Menunda pengiriman request ke server selama 0.25 detik.
        // Tujuannya agar server tidak dibombardir request setiap kali user mengetik 1 huruf.
        const timeout = setTimeout(() => {
            setLoading(true);

            // Tembak API ke Laravel (Fungsi users() di ChatController yang kita bahas sebelumnya)
            chatApi
                .get<ChatUser[]>(`/chat/users/?q=${encodeURIComponent(query)}`)
                .then(setUsers) // Jika sukses, simpan datanya ke state 'users'
                .catch(() => setUsers([])) // Jika gagal/error, kosongkan hasil
                .finally(() => setLoading(false)); // Matikan loading
        }, 250);

        // Bersihkan timer jika user mengetik huruf baru sebelum 250ms berlalu
        return () => clearTimeout(timeout);
    }, [open, query]);

    // Kembalikan variabel & fungsi agar bisa dipakai oleh komponen NewChatDialog
    return { query, setQuery, loading, users };
}

/**
 * 2. KOMPONEN UTAMA: NewChatDialog
 * Fungsinya: Menampilkan Pop-Up (Modal) berisi kolom pencarian dan daftar user.
 */
export function NewChatDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    // Ambil data dan fungsi pencarian dari custom hook di atas
    const { query, setQuery, users, loading } = useUserDirectory(open);

    // FUNGSI: Memulai obrolan baru
    const startChat = (user: ChatUser) => {
        onOpenChange(false); // Tutup pop-up pencarian

        // Kirim data user_id ke Laravel (Fungsi store() di ConversationController yang baru saja kita buat)
        // Laravel akan mengecek/membuat ruang chat, lalu me-redirect kita ke halaman chat tersebut.
        router.post(
            "/conversations",
            { user_id: user.id },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                {/* --- JUDUL POP-UP --- */}
                <DialogHeader>
                    <DialogTitle>New Chat</DialogTitle>
                    <DialogDescription>
                        Pick someone to start a conversation with
                    </DialogDescription>
                </DialogHeader>

                {/* --- KOTAK PENCARIAN --- */}
                <Input
                    autoFocus // Kursor otomatis aktif di sini saat pop-up terbuka
                    value={query}
                    onChange={(e) => setQuery(e.target.value)} // Update state 'query' saat mengetik
                    placeholder="Search by name or email"
                />

                {/* --- DAFTAR HASIL PENCARIAN --- */}
                <div className="max-h-72 space-y-0.5 overflow-y-auto">
                    {/* 1. Tampilkan loading putar-putar jika sedang mencari */}
                    {loading && (
                        <div className="flex justify-center py-6">
                            <Spinner className="size-5" />
                        </div>
                    )}

                    {/* 2. Tampilkan teks ini jika pencarian selesai tapi hasilnya kosong */}
                    {!loading && users.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            No users found
                        </p>
                    )}

                    {/* 3. Looping: Tampilkan daftar user jika ada hasilnya */}
                    {!loading &&
                        users.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => startChat(user)} // Klik nama -> Jalankan fungsi startChat
                                // PERBAIKAN TYPO: transitions-colors diubah menjadi transition-colors
                                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent"
                            >
                                {/* Foto Profil */}
                                <ChatAvatar
                                    name={user.name}
                                    avatarUrl={user.avatar_url}
                                />

                                {/* Teks Nama & Info Tambahan */}
                                <span className="min-w-0">
                                    <span className="block truncate font-medium">
                                        {user.name}
                                    </span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                        {/* Jika user punya info 'about', tampilkan. Jika tidak, tampilkan email-nya */}
                                        {user.about ?? user.email}
                                    </span>
                                </span>
                            </button>
                        ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
