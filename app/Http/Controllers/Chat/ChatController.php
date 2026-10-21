<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Models\Conversation; // Model tabel percakapan
use App\Models\User; // Model tabel pengguna
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate; // Untuk pengecekan hak akses (otorisasi)
use Inertia\Inertia; // Penghubung antara backend (Laravel) dan frontend (React)
use Inertia\Response;

class ChatController extends Controller
{
    /**
     * FUNGSI INDEX: 
     * Merender tampilan utama halaman Chat (Sidebar daftar chat & Panel isi pesan).
     * 
     * @param Request $request - Berasal dari Laravel, berisi data sesi user yang sedang login.
     * @param Conversation $conversation - Berasal dari URL (Route Model Binding). Jika URL-nya /chat/1, Laravel otomatis mencari percakapan ID 1 di database.
     */
    public function index(Request $request, ?Conversation $conversation = null): Response
    {
        // 1. Ambil data user yang sedang login saat ini
        $user = $request->user();

        // 2. Jika user membuka chat spesifik, cek apakah ia berhak (anggota) di chat tersebut.
        // Aturan 'view' ini berasal dari file Policy (misal: ConversationPolicy).
        if ($conversation) {
            Gate::authorize('view', $conversation);
        }

        // 3. AMBIL DAFTAR CHAT (UNTUK SIDEBAR KIRI)
        // forUser($user) adalah fungsi (Local Scope) yang dibuat di dalam Model Conversation untuk menyaring chat milik user ini saja.
        $conversations = Conversation::forUser($user)
            ->with(['participants', 'lastMessage.sender']) // Ambil data peserta dan pesan terakhir sekaligus (mencegah query lambat/N+1)
            ->orderByDesc('last_message_at') // Urutkan dari chat yang paling baru aktif
            ->orderByDesc('id')
            ->get()
            ->map(fn (Conversation $c) => $c->toChatArray($user)) // Ubah format datanya agar sesuai dengan kebutuhan React
            ->values();

        $messages = null;

        // 4. AMBIL RIWAYAT PESAN (UNTUK PANEL KANAN)
        // Hanya dijalankan jika user mengklik salah satu obrolan.
        if ($conversation) {
            $messages = $conversation->messages()
                ->with(['sender', 'replyTo.sender', 'reactions.user']) // Ambil data relasi yang menempel pada pesan
                ->whereDoesntHave('hiddenFor', fn($q) => $q->whereKey($user->id)) // Buang pesan yang sudah dihapus secara lokal oleh user ini
                ->orderByDesc('id') // Ambil dari yang paling baru
                ->limit(30) // Batasi 30 pesan agar loading tidak berat
                ->get()
                ->reverse() // Balik posisinya agar pesan terbaru ada di paling bawah layar
                ->map(fn($m) => $m->toChatArray()) // Format datanya untuk React
                ->values(); // Reset nomor index array
        }

        // 5. KIRIM DATA KE FRONTEND
        // Memanggil file React di folder resources/js/Pages/chat/index.tsx dan mengirimkan 3 variabel (props) ke sana.
        return Inertia::render('chat/index', [
            'conversations' => $conversations,
            'activeConversation' => $conversation?->toChatArray($user),
            'messages' => $messages,
        ]);
    }

    /**
     * FUNGSI USERS: 
     * Digunakan oleh fitur pencarian (Search) saat user ingin membuat pesan/grup baru.
     * Mengembalikan data dalam bentuk JSON, bukan halaman HTML.
     */
    public function users(Request $request)
    {
        // 1. Ambil kata kunci ketikan dari URL (contoh: /chat/users?q=budi). Jika kosong, set sebagai string kosong.
        $query = trim((string) $request->query('q', ''));

        // 2. Cari data pengguna di tabel Users
        return User::query()
            ->whereKeyNot($request->user()->id) // Jangan tampilkan diri sendiri di hasil pencarian
            
            // Jika ada kata kunci, cari yang nama atau email-nya mirip (LIKE)
            ->when($query !== '', fn($q) => $q->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");
            }))
            
            ->orderBy('name') // Urutkan sesuai abjad A-Z
            ->limit(25) // Maksimal tampilkan 25 orang
            ->get()
            
            // 3. Format data yang dikirim. Sengaja dipilih kolom tertentu saja agar tidak membocorkan data rahasia (seperti password/token).
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'avatar_url' => $u->avatar_url,
                'about' => $u->about,
            ]);
    }
}