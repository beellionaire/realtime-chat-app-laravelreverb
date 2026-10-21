import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useInitials } from "@/hooks/use-initials";
import { cn } from "@/lib/utils";

/**
 * Komponen ChatAvatar:
 * Berfungsi untuk menampilkan foto profil (Avatar) user atau grup.
 * Dilengkapi dengan fitur "Fallback" (huruf inisial jika foto tidak ada)
 * dan indikator status online (titik hijau).
 */
export function ChatAvatar({
    name,
    avatarUrl,
    isGroup = false, // Nilai default: false (dianggap chat personal/DM)
    online = false, // Nilai default: false (dianggap offline)
    className, // Memungkinkan kita mengubah ukuran/styling avatar dari luar komponen
}: {
    name: string;
    avatarUrl: string | null;
    isGroup?: boolean;
    online?: boolean;
    className?: string;
}) {
    // Memanggil custom hook untuk menghasilkan singkatan nama (contoh: "Nabil Ahmad" -> "NA")
    const getInitials = useInitials();

    return (
        // 1. WADAH UTAMA (Container)
        // 'relative' diperlukan agar indikator online (titik hijau) bisa diposisikan di pojok.
        // 'shrink-0' mencegah bentuk bulat avatar menjadi lonjong (gepeng) jika ruang di sebelahnya sempit.
        <div className="relative shrink-0">
            {/* 2. KOMPONEN AVATAR UTAMA (Bawaan shadcn/ui) */}
            {/* cn() menggabungkan ukuran default (size-10 / 40px) dengan class tambahan dari luar */}
            <Avatar className={cn("size-10", className)}>
                {/* 2a. GAMBAR PROFIL */}
                {/* Hanya di-render / dimuat jika 'avatarUrl' memiliki isi (tidak null/kosong) */}
                {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}

                {/* 2b. GAMBAR PENGGANTI (Fallback) */}
                {/* Tampil otomatis JIKA 'avatarUrl' kosong, ATAU JIKA gambar gagal dimuat/rusak (error 404). */}
                <AvatarFallback className="bg-primary/10 text-primary">
                    {/* Jika ini grup, tampilkan ikon <Users />. Jika bukan, tampilkan teks inisial nama */}
                    {isGroup ? <Users className="size-4" /> : getInitials(name)}
                </AvatarFallback>
            </Avatar>

            {/* 3. INDIKATOR STATUS ONLINE */}
            {/* Hanya dirender jika status 'online' bernilai true */}
            {online && (
                <span
                    // 'absolute right-0 bottom-0' menempelkan titik ini di pojok kanan bawah bingkai div 'relative' tadi.
                    // 'border-2 border-background' memberi garis tepi seolah-olah titik ini "memotong" foto profil.
                    className="absolute right-0 bottom-0 block size-3 rounded-full border-2 border-background bg-emerald-500"
                ></span>
            )}
        </div>
    );
}
