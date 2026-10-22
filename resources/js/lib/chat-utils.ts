import type { Conversation, LastMessage, Participant } from "@/types/chat";

/**
 * 1. FUNGSI: conversationDisplay
 * Berfungsi untuk menentukan Nama dan Foto Profil yang akan ditampilkan di layar.
 */
export function conversationDisplay(
    conversation: Conversation,
    meId: number,
): { name: string; avatarUrl: string | null; otherUser: Participant | null } {
    // Jika tipe obrolan adalah grup, langsung kembalikan nama dan foto profil grup tersebut
    if (conversation.type === "group") {
        return {
            name: conversation.name ?? "Group",
            avatarUrl: conversation.avatar_url,
            otherUser: null,
        };
    }

    // Jika tipe obrolan adalah Personal (DM), cari data 'peserta lain' (yang ID-nya BUKAN ID kita)
    const other = conversation.participants.find((p) => p.id !== meId) ?? null;

    // Kembalikan nama dan foto profil peserta lain tersebut
    return {
        name: other?.name ?? "Unknown user",
        avatarUrl: other?.avatar_url ?? null,
        otherUser: other,
    };
}

/**
 * 2. FUNGSI: formatClock
 * Berfungsi untuk mengubah waktu mentah menjadi format Jam (Contoh: "14:30" atau "02:30 PM")
 */
export function formatClock(iso: string): string {
    // PERBAIKAN HYDRATION ERROR: Mengganti [] menjadi "en-US"
    return new Date(iso).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * 3. FUNGSI: isSameDay
 * Fungsi utilitas untuk mengecek apakah dua tanggal jatuh pada hari, bulan, dan tahun yang sama persis.
 */
export function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/**
 * 4. FUNGSI: formatSidebarTime
 * Menentukan format waktu di kotak obrolan Sidebar (Mirip logika WhatsApp):
 * - Jika hari ini: Tampilkan Jam (Contoh: "10:30 PM")
 * - Jika dalam 1 minggu terakhir: Tampilkan Nama Hari (Contoh: "Sun", "Mon")
 * - Jika lebih dari seminggu: Tampilkan Tanggal & Bulan (Contoh: "12 Oct")
 */
export function formatSidebarTime(iso: string): string {
    const date = new Date(iso);
    const now = new Date();

    // Cek apakah pesan dikirim hari ini
    if (isSameDay(date, now)) {
        return formatClock(iso);
    }

    // Hitung selisih waktu antara sekarang dan waktu pesan (dalam satuan hari)
    const days = (now.getTime() - date.getTime()) / 86_400_000;

    // Jika selisihnya kurang dari 7 hari, tampilkan singkatan nama hari
    if (days < 7) {
        // PERBAIKAN HYDRATION ERROR: Mengganti [] menjadi "en-US"
        return date.toLocaleDateString("en-US", { weekday: "short" });
    }

    // Jika pesan sudah sangat lama, tampilkan format tanggal (Contoh: 12 Oct)
    // PERBAIKAN HYDRATION ERROR: Mengganti [] menjadi "en-US"
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

/**
 * 5. FUNGSI: lastMessagePreview
 * Membuat cuplikan teks pendek (1 baris) untuk pesan terakhir di Sidebar.
 */
export function lastMessagePreview(
    last: LastMessage | null,
    meId: number,
): string {
    // Jika belum ada pesan sama sekali di ruangan tersebut
    if (!last) {
        return "No message yet";
    }

    // Jika pesan terakhir telah dihapus (ditarik)
    if (last.is_deleted) {
        return "Message deleted";
    }

    // Buat imbuhan awalan.
    // - Jika pesan sistem: Kosongkan
    // - Jika yang mengirim kita: Tambahkan "You: "
    // - Jika dari orang lain: Kosongkan
    const prefix =
        last.type === "system" ? "" : last.sender_id === meId ? "You: " : "";

    // Jika pesan berupa gambar
    if (last.type === "image") {
        return `${prefix} 📷 Photo`;
    }

    // Jika pesan berupa file dokumen
    if (last.type === "file") {
        return `${prefix} 📎 ${last.attachment_name ?? "File"}`;
    }

    // Jika pesan berupa teks biasa, gabungkan imbuhan dan isi pesannya
    return `${prefix}${last.body ?? ""}`;
}

/**
 * 6. FUNGSI: formatDayLabel
 * Digunakan untuk mencetak Lencana Pembatas Hari di tengah ruang chat
 * (Contoh: "Today", "Yesterday", atau "Mon, 12 Oct 2026").
 */
export function formatDayLabel(iso: string): string {
    const date = new Date(iso);
    const now = new Date();

    // Mencari nilai waktu untuk tanggal kemarin
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (isSameDay(date, now)) {
        return "Today"; // Hari ini
    }

    if (isSameDay(date, yesterday)) {
        return "Yesterday"; // Kemarin
    }

    // Selain itu, kembalikan format tanggal lengkap
    // PERBAIKAN HYDRATION ERROR: Mengganti [] menjadi "en-US"
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        // Jika tahunnya beda dengan tahun saat ini, tampilkan angkanya (misal 2023). Jika sama, sembunyikan.
        year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
    });
}

export function formatLastSeen(iso: string | null): string {
    if (!iso) {
        return "offline";
    }

    const date = new Date(iso);
    const now = new Date();
    const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);

    if (minutes < 2) {
        return "last seen just now";
    }

    if (minutes < 60) {
        return `last seen ${minutes} min ago`;
    }

    if (isSameDay(date, now)) {
        return `last seen today at ${formatClock(iso)}`;
    }

    return `last seen ${date.toLocaleDateString([], { day: "numeric", month: "short" })} at ${formatClock(iso)}`;
}
