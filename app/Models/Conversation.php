<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['type','name','avatar_path','created_by','last_message_by'])]
class Conversation extends Model
{

    use HasFactory;

    protected function casts(): array 
    {
        return [
            'last_message_at' => 'datetime'
        ];
    }

    public function participants(): BelongsToMany 
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot(['role','joined_at','last_read_at','muted_at'])
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function lastMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    public function is_group(): bool
    {
        return $this->type === 'group';
    }

    public function otherParticipant(User $user): ?User 
    {
        return $this->participants->firstWhere('id', '!=', $user->id);
    }

    public function hasParticipant(User $user): bool
    {
        return $this->participants()->whereKey($user->id)->exists();
    }

    public function is_admin(User $user): bool 
    {
        $participant = $this->participants()->whereKey($user->id)->first();

        return $participant?->pivot->role === 'admin';

    }

    public function scopeForUser(Builder $query, User $user) : Builder
    {
        return $query->whereHas('participants', fn (Builder $q) => $q->whereKey($user->id));
    }

    public static function findOrCreateDirect(User $a, User $b): self
    {
        $existing = static::query()
            ->where('type', 'direct')
            ->whereHas('participants', fn (Builder $q) => $q->whereKey($a->id))
            ->whereHas('participants', fn (Builder $q) => $q->whereKey($b->id))
            ->first();

        if ($existing) {
            return $existing;
        }

        $conversation = static::create([
            'type' => 'direct',
            'created_by' => $a->id,
        ]);

        $conversation->participants()->attach([
            $a->id => ['joined_at' => now()],
            $b->id => ['joined_at' => now()],
        ]);

        return $conversation;

    } 

    public function addSystemMessage(string $body) : Message 
    {
        $message = $this->messages()->create([
            'type' => 'system',
            'body' => $body,
        ]);

        $this->update(['last_message_at' => $message->created_at]);

        return $message;

    }

}
