/**
 * Komponen TypingDots:
 * Berfungsi untuk menampilkan animasi 3 titik melompat-lompat (...)
 * sebagai visualisasi bahwa seseorang sedang mengetik.
 */
export function TypingDots() {
    return (
        // inline-flex: Menyusun titik-titik secara horizontal sejajar dengan teks
        <span className="inline-flex items-center gap-0.5">
            {/* 
                Tiga elemen span di bawah ini membentuk titik-titiknya.
                - bg-current: Warnanya akan mengikuti warna teks (text-color) dari elemen induknya.
                - [animation-delay]: Memberikan jeda waktu agar animasi lompatannya bergantian 
                  (tidak melompat bersamaan), sehingga tercipta efek gelombang.
            */}
            <span className="size-1 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
            <span className="size-1 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
            <span className="size-1 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
        </span>
    );
}

/**
 * Fungsi typingLabel:
 * Berfungsi untuk menghasilkan teks label yang dinamis berdasarkan jumlah orang yang sedang mengetik.
 */
export function typingLabel(names: string[]): string | null {
    // 1. Jika array kosong (tidak ada yang mengetik), kembalikan null (tidak menampilkan apa-apa)
    if (names.length === 0) {
        return null;
    }

    // 2. Jika hanya ada 1 orang yang mengetik
    if (names.length === 1) {
        return `${names[0]} is typing`; // Contoh: "Nabil is typing"
    }

    // 3. Jika ada tepat 2 orang yang mengetik bersamaan
    if (names.length === 2) {
        return `${names[0]} and ${names[1]} are typing`; // Contoh: "Nabil and Budi are typing"
    }

    // 4. Jika lebih dari 2 orang (3, 4, dst) yang mengetik bersamaan
    // PERBAIKAN: Mengubah "is" menjadi "are" karena subjeknya jamak (Several people)
    return `Several people are typing`;
}
