<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\User;
use App\Models\UserBlock;
use App\Notifications\NewPostNotification;
use Illuminate\Support\Collection;

class PostController extends Controller
{
    use AuthorizesRequests;

    private function clearPostCaches(int $userId): void
    {
        cache()->forget("posts:user:{$userId}");
        cache()->forget("feed:user:{$userId}");
    }

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

    public function index(Request $request)
    {
        $user = $request->user();
        $cacheKey = "posts:user:{$user->id}";

        $blockedIds = UserBlock::where('blocker_id', $user->id)->pluck('blocked_id');
        $blockedByIds = UserBlock::where('blocked_id', $user->id)->pluck('blocker_id');
        $blocked = $blockedIds->merge($blockedByIds)->unique()->values()->all();

        $posts = cache()->remember($cacheKey, 15, function () use ($user) {
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
            $posts = $posts->filter(fn ($post) => !in_array($post->user_id, $blocked, true))->values();
        }
        $posts = $posts->filter(fn ($post) => $this->canSeePost($user, $post))->values();

        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'content' => 'nullable|string',
            'image' => 'nullable|string',
            'is_public' => 'boolean',
            'is_global' => 'boolean',
            'department_tags' => 'required|array|min:1',
            'department_tags.*' => 'string|max:100',
        ]);

        $user = $request->user();
        $isGlobal = (bool) ($data['is_global'] ?? false);
        if (!$isGlobal && !$user->work_place) {
            return response()->json(['message' => 'User organization is required for local posts.'], 422);
        }

        $post = Post::create(array_merge($data, [
            'user_id' => $user->id,
            'is_global' => $isGlobal,
            'organization_name' => $isGlobal ? null : $user->work_place,
        ]));
        $this->clearPostCaches($request->user()->id);

        $tags = $data['department_tags'] ?? [];
        $scope = $isGlobal ? 'global' : 'local';
        $this->notifyTaggedUsers($user, $post, $tags, $scope, $isGlobal);

        return response()->json($post, 201);
    }

    public function show($id)
    {
        $post = Post::with('user')->findOrFail($id);
        $this->authorize('view', $post);
        return response()->json($post);
    }

    public function destroy(Request $request, $id)
    {
        $post = Post::findOrFail($id);
        $this->authorize('delete', $post);
        $post->delete();
        $this->clearPostCaches($request->user()->id);
        return response()->json(['message' => 'Deleted']);
    }

    public function update(Request $request, $id)
    {
        $post = Post::findOrFail($id);
        $this->authorize('update', $post);

        $data = $request->validate([
            'content' => 'nullable|string',
            'image' => 'nullable|string',
            'is_public' => 'boolean',
        ]);

        $post->update($data);
        $this->clearPostCaches($request->user()->id);

        return response()->json($post->load('user'));
    }

    public function myPosts(Request $request)
    {
        $user = $request->user();
        $posts = Post::where('user_id', $user->id)
            ->with('user')
            ->withCount(['likes', 'comments'])
            ->latest()
            ->get();
        return response()->json($posts);
    }

    private function notifyTaggedUsers(User $author, Post $post, array $tags, string $scope, bool $isGlobal): void
    {
        if (empty($tags)) {
            return;
        }

        $recipients = User::query()
            ->where('id', '!=', $author->id)
            ->whereIn('speciality', $tags)
            ->where(function ($query) {
                $query->whereNull('notifications_enabled')
                    ->orWhere('notifications_enabled', true);
            });

        if (!$isGlobal && $author->work_place) {
            $recipients->where('work_place', $author->work_place);
        }

        $recipients->chunkById(200, function (Collection $users) use ($post, $author, $tags, $scope) {
            foreach ($users as $user) {
                $user->notify(new NewPostNotification($post, $author, $tags, $scope));
            }
        });
    }
}
