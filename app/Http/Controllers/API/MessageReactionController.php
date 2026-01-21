<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\MessageReaction;

class MessageReactionController extends Controller
{
    public function toggle(Request $request, $id)
    {
        $data = $request->validate([
            'emoji' => 'required|string|max:16',
        ]);

        $user = $request->user();
        $message = Message::findOrFail($id);

        $reaction = MessageReaction::where('message_id', $message->id)
            ->where('user_id', $user->id)
            ->where('emoji', $data['emoji'])
            ->first();

        if ($reaction) {
            $reaction->delete();
        } else {
            MessageReaction::create([
                'message_id' => $message->id,
                'user_id' => $user->id,
                'emoji' => $data['emoji'],
            ]);
        }

        $reactions = MessageReaction::where('message_id', $message->id)
            ->with('user')
            ->get();

        return response()->json([
            'message_id' => $message->id,
            'reactions' => $reactions,
        ]);
    }
}
