<?php

namespace App\Models;

// Import class, trait, dan interface yang dibutuhkan
use App\Models\Conversation;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * Bantuan (hint) untuk IDE text editor agar mengenali kolom database dan tipe datanya.
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */

// Menentukan kolom yang diizinkan untuk diisi secara massal (mass assignable).
#[Fillable(['name', 'email', 'password', 'avatar_path', 'about', 'last_seen_at'])]

// Menyembunyikan kolom sensitif agar tidak tampil saat data model diubah ke array atau JSON.
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]

// Deklarasi model User dengan dukungan autentikasi, kewajiban verifikasi email, dan Passkey.
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    // Mengaktifkan fitur Factory (testing), Notifikasi, Passkey, dan Autentikasi 2 Langkah.
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    // Menyisipkan atribut buatan (kustom) 'avatar_url' ke dalam output array/JSON.
    protected $appends = ['avatar_url'];

    /**
     * Mengonversi tipe data secara otomatis saat mengambil/menyimpan ke database.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime', // Mengubah string tanggal menjadi objek Carbon.
            'password' => 'hashed',            // Mengenkripsi (hash) password secara otomatis saat disimpan.
            'two_factor_confirmed_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    /**
     * Accessor untuk atribut buatan 'avatar_url'.
     * Mengembalikan URL publik dari file foto profil jika 'avatar_path' terisi.
     */
    protected function avatarUrl(): Attribute
    {
        return Attribute::get( fn() => $this->avatar_path
            ? Storage::disk('public')->url($this->avatar_path) : null
        );
    }

    /**
     * Relasi Banyak-ke-Banyak (Many-to-Many) antara User dan Conversation.
     */
    public function conversations(): BelongsToMany {
        // Terhubung menggunakan tabel perantara (pivot) bernama 'conversation_participants'.
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            // Mengambil kolom tambahan dari tabel pivot.
            ->withPivot(['role', 'joined_at', 'last_read_at', 'muted_at'])
            // Mengelola timestamps (created_at, updated_at) pada tabel pivot secara otomatis.
            ->withTimestamps();
    }
}