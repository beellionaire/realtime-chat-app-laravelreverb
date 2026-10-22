<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Events\MessageSent; // Mengimpor event kurir WebSocket

class MessageController extends Controller
{
    /**
     * FUNGSI INDEX:
     * Digunakan oleh fitur "Infinite Scroll" di React untuk menarik riwayat pesan lama
     * saat user menggulung layar ke atas.
     */
    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        // 1. Keamanan: Pastikan user yang me-request adalah anggota obrolan ini
        Gate::authorize('view', $conversation);

        // 2. Validasi: Tangkap parameter 'before' (ID pesan paling atas di layar saat ini)
        $validated = $request->validate([
            'before' => ['required', 'integer'],
        ]);

        // 3. Tarik data riwayat pesan dari database
        $messages = $conversation->messages()
            ->with(['sender', 'replyTo.sender', 'reactions.user']) // Tarik relasi sekaligus (mencegah N+1 query lambat)
            ->whereDoesntHave('hiddenFor', fn ($q) => $q->whereKey($request->user()->id)) // Abaikan pesan yang sudah dihapus lokal
            ->where('id', '<', $validated['before']) // KUNCI UTAMA: Ambil pesan yang ID-nya lebih kecil (lebih lama) dari patokan
            ->orderByDesc('id') // Urutkan dari yang terbaru ke terlama
            ->limit(30) // Tarik maksimal 30 pesan saja agar tidak berat
            ->get();

        // 4. Kirim data ke frontend (React)
        return response()->json([
            // Kembalikan urutannya (terlama di atas, terbaru di bawah) agar tidak terbalik saat dirender React
            'messages' => $messages->reverse()->map(fn (Message $m) => $m->toChatArray())->values(),
            // Beri tahu frontend apakah masih ada sisa pesan lama yang bisa di-scroll lagi
            'has_more' => $messages->count() === 30, 
        ]);
    }

    /**
     * FUNGSI STORE:
     * Digunakan untuk memproses pengiriman pesan baru dan menyiarkannya secara real-time.
     */
    public function store(Request $request, Conversation $conversation): JsonResponse
    {
        // 1. Keamanan: Pastikan user berhak mengirim pesan ke ruang chat ini
        Gate::authorize('view', $conversation);

        // 2. Validasi: Pastikan isi pesan tidak kosong dan maksimal 5000 karakter
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        // 3. Simpan pesan baru tersebut ke dalam database
        $message = $conversation->messages()->create([
            'user_id' => $request->user()->id,
            'type' => 'text',
            'body' => $validated['body'],
        ]);

        // 4. Update waktu aktif obrolan (agar obrolan ini naik ke urutan teratas di Sidebar kiri)
        $conversation->forceFill(['last_message_at' => $message->created_at])->save();

        // 5. Tandai sudah dibaca: Logikanya, jika Anda mengirim pesan, berarti 
        // Anda sudah melihat dan membaca semua isi obrolan tersebut sampai detik ini.
        $request->user()->conversations()
            ->updateExistingPivot($conversation->id, ['last_read_at' => $message->created_at]);

        // 6. REAL-TIME BROADCAST: 
        // Lemparkan data pesan baru ini ke WebSockets (Laravel Reverb) agar langsung 
        // muncul di layar lawan bicara Anda.
        // toOthers() memastikan pesan ini TIDAK dipantulkan balik ke layar Anda sendiri (mencegah duplikat).
        broadcast(new MessageSent($message))->toOthers();

        // 7. Kembalikan data pesan yang sukses dibuat ke layar Anda (pengirim)
        return response()->json(['message' => $message->toChatArray()], 201);
    }
}