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

        // 🔹 фильтры из запроса
        $filters = $request->only(['scope', 'from', 'to']);

        // 🔹 кэш с учётом фильтров
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


        $blockedIds = UserBlock::where('blocker_id', $user->id)->pluck('blocked_id');
        $blockedByIds = UserBlock::where('blocked_id', $user->id)->pluck('blocker_id');
        $blocked = $blockedIds->merge($blockedByIds)->unique()->all();

        if (!empty($blocked)) {
            $feed = $feed->filter(
                fn ($post) => !in_array($post->user_id, $blocked, true)
            )->values();
        }

        return response()->json($feed);
    }
}
