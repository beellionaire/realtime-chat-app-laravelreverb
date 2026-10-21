import { Head, usePage } from "@inertiajs/react";
import { MessageSquare } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { chatApi } from "@/lib/chat-api";
import { cn } from "@/lib/utils";
import { Auth } from "@/types";
import { ChatMessage, Conversation } from "@/types/chat";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";

// 1. TIPE DATA PROPS
// Dapat dari mana? Ini adalah struktur data yang dikirim oleh backend (Laravel ChatController) lewat Inertia.
type PageProps = {
    auth: Auth; // Data user yang sedang login
    conversations: Conversation[]; // Daftar semua obrolan untuk Sidebar
    activeConversation: Conversation | null; // Data obrolan yang sedang diklik/dibuka
    messages: ChatMessage[]; // Riwayat pesan dari obrolan yang sedang dibuka
};

const PAGE_SIZE = 30; // Konstanta pembatas jumlah pesan untuk fitur Infinite Scroll

export default function ChatIndex() {
    // 2. MENGAMBIL DATA DARI BACKEND
    // usePage() adalah hook bawaan Inertia.js untuk menangkap data dari Laravel.
    const { props } = usePage<PageProps>();
    const me = props.auth.user;

    // 3. STATE LOKAL (REACT)
    // Fungsinya: Menyimpan salinan data dari server agar React bisa mengubah tampilannya
    // secara instan (real-time) tanpa perlu memuat ulang (refresh) halaman.
    const [conversations, setConversations] = useState<Conversation[]>(
        props.conversations,
    );
    const [dialog, setDialog] = useState<
        "chat" | "group" | "info" | "search" | null
    >(null);
    const [messages, setMessages] = useState<ChatMessage[]>(
        props.messages ?? [],
    );

    const [hasMore, setHasMore] = useState(
        (props.messages?.length ?? 0) >= PAGE_SIZE,
    ); // Cek apakah masih ada pesan lama
    const [loadingOlder, setLoadingOlder] = useState(false); // Indikator loading scroll ke atas
    const [sending, setSending] = useState(false); // Indikator loading saat kirim pesan

    const activeId = props.activeConversation?.id ?? null;
    const activeConversation = props.activeConversation;

    // 4. SINKRONISASI DATA (SERVER -> LOKAL)
    // Alur: Saat user mengklik chat lain di Sidebar, URL berubah, dan Inertia mengirim props baru.
    // Blok if ini mendeteksi perubahan tersebut dan langsung memperbarui state lokal.
    const [prevConversationsProp, setPrevConversationsProp] = useState(
        props.conversations,
    );
    if (prevConversationsProp !== props.conversations) {
        setPrevConversationsProp(props.conversations);
        setConversations(props.conversations);
    }

    const [prevMessagesProp, setPrevMessagesProp] = useState(props.messages);
    if (prevMessagesProp !== props.messages) {
        setPrevMessagesProp(props.messages);
        setMessages(props.messages ?? []);
        setHasMore((props.messages?.length ?? 0) >= PAGE_SIZE);
    }

    // 5. HELPER: UPDATE SIDEBAR
    // Fungsinya untuk mengurutkan ulang Sidebar agar chat yang baru saja aktif naik ke paling atas.
    const sortConversations = (list: Conversation[]) =>
        [...list].sort((a, b) =>
            (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""),
        );

    // Fungsinya untuk memperbarui data SATU item chat di Sidebar (misal: mengganti teks cuplikan pesan terakhir).
    const patchConversation = useCallback(
        (id: number, patch: (c: Conversation) => Conversation) => {
            setConversations((current) =>
                sortConversations(
                    current.map((c) => (c.id === id ? patch(c) : c)),
                ),
            );
        },
        [],
    );

    // 6. AKSI: KIRIM PESAN
    // Alur: Dipanggil saat tombol "Send" ditekan -> Tembak API -> Update layar pesan -> Update cuplikan di Sidebar
    const sendMessage = useCallback(
        (body: string) => {
            if (!activeConversation) return;
            setSending(true);

            // Tembak API ke Laravel (MessageController @store)
            chatApi
                .post<{ message: ChatMessage }>(
                    `/conversations/${activeConversation.id}/messages`,
                    { body },
                )
                .then(({ message }) => {
                    // Berhasil! Masukkan pesan baru ke urutan terbawah di layar utama
                    setMessages((current) =>
                        current.some((m) => m.id === message.id)
                            ? current
                            : [...current, message],
                    );

                    // Perbarui cuplikan "pesan terakhir" di Sidebar sebelah kiri
                    patchConversation(activeConversation.id, (c) => ({
                        ...c,
                        last_message_at: message.created_at,
                        lastMessage: {
                            id: message.id,
                            type: message.type,
                            body: message.body,
                            is_deleted: false,
                            attachment_name: null,
                            sender_id: me.id,
                            sender_name: me.name,
                            created_at: message.created_at,
                        },
                    }));
                })
                .catch((error: Error) => toast.error(error.message)) // Tampilkan notif error jika gagal
                .finally(() => setSending(false)); // Matikan efek loading
        },
        [activeConversation, me.id, me.name, patchConversation],
    );

    // 7. AKSI: MUAT PESAN LAMA (INFINITE SCROLL)
    // Alur: Dipanggil otomatis saat user men-scroll layar ke ujung atas.
    const loadOlder = useCallback(() => {
        if (!activeConversation || messages.length === 0) return;
        setLoadingOlder(true);

        // Ambil data pesan dengan ID yang lebih lama dari pesan teratas saat ini
        chatApi
            .get<{ messages: ChatMessage[]; has_more: boolean }>(
                `/conversations/${activeConversation.id}/messages?before=${messages[0].id}`,
            )
            .then((data) => {
                // Selipkan riwayat pesan lama ke paling ATAS array (bukan di bawah)
                setMessages((current) => [...data.messages, ...current]);
                setHasMore(data.has_more); // Cek apa riwayatnya sudah habis?
            })
            .catch(() => {})
            .finally(() => setLoadingOlder(false));
    }, [activeConversation, messages]);

    // 8. RENDER TAMPILAN (UI)
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <Head title="Chat" />

            {/* --- BAGIAN KIRI: SIDEBAR --- */}
            {/* Hanya tampil di HP jika tidak ada chat yang dibuka (activeConversation kosong) */}
            <div
                className={cn(
                    "h-full w-full md:w-auto",
                    activeConversation && "hidden md:block",
                )}
            >
                <ChatSidebar
                    conversations={conversations}
                    activeId={activeId}
                    meId={me.id}
                    onlineIds={new Set()}
                    typingByConversation={{}}
                    onNewChat={() => setDialog("chat")}
                    onNewGroup={() => setDialog("group")}
                    onSearch={() => setDialog("search")}
                />
            </div>

            {/* --- BAGIAN KANAN: PANEL CHAT UTAMA --- */}
            {activeConversation ? (
                // Jika ADA obrolan yang dipilih: Tampilkan komponen ruang obrolan (Header, Daftar Pesan, Input Ketik)
                <ChatPanel
                    conversation={activeConversation}
                    messages={messages}
                    meId={me.id}
                    hasMore={hasMore}
                    loadingOlder={loadingOlder}
                    sending={sending}
                    onLoadOlder={loadOlder}
                    onSend={sendMessage}
                />
            ) : (
                // Jika BELUM ADA obrolan yang dipilih: Tampilkan layar kosong berlogo
                <div
                    className={cn(
                        "min-w-0 flex-1 flex-col items-center justify-center gap-3 bg-muted/20 text-muted-foreground",
                        activeConversation ? "hidden" : "hidden md:flex",
                    )}
                >
                    <MessageSquare className="size-16 opacity-30" />
                    <p className="text-lg font-medium">Select a conversation</p>
                    <p className="text-sm">or start a new from the sidebar</p>
                </div>
            )}

            {/* KOMPONEN POP-UP: Bikin chat / cari teman baru */}
            <NewChatDialog
                open={dialog === "chat"}
                onOpenChange={(o) => setDialog(o ? "chat" : null)}
            />
        </div>
    );
}
