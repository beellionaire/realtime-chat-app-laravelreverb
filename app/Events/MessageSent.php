<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Memastikan event langsung disiarkan, tidak masuk antrean (queue)
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * CLASS EVENT: MessageSent
 * Bertindak sebagai "Kurir" yang membawa data pesan baru dari Laravel 
 * untuk disiarkan ke server WebSocket (Laravel Reverb).
 * implements ShouldBroadcastNow menandakan siaran dilakukan secara instan/saat itu juga.
 */
class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * FUNGSI CONSTRUCTOR:
     * Dijalankan otomatis saat controller memanggil: new MessageSent($message)
     */
    public function __construct(public Message $message)
    {
        // Pastikan kelengkapan data terlampir (info pengirim, pesan yang dibalas, reaksi).
        // loadMissing() sangat efisien: hanya menarik data relasi dari database JIKA sebelumnya belum ditarik.
        $this->message->loadMissing(['sender', 'replyTo.sender', 'reactions']);
    }

    /**
     * FUNGSI BROADCAST ON:
     * Menentukan "Saluran/Kanal" mana yang digunakan untuk menyiarkan pesan ini.
     * 
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            // Memakai PrivateChannel agar data rahasia terlindungi.
            // Hanya user yang memiliki akses ke obrolan ini (conversation.{id}) yang diizinkan mendengarkan.
            new PrivateChannel('conversation.' . $this->message->conversation_id),
        ];
    }

    /**
     * FUNGSI BROADCAST WITH:
     * Menentukan "Isi Paket Data" (Payload JSON) yang sesungguhnya dikirimkan ke Frontend (React).
     */
    public function broadcastWith(): array 
    {
        return [
            // Format objek Message mentah dari Laravel menjadi struktur Array khusus
            // agar sesuai dengan kebutuhan tipe data (Interface ChatMessage) di React Anda.
            'message' => $this->message->toChatArray(),
        ];
    }
}