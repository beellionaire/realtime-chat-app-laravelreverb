<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

#[Fillable(['conversation_id', 'user_id', 'reply_to_id', 'type', 'body', 'attachment_path', 'attachment_name', 'attachment_mime', 'attachment_size', 'edited_at'])]
class Message extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts() : array 
    {
        return [
            'edited_at' => 'timestamp',
            'attachment_size' => 'integer',
        ];
    }

    public function conversation(): BelongsTo 
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender() : BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_id')->withTrashed();
    }

    public function reactions(): HasMany 
    {
        return $this->hasMany(MessageReaction::class);
    }

    public function hiddenFor(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'hidden_messages')->withTimestamps();
    }

    /**
     * Memformat data pesan (Message) menjadi array yang konsisten.
     * Fungsi ini sangat penting agar data yang dikirim via API (Inertia) 
     * dan via WebSocket (Reverb/Broadcasting) memiliki struktur yang persis sama di frontend.
     */
    public function toChatArray(): array 
    {
        return [
            // 1. Data dasar identitas pesan
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'user_id' => $this->user_id,
            'type' => $this->type,
            
            // 2. Keamanan: Jika pesan ditarik/dihapus (soft delete), kirim null agar teks asli tidak bocor ke frontend
            'body' => $this->deleted_at ? null : $this->body,
            'is_deleted' => (bool) $this->deleted_at,
            
            // 3. Konversi format waktu ke standar ISO 8601 agar mudah diolah oleh JavaScript (Date object)
            'edited_at' => $this->edited_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            
            // 4. Menyisipkan sebagian data pengirim (tidak perlu semua kolom user demi privasi & performa)
            'sender' => $this->sender ? [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'avatar_url' => $this->sender->avatar_url
            ] : null,
            
            // 5. Data lampiran: Hanya tampilkan jika file-nya ada DAN pesan tersebut belum dihapus
            'attachment' => ($this->attachment_path && ! $this->deleted_at) ? [
                'url' => Storage::disk('public')->url($this->attachment_path),
                'name' => $this->attachment_name,
                'mime' => $this->attachment_mime,
            ] : null,
            
            // 6. Data cuplikan pesan yang dibalas (Reply)
            'reply_to' => $this->replyTo ? [
                'id' => $this->replyTo->id,
                'body' => $this->replyTo->deleted_at ? null : $this->replyTo->body,
                
                'deleted_at' => (bool) $this->replyTo->deleted_at, 
                
                'type' => $this->replyTo->type,
                'attachment_name' => $this->replyTo->attachment_name,
                'sender_name' => $this->replyTo->sender?->name,
            ] : null,
            
            // 7. Mengolah relasi reaksi (emoticon) dari database menjadi format rekapan/grup
            'reactions' => $this->reactions
                ->groupBy('emoji') // Kelompokkan data berdasarkan jenis emoji yang sama
                ->map(fn($group, $emoji)=> [
                    'emoji' => $emoji,
                    'count' => $group->count(), // Total berapa orang yang memberi emoji ini
                    'user_ids' => $group->pluck('user_id')->all(), // Kumpulan ID user
                    
                    // Mengambil kumpulan nama user untuk keperluan tooltip di frontend saat emoji di-hover
                    'user_names' => $group->map(fn ($r) => $r->user?->name)->filter()->values()->all()
                ])->values()->all()
        ];
    }

}
