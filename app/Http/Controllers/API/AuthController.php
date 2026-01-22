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
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'speciality' => 'required|string|max:255',
            'work_experience' => 'required|int|max:450',
            'work_place' => 'required|string|max:255'
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'speciality' => $data['speciality'],
            'work_experience' => $data['work_experience'],
            'work_place' => $data['work_place'],
        ]);

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
            'status_text' => 'nullable|string|max:140',
            'is_private' => 'boolean',
            'avatar' => 'nullable|image|max:2048',
            'cover_image' => 'nullable|image|max:4096',
            'remove_avatar' => 'sometimes|boolean',
            'remove_cover_image' => 'sometimes|boolean',
        ]);

        $user = $request->user();

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

        return response()->json(['message' => 'Profile updated successfully', 'user' => $user]);
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
