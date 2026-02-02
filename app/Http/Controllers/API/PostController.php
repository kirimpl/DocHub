<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\User;
use App\Models\UserBlock;
use App\Models\Message;
use App\Models\ChatGroup;
use App\Models\ChatGroupMessage;
use App\Events\MessageSent;
use App\Notifications\NewPostNotification;
use App\Notifications\NewMessageNotification;
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

    private function isLectureChatClosed(ChatGroup $group, User $user): bool
    {
        if ($group->type !== 'lecture' || !$group->lecture) {
            return false;
        }

        return $group->lecture->isEnded() && !$user->isGlobalAdmin();
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

            if (!$user->isVerified()) {
                $query->where('is_global', true);
            } else {
                $query->where(function ($q) use ($user) {
                    $q->where('is_global', true)
                        ->orWhere('user_id', $user->id);

                    if ($user->work_place) {
                        $q->orWhere('organization_name', $user->work_place);
                    }
                });
            }

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


    $post = Post::create([
        'user_id' => $user->id,
        'content' => $data['content'] ?? '',
        'image' => $data['image'] ?? null,
        'is_public' => $data['is_public'] ?? false,
        'is_global' => $isGlobal,
        'organization_name' => $isGlobal ? null : $user->work_place,
        'department_tags' => $data['department_tags'] ?? [],
    ]);

    $this->clearPostCaches($user->id);

    return response()->json($post, 201);
}


    public function share(Request $request, $id)
    {
        $post = Post::findOrFail($id);
        $this->authorize('view', $post);

        $data = $request->validate([
            'target_type' => 'required|string|in:user,group',
            'target_id' => 'required|integer',
            'body' => 'nullable|string',
        ]);

        $sender = $request->user();

        if ($data['target_type'] === 'user') {
            $recipient = User::find($data['target_id']);
            if (!$recipient) {
                return response()->json(['message' => 'Recipient not found.'], 404);
            }

            $senderBlocked = $sender->blockedUsers()->where('users.id', $recipient->id)->exists();
            $recipientBlocked = $sender->blockedBy()->where('users.id', $recipient->id)->exists();
            if ($senderBlocked || $recipientBlocked) {
                return response()->json(['message' => 'Messaging is blocked.'], 403);
            }

            if ($recipient->is_private) {
                $senderIsFriend = $sender->friends()->wherePivot('friend_id', $recipient->id)->exists();
                $recipientIsFriend = $recipient->friends()->wherePivot('friend_id', $sender->id)->exists();
                if (!($senderIsFriend && $recipientIsFriend)) {
                    return response()->json(['message' => 'Recipient is private. You must be mutual friends to send messages.'], 403);
                }
            }

            if (!$this->canMessage($sender, $recipient)) {
                return response()->json(['message' => 'Recipient does not accept messages from you.'], 403);
            }

            $message = Message::create([
                'sender_id' => $sender->id,
                'recipient_id' => $recipient->id,
                'message_type' => 'direct',
                'body' => $data['body'] ?? '',
                'shared_post_id' => $post->id,
            ]);

            event(new MessageSent($message));

            if ($recipient->notifications_enabled ?? true) {
                $recipient->notify(new NewMessageNotification($message));
            }

            return response()->json($message->load(['sender', 'replyTo.sender', 'reactions.user', 'sharedPost']), 201);
        }

        $group = ChatGroup::find($data['target_id']);
        if (!$group) {
            return response()->json(['message' => 'Group not found.'], 404);
        }

        if ($this->isLectureChatClosed($group, $sender)) {
            return response()->json(['message' => 'Lecture chat is closed.'], 403);
        }

        $isMember = $group->members()->where('users.id', $sender->id)->exists();
        if (!$isMember && !$sender->isGlobalAdmin()) {
            return response()->json(['message' => 'Not a member of this group.'], 403);
        }

        $message = ChatGroupMessage::create([
            'chat_group_id' => $group->id,
            'sender_id' => $sender->id,
            'body' => $data['body'] ?? '',
            'reply_to_message_id' => null,
            'is_system' => false,
            'shared_post_id' => $post->id,
        ]);

        return response()->json($message->load(['sender', 'replyTo.sender', 'reactions.user', 'sharedPost']), 201);
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
