<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache; // Fitur penyimpanan memori sementara
use Symfony\Component\HttpFoundation\Response;

class UpdateLastSeen
{
    /**
     * FUNGSI HANDLE:
     * Middleware ini menyela setiap *request* yang masuk (sebelum sampai ke Controller).
     * Fungsinya untuk memperbarui status "Online" (kapan terakhir dilihat) dari user tersebut.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Cek apakah request ini dilakukan oleh user yang sedang login
        if ($user = $request->user()) {
            
            // 2. Buat kunci cache unik untuk user ini (contoh: "last-seen-5")
            $key = "last-seen-{$user->id}";

            // 3. TRIK OPTIMASI PERFORMA (THROTTLING):
            // Cache::add() mencoba membuat data baru di Cache yang bertahan selama 60 detik.
            // Fungsi ini hanya me-return TRUE jika kunci tersebut BELUM ADA sebelumnya.
            // Alasan: Mencegah server me-nge-spam query UPDATE ke database setiap kali user mengklik halaman (bisa bikin database jebol).
            // Hasilnya: Database HANYA akan di-update maksimal 1 menit sekali per user.
            if (Cache::add($key, true, 60)) {
                
                // 4. Update kolom 'last_seen_at' dengan waktu saat ini (sekarang)
                // forceFill() digunakan agar data langsung diisi paksa tanpa harus mendaftarkan kolomnya di $fillable Model User.
                $user->forceFill(['last_seen_at' => now()])->save();
            }
        }
        
        // 5. Setelah pengecekan selesai, persilakan request user melanjutkan perjalanannya (ke Controller tujuan)
        return $next($request);
    }
}