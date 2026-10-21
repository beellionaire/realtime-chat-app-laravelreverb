<?php

use App\Http\Controllers\Chat\ChatController;
use App\Http\Controllers\Chat\ConversationController;
use App\Http\Controllers\Chat\MessageController;
use Illuminate\Support\Facades\Route;


Route::middleware(['auth', 'verified'])->group(function() {
    
    // chat screen
    Route::get('chat', [ChatController::class, 'index'])->name('chat.index');
    Route::get('chat/users', [ChatController::class, 'users'])->name('chat.users');
    Route::get('chat/{conversation}', [ChatController::class, 'index'])->name('chat.show');

    // Conversation
    Route::post('conversations', [ConversationController::class, 'store'])->name('conversations.store');

    // Messages
    Route::get('conversations/{conversation}/messages', [MessageController::class, 'index'])->name('message.index');
    Route::post('conversations/{conversation}/messages', [MessageController::class, 'store'])->name('message.store');


});