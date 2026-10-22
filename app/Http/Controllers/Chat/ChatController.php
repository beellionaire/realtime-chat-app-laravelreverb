<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    /**
     * FUNGSI INDEX:
     * Menyiapkan dan mengirim data ke halaman utama chat (UI React).
     */
    public function index(Request $request, ?Conversation $conversation = null): Response
    {
        // 1. Ambil data user yang sedang login
        $user = $request->user();

        // 2. Jika membuka room chat spesifik (misal /chat/1), pastikan user adalah anggota obrolan tersebut
        if ($conversation) {
            Gate::authorize('view', $conversation);
        }

        // 3. Ambil daftar obrolan (Sidebar Kiri)
        $conversations = Conversation::forUser($user)
            ->with(['participants', 'lastMessage.sender']) // Hindari N+1 query
            ->orderByDesc('last_message_at') // Urutkan dari yang pesannya paling baru
            ->orderByDesc('id')
            ->get()
            ->map(fn (Conversation $c) => $c->toChatArray($user)) // Format ke array khusus frontend
            ->values();

        // 4. Siapkan tempat kosong untuk pesan
        $messages = null;

        // 5. Ambil riwayat pesan (Panel Kanan) JIKA ada obrolan yang sedang dibuka
        if ($conversation) {
            $messages = $conversation->messages()
                ->with(['sender', 'replyTo.sender', 'reactions.user'])
                ->whereDoesntHave('hiddenFor', fn ($q) => $q->whereKey($user->id)) // Jangan ambil pesan yang sudah dihapus oleh user
                ->orderByDesc('id') 
                ->limit(30) // Ambil 30 pesan terbaru untuk initial load
                ->get()
                ->reverse() // Balik urutannya agar dari atas (lama) ke bawah (baru) di UI
                ->map(fn ($m) => $m->toChatArray()) // Format ke array frontend
                ->values(); // Reset index array
        }

        // 6. Lempar data (props) ke file React: resources/js/Pages/chat/index.tsx
        return Inertia::render('chat/index', [
            'conversations' => $conversations,
            'activeConversation' => $conversation?->toChatArray($user),
            'messages' => $messages,
        ]);
    }

    /**
     * FUNGSI USERS:
     * Endpoint API untuk mencari teman saat ingin membuat obrolan baru.
     */
    public function users(Request $request)
    {
        // 1. Tangkap kata kunci pencarian (misal: ?q=john), jika kosong jadikan string ''
        $query = trim((string) $request->query('q', ''));

        // 2. Lakukan pencarian ke tabel Users
        return User::query()
            ->whereKeyNot($request->user()->id) // Jangan tampilkan diri sendiri di hasil pencarian
            
            // 3. Jika ada input pencarian, cari kecocokan (LIKE) di kolom nama ATAU email
            ->when($query !== '', fn ($q) => $q->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");
            }))
            
            ->orderBy('name') // Urutkan alfabetis
            ->limit(25) // Maksimal kirim 25 data agar respons cepat
            ->get()
            
            // 4. Format data yang dikembalikan. 
            // PENTING: Hanya pilih kolom tertentu untuk mencegah kebocoran data sensitif (password, dsb).
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'avatar_url' => $u->avatar_url,
                'about' => $u->about,
            ]);
    }
}