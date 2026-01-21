<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ChatGroup;
use App\Models\ChatGroupMessage;

class ChatGroupMessageController extends Controller
{
    private function ensureMember(ChatGroup $group, $userId): bool
    {
        return $group->members()->where('users.id', $userId)->exists();
    }

    public function index(Request $request, $groupId)
    {
        $user = $request->user();
        $group = ChatGroup::findOrFail($groupId);
        if (!$this->ensureMember($group, $user->id)) {
            return response()->json(['message' => 'Not a member of this group.'], 403);
        }

        $limit = (int) $request->query('limit', 100);
        $messages = ChatGroupMessage::where('chat_group_id', $group->id)
            ->with(['sender', 'replyTo.sender', 'reactions.user'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();

        return response()->json($messages);
    }

    public function pinned(Request $request, $groupId)
    {
        $user = $request->user();
        $group = ChatGroup::findOrFail($groupId);
        if (!$this->ensureMember($group, $user->id)) {
            return response()->json(['message' => 'Not a member of this group.'], 403);
        }

        $messages = ChatGroupMessage::where('chat_group_id', $group->id)
            ->where('is_pinned', true)
            ->with(['sender', 'replyTo.sender'])
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    public function store(Request $request, $groupId)
    {
        $user = $request->user();
        $group = ChatGroup::findOrFail($groupId);
        if (!$this->ensureMember($group, $user->id)) {
            return response()->json(['message' => 'Not a member of this group.'], 403);
        }

        $data = $request->validate([
            'body' => 'nullable|string',
            'audio_url' => 'nullable|string',
            'image_url' => 'nullable|string',
            'reply_to_message_id' => 'nullable|exists:chat_group_messages,id',
        ]);

        if (empty($data['body']) && empty($data['audio_url']) && empty($data['image_url'])) {
            return response()->json(['message' => 'Message body or audio is required.'], 422);
        }

        $message = ChatGroupMessage::create([
            'chat_group_id' => $group->id,
            'sender_id' => $user->id,
            'body' => $data['body'] ?? '',
            'reply_to_message_id' => $data['reply_to_message_id'] ?? null,
            'is_system' => false,
            'audio_url' => $data['audio_url'] ?? null,
            'image_url' => $data['image_url'] ?? null,
        ]);

        return response()->json($message->load(['sender', 'replyTo.sender', 'reactions.user']), 201);
    }

    public function joinNotify(Request $request, $groupId)
    {
        return response()->noContent();
    }

    public function destroy(Request $request, $groupId, $messageId)
    {
        $user = $request->user();
        $group = ChatGroup::findOrFail($groupId);
        if (!$this->ensureMember($group, $user->id)) {
            return response()->json(['message' => 'Not a member of this group.'], 403);
        }

        $message = ChatGroupMessage::where('chat_group_id', $group->id)->findOrFail($messageId);
        if ($message->sender_id !== $user->id) {
            return response()->json(['message' => 'You can only delete your own messages.'], 403);
        }

        $message->delete();
        return response()->json(['message' => 'Message deleted.']);
    }

    public function pin(Request $request, $groupId, $messageId)
    {
        $user = $request->user();
        $group = ChatGroup::findOrFail($groupId);
        if (!$this->ensureMember($group, $user->id)) {
            return response()->json(['message' => 'Not a member of this group.'], 403);
        }

        $message = ChatGroupMessage::where('chat_group_id', $group->id)->findOrFail($messageId);
        if ($message->is_system) {
            return response()->json(['message' => 'Cannot pin system messages.'], 400);
        }

        if ($message->is_pinned) {
            return response()->json($message->load(['sender', 'replyTo.sender']));
        }

        $message->update([
            'is_pinned' => true,
            'pinned_by' => $user->id,
        ]);

        $label = $message->body ? $message->body : ($message->image_url ? '[Photo]' : ($message->audio_url ? '[Audio]' : '[Message]'));
        ChatGroupMessage::create([
            'chat_group_id' => $group->id,
            'sender_id' => $user->id,
            'body' => $user->name . ' pinned a message: ' . $label,
            'is_system' => true,
        ]);

        return response()->json($message->load(['sender', 'replyTo.sender']));
    }

    public function unpin(Request $request, $groupId, $messageId)
    {
        $user = $request->user();
        $group = ChatGroup::findOrFail($groupId);
        if (!$this->ensureMember($group, $user->id)) {
            return response()->json(['message' => 'Not a member of this group.'], 403);
        }

        $message = ChatGroupMessage::where('chat_group_id', $group->id)->findOrFail($messageId);
        if ($message->is_system) {
            return response()->json(['message' => 'Cannot unpin system messages.'], 400);
        }

        $message->update([
            'is_pinned' => false,
            'pinned_by' => null,
        ]);

        return response()->json($message->load(['sender', 'replyTo.sender']));
    }
}
