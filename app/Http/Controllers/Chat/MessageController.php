<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MessageController extends Controller
{
    /**
     * FUNGSI INDEX:
     * Digunakan untuk mengambil riwayat pesan lama saat user melakukan scroll 
     * ke atas di dalam ruang chat (Infinite Scroll / Pagination).
     */
    public function index(Request $request, Conversation $conversation) : JsonResponse
    {
        // 1. Keamanan: Pastikan user yang merequest benar-benar anggota dari percakapan ini
        // PERBAIKAN: Menambahkan titik koma (;) di akhir baris ini
        Gate::authorize('view', $conversation); 
        
        // 2. Validasi: Pastikan frontend mengirimkan ID pesan terakhir ('before') sebagai patokan batas
        $validated = $request->validate([
            'before' => ['required', 'integer']
        ]);

        // 3. Mengambil data pesan dari database
        $messages = $conversation->messages()
            // Eager loading: Tarik data pengirim, data pesan yang dibalas, dan user yang memberi reaksi
            // PERBAIKAN: 'reactions.sender' diubah menjadi 'reactions.user' agar sesuai dengan struktur tabel
            ->with(['sender', 'replyTo.sender', 'reactions.user'])
            
            // Jangan ambil pesan yang sudah "disembunyikan" (dihapus lokal) oleh user ini
            ->whereDoesntHave('hiddenFor', fn ($q) => $q->whereKey($request->user()->id))
            
            // KUNCI INFINITE SCROLL: Hanya ambil pesan yang ID-nya LEBIH KECIL (lebih lama) dari ID pesan paling atas di layar
            ->where('id', '<', $validated['before'])
            
            ->orderByDesc('id') // Urutkan dari yang terbaru ke terlama
            ->limit(30)         // Batasi maksimal 30 pesan sekali tarik (agar aplikasi tidak lemot)
            ->get();

        // 4. Kirim respons ke frontend (React)
        return response()->json([
            // Di-reverse agar urutannya kembali normal (terlama di atas, terbaru di bawah),
            // lalu format datanya menggunakan toChatArray() agar bisa langsung dibaca React.
            'messages' => $messages->reverse()->map(fn (Message $m) => $m->toChatArray())->values(),
            
            // Beritahu frontend apakah masih ada sisa pesan lama yang bisa di-scroll lagi
            'has_more' => $messages->count() === 30
        ]);
    }

    /**
     * FUNGSI STORE:
     * Digunakan ketika user mengetik pesan baru dan menekan tombol "Kirim" / "Enter".
     */
    public function store(Request $request, Conversation $conversation): JsonResponse 
    {
        // 1. Keamanan: Pastikan user berhak mengirim pesan ke ruang obrolan ini
        Gate::authorize('view', $conversation);

        // 2. Validasi: Pastikan pesan tidak kosong dan panjangnya maksimal 5000 karakter
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        // 3. Simpan pesan baru ke database (tabel messages)
        $message = $conversation->messages()->create([
            'user_id' => $request->user()->id,
            'type' => 'text',
            'body' => $validated['body']
        ]);

        // 4. Update waktu "pesan terakhir" di tabel percakapan (untuk mengurutkan posisi chat di Sidebar)
        $conversation->update(['last_message_at' => $message->created_at]);

        // 5. Update waktu "terakhir dibaca" untuk user yang mengirim pesan. 
        // Secara logika, jika Anda mengirim pesan, berarti Anda sudah membaca semua pesan di ruangan tersebut hingga detik itu.
        // PERBAIKAN: Mengubah 'conversation()' menjadi bentuk jamak 'conversations()' karena ini relasi HasMany/BelongsToMany
        $request->user()->conversations()
            ->updateExistingPivot($conversation->id, ['last_read_at' => $message->created_at]);
        
        // 6. Kembalikan data pesan yang baru dibuat ke frontend dengan kode status 201 (Created)
        return response()->json(['message' => $message->toChatArray()], 201);
    }
}