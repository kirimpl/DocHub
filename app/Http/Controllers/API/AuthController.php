<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Models\Post;
use App\Models\Organization;
use App\Models\Department;
use App\Models\Message;
use App\Models\ChatGroup;
use App\Models\ChatGroupMessage;
use App\Events\MessageSent;
use App\Notifications\NewMessageNotification;
use App\Notifications\VerificationRequiredNotification;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::attempt($data)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('api')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $user->update(['is_online' => true, 'last_seen' => now()]);
        return response()->json($user);
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'speciality' => 'required|string|max:255',
            'sex' => 'required|string|max:20',
            'phone_number' => 'required|string|max:20|regex:/^\+?[0-9]{7,20}$/',
            'birth_date' => 'required|date|before:today',
            'education' => 'required|string|max:255',
            'city' => 'sometimes|nullable|string|max:255',
            'work_experience' => 'required|integer|min:0|max:450',
            'work_place' => 'required|string|max:255',
            'secondary_work_place' => 'sometimes|nullable|string|max:255',
            'secondary_speciality' => 'sometimes|nullable|string|max:255',
            'category' => 'sometimes|nullable|string|max:255',
            'position' => 'sometimes|nullable|string|max:255',
            'organization_role' => 'required|string|max:20',
            'department_role' => 'sometimes|nullable|string|max:20',
        ]);

        $errors = [];
        $workPlace = $this->resolveOrganizationName($data['work_place'], $errors, 'work_place');
        $speciality = $this->resolveDepartmentName($data['speciality'], $errors, 'speciality');
        $secondaryWorkPlace = null;
        $secondarySpeciality = null;
        if (!empty($data['secondary_work_place'])) {
            $secondaryWorkPlace = $this->resolveOrganizationName($data['secondary_work_place'], $errors, 'secondary_work_place');
            if (!empty($data['secondary_speciality'])) {
                $secondarySpeciality = $this->resolveDepartmentName($data['secondary_speciality'], $errors, 'secondary_speciality');
            } elseif ($speciality) {
                $secondarySpeciality = $speciality;
            }
        }
        if (!empty($errors)) {
            return response()->json([
                'message' => 'Некорректные поля профиля.',
                'errors' => $errors,
            ], 422);
        }

        $user = User::create([
            'name' => $data['name'],
            'last_name' => $data['last_name'] ?? null,
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'speciality' => $speciality,
            'sex' => $data['sex'],
            'phone_number' => $data['phone_number'],
            'birth_date' => $data['birth_date'],
            'education' => $data['education'],
            'city' => $data['city'] ?? null,
            'work_experience' => $data['work_experience'],
            'work_place' => $workPlace,
            'secondary_work_place' => $secondaryWorkPlace,
            'secondary_speciality' => $secondarySpeciality,
            'category' => $data['category'] ?? null,
            'position' => $data['position'] ?? null,
            'organization_role' => $data['organization_role'],
            'department_role' => $data['department_role'] ?? 'staff',
            'verification_status' => 'pending',
        ]);

        $supportUserId = User::where('global_role', 'admin')->value('id');
        $user->notify(new VerificationRequiredNotification($supportUserId));

        $token = $user->createToken('api')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user], 201);
    }

    public function logout(Request $request)
    {

        /** @var \Laravel\Sanctum\PersonalAccessToken|null $token */
        $token = $request->user()->currentAccessToken();
        if ($token) {
            $token->delete();
        }

        return response()->json(['message' => 'Logged out']);
    }

    public function updateProfile(Request $request)
    {
        // Coerce is_private coming from FormData ("1","0","true","false") to boolean
        if ($request->has('is_private')) {
            $val = $request->input('is_private');
            $request->merge(['is_private' => filter_var($val, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false]);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|nullable|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $request->user()->id,
            'phone_number' => 'sometimes|nullable|string|max:20|regex:/^\\+?[0-9]{7,20}$/|unique:users,phone_number,' . $request->user()->id,
            'status_text' => 'nullable|string|max:140',
            'bio' => 'nullable|string|max:1000',
            'is_private' => 'boolean',
            'avatar' => 'nullable|image|max:2048',
            'cover_image' => 'nullable|image|max:4096',
            'remove_avatar' => 'sometimes|boolean',
            'remove_cover_image' => 'sometimes|boolean',
            'speciality' => 'sometimes|string|max:255',
            'work_experience' => 'sometimes|integer|min:0|max:450',
            'work_place' => 'sometimes|string|max:255',
            'education' => 'sometimes|nullable|string|max:255',
            'city' => 'sometimes|nullable|string|max:255',
            'secondary_work_place' => 'sometimes|nullable|string|max:255',
            'secondary_speciality' => 'sometimes|nullable|string|max:255',
            'category' => 'sometimes|nullable|string|max:255',
            'position' => 'sometimes|nullable|string|max:255',
            'organization_role' => 'sometimes|nullable|string|max:20',
            'department_role' => 'sometimes|nullable|string|max:20',
        ]);

        $user = $request->user();
        $errors = [];

        if ($request->has('work_place')) {
            $data['work_place'] = $this->resolveOrganizationName($data['work_place'], $errors, 'work_place');
        }
        if ($request->has('speciality')) {
            $data['speciality'] = $this->resolveDepartmentName($data['speciality'], $errors, 'speciality');
        }
        if ($request->has('secondary_work_place')) {
            if (empty($data['secondary_work_place'])) {
                $data['secondary_work_place'] = null;
                $data['secondary_speciality'] = null;
            } else {
                $data['secondary_work_place'] = $this->resolveOrganizationName(
                    $data['secondary_work_place'],
                    $errors,
                    'secondary_work_place'
                );
                if ($request->has('secondary_speciality')) {
                    $data['secondary_speciality'] = $this->resolveDepartmentName(
                        $data['secondary_speciality'],
                        $errors,
                        'secondary_speciality'
                    );
                } else {
                    $data['secondary_speciality'] = $data['speciality'] ?? $user->speciality;
                }
            }
        } elseif ($request->has('secondary_speciality')) {
            $data['secondary_speciality'] = $this->resolveDepartmentName(
                $data['secondary_speciality'],
                $errors,
                'secondary_speciality'
            );
        }

        if (!empty($errors)) {
            return response()->json([
                'message' => 'Некорректные поля профиля.',
                'errors' => $errors,
            ], 422);
        }

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $data['avatar'] = $path;
        }
        if ($request->boolean('remove_avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $data['avatar'] = null;
        }
        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('covers', 'public');
            $data['cover_image'] = $path;
        }
        if ($request->boolean('remove_cover_image')) {
            if ($user->cover_image) {
                Storage::disk('public')->delete($user->cover_image);
            }
            $data['cover_image'] = null;
        }

        $user->update($data);

        if (
            $user->isVerified() && $request->hasAny([
                'work_place',
                'speciality',
                'secondary_work_place',
                'secondary_speciality',
                'organization_role',
                'department_role',
            ])
        ) {
            $this->ensureDefaultGroups($user);
            $this->ensureSecondaryGroups($user);
        }

        return response()->json(['message' => 'Profile updated successfully', 'user' => $user]);
    }

    private function ensureDefaultGroups(User $user): void
    {
        $orgName = $user->work_place;
        $deptName = $user->speciality;

        if ($orgName) {
            $orgGroup = \App\Models\ChatGroup::firstOrCreate(
                [
                    'type' => 'organization',
                    'organization_name' => $orgName,
                    'department_name' => null,
                ],
                [
                    'name' => 'Общая группа: ' . $orgName,

                    'owner_id' => $user->id,
                    'is_system' => true,
                ]
            );

            $orgRole = in_array($user->organization_role, ['chief', 'deputy'], true) ? 'admin' : 'member';
            $orgGroup->members()->syncWithoutDetaching([
                $user->id => ['role' => $orgRole],
            ]);
        }

        if ($orgName && $deptName) {
            $deptGroup = \App\Models\ChatGroup::firstOrCreate(
                [
                    'type' => 'department',
                    'organization_name' => $orgName,
                    'department_name' => $deptName,
                ],
                [
                    'name' => 'Отделение: ' . $deptName,

                    'owner_id' => $user->id,
                    'is_system' => true,
                ]
            );

            $deptRole = $user->department_role === 'head' ? 'admin' : 'member';
            $deptGroup->members()->syncWithoutDetaching([
                $user->id => ['role' => $deptRole],
            ]);
        }
    }

    private function ensureSecondaryGroups(User $user): void
    {
        if (!$user->secondary_work_place) {
            return;
        }

        $tempUser = clone $user;
        $tempUser->work_place = $user->secondary_work_place;
        $tempUser->speciality = $user->secondary_speciality ?: $user->speciality;

        $this->ensureDefaultGroups($tempUser);
    }

    private function resolveOrganizationName(string $input, array &$errors, string $field): ?string
    {
        $input = preg_replace('/\s+/', ' ', trim($input));
        if ($input === '') {
            $errors[$field] = ['Поле обязательно.'];

            return null;
        }

        $lower = mb_strtolower($input);
        $exact = Organization::whereRaw('lower(name) = ?', [$lower])->value('name');
        if ($exact) {
            return $exact;
        }

        $fallbackList = collect(config('directories.work_places', []));
        $fallbackMatch = $fallbackList->first(function ($item) use ($lower) {
            return mb_strtolower($item) === $lower;
        });
        if ($fallbackMatch) {
            return $fallbackMatch;
        }

        $suggestions = Organization::where('name', 'like', '%' . $input . '%')
            ->orderBy('name')
            ->limit(5)
            ->pluck('name')
            ->all();

        if (empty($suggestions)) {
            $suggestions = $fallbackList->take(5)->values()->all();
        }

        $errors[$field] = ['Выберите значение из списка.'];

        if (!empty($suggestions)) {
            $errors[$field . '_suggestions'] = $suggestions;
        }

        return null;
    }

    private function resolveDepartmentName(string $input, array &$errors, string $field): ?string
    {
        $input = preg_replace('/\s+/', ' ', trim($input));
        if ($input === '') {
            $errors[$field] = ['Поле обязательно.'];

            return null;
        }

        $lower = mb_strtolower($input);
        $exact = Department::whereRaw('lower(name) = ?', [$lower])->value('name');
        if ($exact) {
            return $exact;
        }

        $fallbackList = collect(config('directories.departments', []));
        $fallbackMatch = $fallbackList->first(function ($item) use ($lower) {
            return mb_strtolower($item) === $lower;
        });
        if ($fallbackMatch) {
            return $fallbackMatch;
        }

        $suggestions = Department::where('name', 'like', '%' . $input . '%')
            ->orderBy('name')
            ->limit(5)
            ->pluck('name')
            ->all();

        if (empty($suggestions)) {
            $suggestions = $fallbackList->take(5)->values()->all();
        }

        $errors[$field] = ['Выберите значение из списка.'];
        
        if (!empty($suggestions)) {
            $errors[$field . '_suggestions'] = $suggestions;
        }

        return null;
    }

    public function profile(Request $request, $id)
    {
        $me = $request->user();
        $user = User::findOrFail($id);

        $isBlockedByMe = $me->blockedUsers()->where('users.id', $user->id)->exists();
        if ($isBlockedByMe) {
            return response()->json([
                'user' => $user,
                'posts' => [],
                'followers_count' => 0,
                'following_count' => 0,
                'total_likes' => 0,
                'blocked_by_me' => true,
            ]);
        }

        $isBlockedByOther = $me->blockedBy()->where('users.id', $user->id)->exists();
        if ($isBlockedByOther) {
            return response()->json(['message' => 'Вы заблокированы этим пользователем.'], 403);
        }

        $isFriend = $me->friends()->where('users.id', $user->id)->exists();

        if ($user->is_private && $me->id !== $user->id) {
            // Check if friends
            if (!$isFriend) {
                return response()->json([
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'is_private' => true,
                        'message' => 'Приватный профиль'

                    ],
                    'posts' => [],
                    'followers_count' => 0,
                    'following_count' => 0
                ]);
            }
        }

        $followers = 0;
        $following = 0;
        $posts = $user->posts()->with('user')->withCount(['likes', 'comments'])->latest()->get();
        if ($me->id !== $user->id) {
            $posts = $posts->filter(function ($post) use ($me) {
                return Gate::forUser($me)->allows('view', $post);
            })->values();
        }
        $total_likes = $posts->sum('likes_count');
        $pinnedPost = null;
        if ($user->pinned_post_id) {
            $candidate = Post::with('user')->find($user->pinned_post_id);
            if ($candidate && Gate::forUser($me)->allows('view', $candidate)) {
                $pinnedPost = $candidate;
            }
        }

        $viewerIsSelf = $me->id === $user->id;
        if (!$viewerIsSelf) {
            if (!$user->show_status) {
                $user->status_text = null;
            }
            if (!$user->show_last_seen) {
                $user->is_online = null;
                $user->last_seen = null;
            }
            $emailVisibility = $user->email_visibility ?: 'everyone';
            if ($emailVisibility === 'nobody') {
                $user->email = null;
            } elseif ($emailVisibility === 'friends' && !$isFriend) {
                $user->email = null;
            }
        }

        return response()->json([
            'user' => $user,
            'posts' => $posts,
            'total_likes' => $total_likes,
            'blocked_by_me' => false,
            'pinned_post' => $pinnedPost,
        ]);
    }

    public function shareProfile(Request $request, $id)
    {
        $targetUser = User::findOrFail($id);
        $sender = $request->user();

        $blockedBySender = $sender->blockedUsers()->where('users.id', $targetUser->id)->exists();
        $blockedByTarget = $sender->blockedBy()->where('users.id', $targetUser->id)->exists();
        if ($blockedBySender || $blockedByTarget) {
            return response()->json(['message' => 'Sharing is blocked.'], 403);
        }

        $isFriend = $sender->friends()->where('users.id', $targetUser->id)->exists();
        if ($targetUser->is_private && $sender->id !== $targetUser->id && !$isFriend) {
            return response()->json(['message' => 'Recipient is private. You must be friends to share this profile.'], 403);
        }

        $data = $request->validate([
            'target_type' => 'required|string|in:user,group',
            'target_id' => 'required|integer',
            'body' => 'nullable|string',
        ]);

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
                'shared_user_id' => $targetUser->id,
            ]);

            event(new MessageSent($message));

            if ($recipient->notifications_enabled ?? true) {
                $recipient->notify(new NewMessageNotification($message));
            }

            return response()->json($message->load(['sender', 'replyTo.sender', 'reactions.user', 'sharedUser']), 201);
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
            'shared_user_id' => $targetUser->id,
        ]);

        return response()->json($message->load(['sender', 'replyTo.sender', 'reactions.user', 'sharedUser']), 201);
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

    public function pinPost(Request $request)
    {
        $data = $request->validate([
            'post_id' => 'nullable|exists:posts,id',
        ]);

        $user = $request->user();
        $postId = $data['post_id'] ?? null;
        if ($postId) {
            $post = Post::findOrFail($postId);
            if ($post->user_id !== $user->id) {
                return response()->json(['message' => 'You can only pin your own posts.'], 403);
            }
            $user->pinned_post_id = $post->id;
        } else {
            $user->pinned_post_id = null;
        }
        $user->save();

        return response()->json(['message' => 'Pinned post updated', 'pinned_post_id' => $user->pinned_post_id]);
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();
        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 403);
        }

        $user->password = bcrypt($data['password']);
        $user->save();
        $user->tokens()->delete();

        return response()->json(['message' => 'Password updated. Please log in again.']);
    }

    public function sessions(Request $request)
    {
        $user = $request->user();
        $sessions = $user->tokens()
            ->select(['id', 'name', 'last_used_at', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['sessions' => $sessions]);
    }

    public function logoutAll(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        return response()->json(['message' => 'Logged out everywhere.']);
    }
}
