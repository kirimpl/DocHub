<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\Post;
use App\Models\User;
use App\Models\Comment;

class NewCommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private Post $post;
    private Comment $comment;

    public function __construct(Post $post, Comment $comment)
    {
        $this->post = $post;
        $this->comment = $comment;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable)
    {
        $isReply = $this->comment->parent_id !== null;
        $message = $isReply ? $this->comment->user->name . ' ответил на ваш комментарий.' : $this->comment->user->name . ' написал комментарий к вашему посту.';

        return [
            'post_id' => $this->post->id,
            'comment_id' => $this->comment->id,
            'commenter_id' => $this->comment->user_id,
            'body' => $this->comment->body,
            'message' => $message,
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}
