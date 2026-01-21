<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\Comment;
use App\Models\CommentLike;
use App\Notifications\NewLikeNotification;
use App\Notifications\NewCommentLikeNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class LikeController extends Controller
{
    use AuthorizesRequests;
    
    public function like(Request $request, $postId)
    {
        $post = Post::findOrFail($postId);
        $user = $request->user();
        $this->authorize('like', $post);

        $existing = DB::table('likes')->where('user_id', $user->id)->where('post_id', $post->id)->first();

        if ($existing) {
            // Unlike
            DB::table('likes')->where('user_id', $user->id)->where('post_id', $post->id)->delete();
            cache()->forget("posts:user:{$user->id}");
            cache()->forget("feed:user:{$user->id}");
            return response()->json(['message' => 'Unliked']);
        } else {
            // Like
            DB::table('likes')->insert([
                'user_id' => $user->id,
                'post_id' => $post->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // notify post author
            if ($post->user && $post->user->id !== $user->id && ($post->user->notifications_enabled ?? true)) {
                $post->user->notify(new NewLikeNotification($post, $user));
                \Log::info('Like notification sent to user ' . $post->user->id);
            }

            cache()->forget("posts:user:{$user->id}");
            cache()->forget("feed:user:{$user->id}");
            return response()->json(['message' => 'Liked']);
        }
    }

    public function likeComment(Request $request, $commentId)
    {
        $comment = Comment::findOrFail($commentId);
        $user = $request->user();
        $this->authorize('like', $comment->post); // Use post policy

        $existing = CommentLike::where('user_id', $user->id)->where('comment_id', $comment->id)->first();

        if ($existing) {
            $existing->delete();
            cache()->forget("posts:user:{$user->id}");
            cache()->forget("feed:user:{$user->id}");
            return response()->json(['message' => 'Unliked']);
        } else {
            CommentLike::create([
                'user_id' => $user->id,
                'comment_id' => $comment->id,
            ]);

            // notify comment author
            if ($comment->user && $comment->user->id !== $user->id && ($comment->user->notifications_enabled ?? true)) {
                $comment->user->notify(new NewCommentLikeNotification($comment, $user));
                \Log::info('Comment like notification sent to user ' . $comment->user->id);
            }

            cache()->forget("posts:user:{$user->id}");
            cache()->forget("feed:user:{$user->id}");
            return response()->json(['message' => 'Liked']);
        }
    }

    public function unlike(Request $request, $postId)
    {
        $user = $request->user();
        DB::table('likes')->where(['user_id' => $user->id, 'post_id' => $postId])->delete();
        return response()->json(['message' => 'Unliked']);
    }

    public function index(Request $request, $postId)
    {
        $post = Post::findOrFail($postId);
        $this->authorize('viewLikes', $post); // Only post author can see who liked

        $likes = $post->likes()->with('user:id,name')->get()->map(function ($like) {
            return $like->user;
        });

        return response()->json($likes);
    }
}
