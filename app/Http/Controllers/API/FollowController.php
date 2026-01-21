<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\FollowRequest;
use App\Notifications\NewFollowNotification;
use App\Notifications\NewFollowRequestNotification;
use App\Notifications\FollowRequestAcceptedNotification;

class FollowController extends Controller
{
    private function isBlocked(User $me, User $other): bool
    {
        return $me->blockedUsers()->where('users.id', $other->id)->exists()
            || $me->blockedBy()->where('users.id', $other->id)->exists();
    }

    public function follow(Request $request, $id)
    {
        $me = $request->user();
        if ($me->id == $id) {
            return response()->json(['message' => 'Cannot follow yourself'], 400);
        }

        $other = User::findOrFail($id);
        if ($this->isBlocked($me, $other)) {
            return response()->json(['message' => 'Follow is blocked.'], 403);
        }

       
        if ($other->is_private) {
       
            $exists = FollowRequest::where(function ($q) use ($me, $other) {
                $q->where('requester_id', $me->id)->where('recipient_id', $other->id);
            })->first();

            if ($exists) {
                return response()->json(['message' => 'Follow request already exists or pending.'], 400);
            }

            $fr = FollowRequest::create([
                'requester_id' => $me->id,
                'recipient_id' => $other->id,
                'status' => 'pending',
            ]);

            // notify recipient
            $other->notify(new NewFollowRequestNotification($fr));

            return response()->json($fr, 201);
        }

        $me->following()->syncWithoutDetaching([$other->id]);

    
        if ($other->id !== $me->id) {
            $other->notify(new NewFollowNotification($me));
        }

        return response()->json(['message' => 'Followed', 'user_id' => $other->id]);
    }

    public function unfollow(Request $request, $id)
    {
        $me = $request->user();
        $me->following()->detach($id);
        return response()->json(['message' => 'Unfollowed', 'user_id' => $id]);
    }

    public function isFollowing(Request $request, $id)
    {
        $me = $request->user();
        $other = User::findOrFail($id);
        if ($this->isBlocked($me, $other)) {
            return response()->json(['is_following' => false, 'blocked' => true]);
        }
        $isFollowing = $me->following()->where('followed_id', $id)->exists();
        return response()->json(['is_following' => $isFollowing, 'blocked' => false]);
    }

    public function followers(Request $request, $id = null)
    {
        $viewer = $request->user();
        $user = $id ? User::findOrFail($id) : $viewer;
        if ($user->id !== $viewer->id) {
            if ($this->isBlocked($viewer, $user)) {
                return response()->json(['message' => 'Access blocked.'], 403);
            }
            if (!$user->show_followers) {
                return response()->json(['message' => 'Followers are hidden.'], 403);
            }
        }
        return response()->json($user->followers()->get());
    }

    public function following(Request $request, $id = null)
    {
        $viewer = $request->user();
        $user = $id ? User::findOrFail($id) : $viewer;
        if ($user->id !== $viewer->id) {
            if ($this->isBlocked($viewer, $user)) {
                return response()->json(['message' => 'Access blocked.'], 403);
            }
            if (!$user->show_following) {
                return response()->json(['message' => 'Following is hidden.'], 403);
            }
        }
        return response()->json($user->following()->get());
    }

    // follow-request endpoints
    public function sendRequest(Request $request)
    {
        $data = $request->validate(['recipient_id' => 'required|exists:users,id']);
        $me = $request->user();
        $recipient = User::findOrFail($data['recipient_id']);

        if ($me->id === $recipient->id) {
            return response()->json(['message' => 'Cannot request follow to yourself.'], 400);
        }

        if ($this->isBlocked($me, $recipient)) {
            return response()->json(['message' => 'Follow request is blocked.'], 403);
        }

        if (!$recipient->is_private) {
            return response()->json(['message' => 'Recipient is not private; use follow endpoint instead.'], 400);
        }

        $exists = FollowRequest::where(function ($q) use ($me, $recipient) {
            $q->where('requester_id', $me->id)->where('recipient_id', $recipient->id);
        })->first();

        if ($exists) {
            return response()->json(['message' => 'Follow request already exists or pending.'], 400);
        }

        $fr = FollowRequest::create([
            'requester_id' => $me->id,
            'recipient_id' => $recipient->id,
            'status' => 'pending',
        ]);

        $recipient->notify(new NewFollowRequestNotification($fr));

        return response()->json($fr, 201);
    }

    public function listRequests(Request $request)
    {
        $user = $request->user();
        $requests = FollowRequest::where('recipient_id', $user->id)->where('status', 'pending')->with('requester')->get();
        return response()->json($requests);
    }

    public function acceptRequest(Request $request, $id)
    {
        $user = $request->user();
        $fr = FollowRequest::where('id', $id)->where('recipient_id', $user->id)->where('status', 'pending')->firstOrFail();

        $fr->update(['status' => 'accepted']);

        
        $requester = $fr->requester;
        $requester->following()->syncWithoutDetaching([$user->id]);

        // notify requester
        if ($requester) {
            $requester->notify(new FollowRequestAcceptedNotification($fr));
        }

        return response()->json(['message' => 'Follow request accepted.']);
    }

    public function declineRequest(Request $request, $id)
    {
        $user = $request->user();
        $fr = FollowRequest::where('id', $id)->where('recipient_id', $user->id)->where('status', 'pending')->firstOrFail();
        $fr->update(['status' => 'declined']);
        $fr->delete();
        return response()->json(['message' => 'Follow request declined.']);
    }

    public function cancelRequest(Request $request, $id)
    {
        $user = $request->user();
        $fr = FollowRequest::where('id', $id)->where('requester_id', $user->id)->where('status', 'pending')->firstOrFail();
        $fr->update(['status' => 'cancelled']);
        $fr->delete();
        return response()->json(['message' => 'Follow request cancelled.']);
    }
}
