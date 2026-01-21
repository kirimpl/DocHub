<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ChatGroup;
use App\Models\ChatGroupMessage;
use App\Models\ChatGroupMessageReaction;

class ChatGroupMessageReactionController extends Controller
{
    public function toggle(Request $request, $groupId, $messageId)
    {
        $data = $request->validate([
            'emoji' => 'required|string|max:16',
        ]);

        $user = $request->user();
        $group = ChatGroup::findOrFail($groupId);
        if (!$group->members()->where('users.id', $user->id)->exists()) {
            return response()->json(['message' => 'Not a member of this group.'], 403);
        }

        $message = ChatGroupMessage::where('chat_group_id', $group->id)->findOrFail($messageId);

        $reaction = ChatGroupMessageReaction::where('chat_group_message_id', $message->id)
            ->where('user_id', $user->id)
            ->where('emoji', $data['emoji'])
            ->first();

        if ($reaction) {
            $reaction->delete();
        } else {
            ChatGroupMessageReaction::create([
                'chat_group_message_id' => $message->id,
                'user_id' => $user->id,
                'emoji' => $data['emoji'],
            ]);
        }

        $reactions = ChatGroupMessageReaction::where('chat_group_message_id', $message->id)
            ->with('user')
            ->get();

        return response()->json([
            'message_id' => $message->id,
            'reactions' => $reactions,
        ]);
    }
}
