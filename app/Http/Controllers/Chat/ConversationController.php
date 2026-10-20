<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function store(Request $request) : RedirectResponse
    {
        $user = $request->user();

        if ($request->filled('user_id')) {
            $validated = $request->validate([
                'user_id' => ['requiresd', 'integer', 'exists:users,id', 'not_in:' . $user->id],
            ]);

            $conversation = Conversation::findOrCreateDirect($user, User::findOrFail($validated['user_id']));
            
            return redirect()->route('chat.show', $conversation);
        }
    }
}
