<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ConversationPolicy
{
    /**
     * any participant can view the conversation and send message to it
     */

    public function view(User $user, Conversation $conversation): bool
    {
        return $conversation->hasParticipant($user);
    }

    /**
     * Only group admin can rename, change avatar, or manage members
     * direct conversation are never manage
     */
    public function manage(User $user, Conversation $conversation): bool
    {
        return $conversation->is_group() && $conversation->is_admin($user);
    }


}
