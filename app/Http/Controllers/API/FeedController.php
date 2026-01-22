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
        if ($post->is_global) {
            return true;
        }
        $viewerOrg = $viewer->work_place;
        if ($viewerOrg && $post->organization_name && $viewerOrg === $post->organization_name) {
            return true;
        }
        return false;
    }
    public function index(Request $request)
    {
        $user = $request->user();

        $blockedIds = UserBlock::where('blocker_id', $user->id)->pluck('blocked_id');
        $blockedByIds = UserBlock::where('blocked_id', $user->id)->pluck('blocker_id');
        $blocked = $blockedIds->merge($blockedByIds)->unique()->values()->all();

        $cacheKey = "feed:user:{$user->id}";

        $feed = cache()->remember($cacheKey, 15, function () use ($user) {
            $query = Post::with('user')
                ->with(['likes' => function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                }])
                ->withCount(['likes', 'comments'])
                ->latest();

            $query->where(function ($q) use ($user) {
                $q->where('is_global', true)
                    ->orWhere('user_id', $user->id);

                if ($user->work_place) {
                    $q->orWhere('organization_name', $user->work_place);
                }
            });

            return $query->get();
        });

        if (!empty($blocked)) {
            $feed = $feed->filter(fn ($post) => !in_array($post->user_id, $blocked, true))->values();
        }
        $feed = $feed->filter(fn ($post) => $this->canSeePost($user, $post))->values();

        return response()->json($feed);
    }
}
