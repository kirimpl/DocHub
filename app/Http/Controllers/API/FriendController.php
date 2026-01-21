<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FriendRequest;
use App\Models\User;
use App\Notifications\NewFriendRequestNotification;
use App\Notifications\FriendRequestAcceptedNotification;
use Illuminate\Support\Facades\DB;

class FriendController extends Controller
{
    private function isBlocked(User $me, User $other): bool
    {
        return $me->blockedUsers()->where('users.id', $other->id)->exists()
            || $me->blockedBy()->where('users.id', $other->id)->exists();
    }

    public function index(Request $request)
    {
        $user = $request->user();
        return response()->json($user->friends()->get());
    }

    public function sendRequest(Request $request)
    {
        $data = $request->validate([
            'recipient_id' => 'required|exists:users,id',
        ]);

        $me = $request->user();
        $recipientId = (int) $data['recipient_id'];

        if ($me->id === $recipientId) {
            return response()->json(['message' => 'Cannot send friend request to yourself.'], 400);
        }

        $recipient = User::findOrFail($recipientId);
        if ($this->isBlocked($me, $recipient)) {
            return response()->json(['message' => 'Friend request is blocked.'], 403);
        }

        
        if ($me->friends()->where('users.id', $recipientId)->exists()) {
            return response()->json(['message' => 'Already friends.'], 400);
        }

        
        $exists = FriendRequest::where(function ($q) use ($me, $recipientId) {
            $q->where('requester_id', $me->id)->where('recipient_id', $recipientId)->where('status', 'pending');
        })->orWhere(function ($q) use ($me, $recipientId) {
            $q->where('requester_id', $recipientId)->where('recipient_id', $me->id)->where('status', 'pending');
        })->first();

        if ($exists) {
            return response()->json(['message' => 'Request already exists or pending.'], 400);
        }

        // Delete any existing requests between them to avoid unique constraint
        FriendRequest::where(function ($q) use ($me, $recipientId) {
            $q->where('requester_id', $me->id)->where('recipient_id', $recipientId);
        })->orWhere(function ($q) use ($me, $recipientId) {
            $q->where('requester_id', $recipientId)->where('recipient_id', $me->id);
        })->delete();

        $fr = FriendRequest::create([
            'requester_id' => $me->id,
            'recipient_id' => $recipientId,
            'status' => 'pending',
        ]);

        // notify recipient of friend request
        if ($recipient && ($recipient->notifications_enabled ?? true)) {
            $recipient->notify(new NewFriendRequestNotification($fr));
        }

        return response()->json($fr, 201);
    }

    public function listRequests(Request $request)
    {
        $user = $request->user();
        $requests = FriendRequest::where('recipient_id', $user->id)->where('status', 'pending')->with('requester')->get();
        return response()->json($requests);
    }

    public function acceptRequest(Request $request, $id)
    {
        $user = $request->user();

       
        $fr = FriendRequest::where('id', $id)->first();
        if (!$fr) {
            return response()->json(['message' => 'Friend request not found by id', 'id' => $id], 404);
        }

        if ($fr->recipient_id !== $user->id) {
            return response()->json(['message' => 'Not the recipient', 'recipient_id' => $fr->recipient_id, 'current_user_id' => $user->id], 403);
        }

        if ($fr->status !== 'pending') {
            return response()->json(['message' => 'Friend request is not pending', 'status' => $fr->status], 400);
        }

        $requester = $fr->requester;
        if ($requester && $this->isBlocked($user, $requester)) {
            return response()->json(['message' => 'Friend request is blocked.'], 403);
        }

        DB::transaction(function () use ($fr, $user) {
            $fr->update(['status' => 'accepted']);

            $requester = $fr->requester;

            $requester->friends()->syncWithoutDetaching([$user->id]);
            $user->friends()->syncWithoutDetaching([$requester->id]);

            // notify requester
            if ($requester && ($requester->notifications_enabled ?? true)) {
                $requester->notify(new FriendRequestAcceptedNotification($fr));
            }
        });

        return response()->json(['message' => 'Friend request accepted.']);
    }

    public function declineRequest(Request $request, $id)
    {
        $user = $request->user();
        $fr = FriendRequest::where('id', $id)->where('recipient_id', $user->id)->where('status', 'pending')->firstOrFail();
        $fr->update(['status' => 'declined']);
        $fr->delete();
        return response()->json(['message' => 'Friend request declined.']);
        
    }

    public function cancelRequest(Request $request, $id)
    {
        $user = $request->user();
        $fr = FriendRequest::where('id', $id)->where('requester_id', $user->id)->where('status', 'pending')->firstOrFail();
        $fr->update(['status' => 'cancelled']);
        $fr->delete();
        return response()->json(['message' => 'Friend request cancelled.']);
    }

    public function removeFriend(Request $request, $id)
    {
        $user = $request->user();
        $other = User::findOrFail($id);

        $user->friends()->detach($other->id);
        $other->friends()->detach($user->id);

        // Delete any friend requests between them
        FriendRequest::where(function ($q) use ($user, $other) {
            $q->where('requester_id', $user->id)->where('recipient_id', $other->id);
        })->orWhere(function ($q) use ($user, $other) {
            $q->where('requester_id', $other->id)->where('recipient_id', $user->id);
        })->delete();

        return response()->json(['message' => 'Friend removed.']);
    }

    public function sentRequests(Request $request)
    {
        $user = $request->user();
        $sentRequests = FriendRequest::where('requester_id', $user->id)
            ->where('status', 'pending')
            ->with('recipient:id,name,email,avatar,is_online')
            ->get()
            ->map(function ($fr) {
                return [
                    'id' => $fr->id,
                    'recipient' => $fr->recipient,
                    'created_at' => $fr->created_at,
                ];
            });

        return response()->json($sentRequests);
    }
}
