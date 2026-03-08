<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\UserBlock;

class FeedController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $filters = $request->only(['scope', 'from', 'to', 'organization']);
        $perPage = (int) $request->query('per_page', 0);
        $allowedScopes = ['all', 'global', 'organization', 'local', 'mine'];

        if (!empty($filters['scope']) && !in_array($filters['scope'], $allowedScopes, true)) {
            return response()->json(['message' => 'Invalid scope value.'], 422);
        }
        if (!empty($filters['organization']) && $filters['organization'] !== $user->work_place) {
            return response()->json(['message' => 'Organization filter is not allowed.'], 403);
        }

        $blockedIds = UserBlock::where('blocker_id', $user->id)->pluck('blocked_id');
        $blockedByIds = UserBlock::where('blocked_id', $user->id)->pluck('blocker_id');
        $blocked = $blockedIds->merge($blockedByIds)->unique()->all();

        if ($perPage > 0) {
            $perPage = max(1, min($perPage, 100));
            $query = Post::with('user')
                ->with(['likes' => fn ($q) => $q->where('user_id', $user->id)])
                ->withCount(['likes', 'comments'])
                ->feedVisible($user)
                ->filter($filters, $user)
                ->latest();
            if (!empty($blocked)) {
                $query->whereNotIn('user_id', $blocked);
            }
            return response()->json($query->paginate($perPage));
        }

        $cacheKey = 'feed:' . $user->id . ':' . md5(json_encode($filters));
        $feed = cache()->remember($cacheKey, 15, function () use ($user, $filters) {
            return Post::with('user')
                ->with(['likes' => fn ($q) => $q->where('user_id', $user->id)])
                ->withCount(['likes', 'comments'])
                ->feedVisible($user)
                ->filter($filters, $user)
                ->latest()
                ->get();
        });

        if (!empty($blocked)) {
            $feed = $feed->filter(
                fn ($post) => !in_array($post->user_id, $blocked, true)
            )->values();
        }

        return response()->json($feed);
    }

    public function global(Request $request)
    {
        $request->merge(['scope' => 'global']);
        return $this->index($request);
    }

    public function organization(Request $request)
    {
        $request->merge(['scope' => 'organization']);
        return $this->index($request);
    }
}
