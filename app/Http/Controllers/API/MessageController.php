<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Message;
use App\Models\User;
use App\Events\MessageSent;
use App\Notifications\NewMessageNotification;

class MessageController extends Controller
{
    private function canMessage(User $sender, User $recipient): bool
    {
        if ($sender->id === $recipient->id) {
            return true;
        }

        $setting = $recipient->messages_visibility ?: 'everyone';
        if ($setting === 'followers') {
            $setting = 'friends';
        }
        if ($setting === 'nobody') {
            return false;
        }
        if ($setting === 'friends') {
            return $sender->friends()->where('users.id', $recipient->id)->exists();
        }

        return true;
    }

    public function inbox(Request $request)
    {
        $user = $request->user();
        $messages = Message::where('recipient_id', $user->id)->with('sender')->latest()->get();
        return response()->json($messages);
    }

    public function send(Request $request)
    {
        $data = $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'body' => 'nullable|string',
            'audio_url' => 'nullable|string',
            'image_url' => 'nullable|string',
            'reply_to_message_id' => 'nullable|exists:messages,id',
        ]);

        $sender = $request->user();
        $recipient = User::find($data['recipient_id']);
        if (!$recipient) {
            return response()->json(['message' => 'Recipient not found.'], 404);
        }

        $senderBlocked = $sender->blockedUsers()->where('users.id', $recipient->id)->exists();
        $recipientBlocked = $sender->blockedBy()->where('users.id', $recipient->id)->exists();
        if ($senderBlocked || $recipientBlocked) {
            return response()->json(['message' => 'Messaging is blocked.'], 403);
        }

        
        if ($recipient && $recipient->is_private) {
          
            $senderIsFriend = $sender->friends()->wherePivot('friend_id', $recipient->id)->exists();
            $recipientIsFriend = $recipient->friends()->wherePivot('friend_id', $sender->id)->exists();
            if (!($senderIsFriend && $recipientIsFriend)) {
                return response()->json(['message' => 'Recipient is private. You must be mutual friends to send messages.'], 403);
            }
        }

        if (!$this->canMessage($sender, $recipient)) {
            return response()->json(['message' => 'Recipient does not accept messages from you.'], 403);
        }

        if (empty($data['body']) && empty($data['audio_url']) && empty($data['image_url'])) {
            return response()->json(['message' => 'Message body or audio is required.'], 422);
        }

        $message = Message::create([
            'sender_id' => $sender->id,
            'recipient_id' => $data['recipient_id'],
            'body' => $data['body'] ?? '',
            'audio_url' => $data['audio_url'] ?? null,
            'image_url' => $data['image_url'] ?? null,
            'reply_to_message_id' => $data['reply_to_message_id'] ?? null,
        ]);

        
        event(new MessageSent($message));

        
        if ($recipient && ($recipient->notifications_enabled ?? true)) {
            $recipient->notify(new NewMessageNotification($message));
            \Log::info('Message notification sent to user ' . $recipient->id);
        }

        return response()->json($message->load(['sender', 'replyTo.sender', 'reactions.user']), 201);
    }

    public function conversation(Request $request, $userId)
    {
        $me = $request->user();
        $other = User::findOrFail($userId);

        $blockedByMe = $me->blockedUsers()->where('users.id', $other->id)->exists();
        $blockedByOther = $me->blockedBy()->where('users.id', $other->id)->exists();
        if ($blockedByMe || $blockedByOther) {
            return response()->json(['message' => 'Messaging is blocked.'], 403);
        }

        // Block access 
        if ($me->id !== $other->id && $other->is_private) {
            $meIsFriend = $me->friends()->where('friends.friend_id', $other->id)->exists();
            $otherIsFriend = $other->friends()->where('friends.friend_id', $me->id)->exists();
            if (!($meIsFriend && $otherIsFriend)) {
                return response()->json(['message' => 'Recipient is private. You must be mutual friends to view conversation.'], 403);
            }
        }

        // Allow reading conversation even if messaging is restricted

        $limit = (int) $request->query('limit', 100); // limit to latest N messages by default

        $query = Message::where(function ($q) use ($me, $other) {
            $q->where('sender_id', $me->id)->where('recipient_id', $other->id);
        })->orWhere(function ($q) use ($me, $other) {
            $q->where('sender_id', $other->id)->where('recipient_id', $me->id);
        })->where(function ($q) use ($me) {
            $q->whereNull('deleted_by')->orWhere('deleted_by', '!=', $me->id);
        })->with(['sender', 'replyTo.sender', 'reactions.user'])
          ->orderBy('created_at', 'desc')
          ->limit($limit)
          ->get()
          ->reverse()
          ->values();

        // Mark messages as read for the current user
        Message::where('recipient_id', $me->id)
            ->where('sender_id', $other->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json($query);
    }

    public function pinned(Request $request, $userId)
    {
        $me = $request->user();
        $other = User::findOrFail($userId);

        $blockedByMe = $me->blockedUsers()->where('users.id', $other->id)->exists();
        $blockedByOther = $me->blockedBy()->where('users.id', $other->id)->exists();
        if ($blockedByMe || $blockedByOther) {
            return response()->json(['message' => 'Messaging is blocked.'], 403);
        }

        $pinned = Message::where(function ($q) use ($me, $other) {
            $q->where('sender_id', $me->id)->where('recipient_id', $other->id);
        })->orWhere(function ($q) use ($me, $other) {
            $q->where('sender_id', $other->id)->where('recipient_id', $me->id);
        })->where('is_pinned', true)
            ->where(function ($q) use ($me) {
                $q->whereNull('deleted_by')->orWhere('deleted_by', '!=', $me->id);
            })
            ->with(['sender', 'replyTo.sender'])
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($pinned);
    }

    public function pin(Request $request, $id)
    {
        $me = $request->user();
        $message = Message::findOrFail($id);

        if ($message->sender_id !== $me->id && $message->recipient_id !== $me->id) {
            return response()->json(['message' => 'Not allowed.'], 403);
        }

        if ($message->is_pinned) {
            return response()->json($message->load(['sender', 'replyTo.sender']));
        }

        $message->update([
            'is_pinned' => true,
            'pinned_by' => $me->id,
        ]);

        $otherId = $message->sender_id === $me->id ? $message->recipient_id : $message->sender_id;
        $label = $message->body ? $message->body : ($message->image_url ? '[Photo]' : ($message->audio_url ? '[Audio]' : '[Message]'));
        Message::create([
            'sender_id' => $me->id,
            'recipient_id' => $otherId,
            'body' => '[[system]]' . $me->name . ' pinned a message: ' . $label . '[[/system]]',
        ]);

        return response()->json($message->load(['sender', 'replyTo.sender']));
    }

    public function unpin(Request $request, $id)
    {
        $me = $request->user();
        $message = Message::findOrFail($id);

        if ($message->sender_id !== $me->id && $message->recipient_id !== $me->id) {
            return response()->json(['message' => 'Not allowed.'], 403);
        }

        $message->update([
            'is_pinned' => false,
            'pinned_by' => null,
        ]);

        return response()->json($message->load(['sender', 'replyTo.sender']));
    }

    
    public function subscribe(Request $request)
    {
        $user = $request->user();
        $sinceId = (int) $request->query('since_id', 0);

        $timeout = 25; 
        $interval = 1; 
        $started = time();

        while ((time() - $started) < $timeout) {
            $messages = Message::where('recipient_id', $user->id)
                ->where('id', '>', $sinceId)
                ->select(['id', 'sender_id', 'recipient_id', 'body', 'created_at'])
                ->orderBy('id', 'asc')
                ->get();

            if ($messages->isNotEmpty()) {
                return response()->json(['messages' => $messages]);
            }

            
            sleep($interval);
            
        }

        
        return response()->json(['messages' => []]);
    }

    public function deleteConversation(Request $request, $userId)
    {
        $me = $request->user();
        $other = User::findOrFail($userId);

        if ($request->isMethod('delete')) {
            // Delete for all
            Message::where(function ($q) use ($me, $other) {
                $q->where('sender_id', $me->id)->where('recipient_id', $other->id);
            })->orWhere(function ($q) use ($me, $other) {
                $q->where('sender_id', $other->id)->where('recipient_id', $me->id);
            })->delete();
            return response()->json(['message' => 'Conversation deleted for all.']);
        } elseif ($request->isMethod('patch')) {
            // Delete for me
            Message::where(function ($q) use ($me, $other) {
                $q->where('sender_id', $me->id)->where('recipient_id', $other->id);
            })->orWhere(function ($q) use ($me, $other) {
                $q->where('sender_id', $other->id)->where('recipient_id', $me->id);
            })->update(['deleted_by' => $me->id]);
            return response()->json(['message' => 'Conversation deleted for you.']);
        }

        return response()->json(['message' => 'Invalid method'], 405);
    }

    public function deleteMessage(Request $request, $id)
    {
        $me = $request->user();
        $message = Message::findOrFail($id);

        // Only sender can delete
        if ($message->sender_id !== $me->id) {
            return response()->json(['message' => 'You can only delete your own messages.'], 403);
        }

        $message->delete();
        return response()->json(['message' => 'Message deleted.']);
    }
}


