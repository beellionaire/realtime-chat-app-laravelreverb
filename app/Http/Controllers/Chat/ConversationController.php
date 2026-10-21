<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Models\Conversation; // Model tabel percakapan
use App\Models\User; // Model tabel pengguna
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    /**
     * FUNGSI STORE:
     * Berfungsi untuk memulai atau membuat percakapan (ruang chat) baru.
     * Dipanggil ketika Anda memilih nama teman dari daftar pencarian (New Chat) di frontend.
     */
    public function store(Request $request) : RedirectResponse
    {
        // 1. Ambil data user yang sedang login (diri kita sendiri)
        $user = $request->user();

        // 2. Cek apakah frontend mengirimkan 'user_id' (ID lawan bicara).
        // Jika ada, berarti ini adalah permintaan untuk membuat obrolan Personal (Direct Message / 1-on-1).
        if ($request->filled('user_id')) {
            
            // 3. VALIDASI DATA
            // PERBAIKAN BUG: 'requiresd' diubah menjadi 'required'
            $validated = $request->validate([
                'user_id' => [
                    'required', // Wajib diisi
                    'integer',  // Berupa angka
                    'exists:users,id', // ID tersebut harus benar-benar ada di tabel users
                    'not_in:' . $user->id // Tidak boleh mengirim pesan ke diri sendiri
                ],
            ]);

            // 4. CARI ATAU BUAT RUANG OBROLAN
            // findOrCreateDirect() adalah fungsi bantuan (biasanya di Model Conversation) yang logikanya:
            // - Cek apakah kita sudah pernah chat dengan orang ini sebelumnya. Jika sudah, ambil data chat lamanya.
            // - Jika belum pernah, buatkan ruang chat (Conversation) baru di database.
            $conversation = Conversation::findOrCreateDirect(
                $user, 
                User::findOrFail($validated['user_id'])
            );
            
            // 5. REDIRECT (ALIHKAN HALAMAN)
            // Bawa user ke URL ruang obrolan tersebut, contoh: /chat/5
            return redirect()->route('chat.show', $conversation);
        }
        
        // (Biasanya di sini ada logika tambahan untuk membuat Grup jika 'user_id' kosong)
        return back();
    }
}