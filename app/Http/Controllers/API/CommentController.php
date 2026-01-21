<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use App\Models\Comment;
use App\Models\Post;
use App\Notifications\NewCommentNotification;
use Illuminate\Support\Facades\Gate;

class CommentController extends Controller
{
    use AuthorizesRequests;

    private function canComment(Request $request, Post $post): bool
    {
        $viewer = $request->user();
        $owner = $post->user;
        if (!$owner || $viewer->id === $owner->id) {
            return true;
        }

        $setting = $owner->comments_visibility ?: 'everyone';
        if ($setting === 'nobody') {
            return false;
        }
        if ($setting === 'friends') {
            return $viewer->friends()->where('users.id', $owner->id)->exists();
        }
        if ($setting === 'followers') {
            return $viewer->following()->where('users.id', $owner->id)->exists();
        }

        return true;
    }

    public function store(Request $request, $postId)
    {
        $post = Post::with('user')->findOrFail($postId);

        $data = $request->validate([
            'body' => 'required|string',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        // Allow commenting if the user can view the post
        Gate::authorize('view', $post);
        if (!$this->canComment($request, $post)) {
            return response()->json(['message' => 'Comments are restricted by the author.'], 403);
        }

        $comment = Comment::create([
            'user_id' => $request->user()->id,
            'post_id' => $post->id,
            'body' => $data['body'],
            'parent_id' => $data['parent_id'] ?? null,
        ]);

 
        if ($post->user && $post->user->id !== $request->user()->id) {
            $post->user->notify(new NewCommentNotification($post, $comment));
        }

        return response()->json($comment, 201);
    }

    public function index($postId)
    {
        $comments = Comment::where('post_id', $postId)->with('user')->with(['likes' => function ($q) {
            $q->where('user_id', auth()->id());
        }])->latest()->get();
        return response()->json($comments);
    }

    public function destroy(Request $request, $id)
    {
        $comment = Comment::findOrFail($id);
        $this->authorize('delete', $comment);
        $comment->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
