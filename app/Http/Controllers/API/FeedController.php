<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\UserBlock;

class FeedController extends Controller
{
    private function canSeePost($viewer, Post $post): bool
    {
        if ($viewer->id === $post->user_id) {
            return true;
        }
        $owner = $post->user;
        $visibility = $owner ? ($owner->posts_visibility ?: 'everyone') : 'everyone';
        if ($visibility === 'followers') {
            $visibility = 'friends';
        }
        if ($visibility === 'nobody') {
            return false;
        }
        if ($visibility === 'friends') {
            return $viewer->friends()->where('users.id', $post->user_id)->exists();
        }
        if ($post->is_public) {
            return true;
        }
        return $viewer->friends()->where('users.id', $post->user_id)->exists();
    }
    public function index(Request $request)
    {
        $user = $request->user();

        $blockedIds = UserBlock::where('blocker_id', $user->id)->pluck('blocked_id');
        $blockedByIds = UserBlock::where('blocked_id', $user->id)->pluck('blocker_id');
        $blocked = $blockedIds->merge($blockedByIds)->unique()->values()->all();

        $cacheKey = "feed:user:{$user->id}";

        $feed = cache()->remember($cacheKey, 15, function () use ($user) {
            return Post::where('is_public', true)
                ->with('user')
                ->with(['likes' => function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                }])
                ->withCount(['likes', 'comments'])
                ->latest()
                ->get();
        });

        if (!empty($blocked)) {
            $feed = $feed->filter(fn ($post) => !in_array($post->user_id, $blocked, true))->values();
        }
        $feed = $feed->filter(fn ($post) => $this->canSeePost($user, $post))->values();

        return response()->json($feed);
    }
}
