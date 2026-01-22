<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Post;
use App\Models\UserBlock;

class SearchController extends Controller
{
    private function canSeePost(User $viewer, Post $post): bool
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
    public function search(Request $request)
    {
        $q = $request->query('q');
        if (!$q) {
            return response()->json(['users' => [], 'posts' => []]);
        }

        $viewer = $request->user();
        $blockedIds = UserBlock::where('blocker_id', $viewer->id)->pluck('blocked_id');
        $blockedByIds = UserBlock::where('blocked_id', $viewer->id)->pluck('blocker_id');
        $blocked = $blockedIds->merge($blockedByIds)->unique()->values()->all();

        $usersQuery = User::where(function ($query) use ($q) {
            $query->where('name', 'like', "%{$q}%")
                ->orWhere('last_name', 'like', "%{$q}%");
        });
        if (!empty($blocked)) {
            $usersQuery->whereNotIn('id', $blocked);
        }
        $users = $usersQuery->limit(20)->get();

        $postsQuery = Post::where('content', 'like', "%{$q}%")->with('user');
        if (!empty($blocked)) {
            $postsQuery->whereNotIn('user_id', $blocked);
        }
        $posts = $postsQuery->limit(20)->get();
        $posts = $posts->filter(fn ($post) => $this->canSeePost($viewer, $post))->values();

        return response()->json(['users' => $users, 'posts' => $posts]);
    }
}
