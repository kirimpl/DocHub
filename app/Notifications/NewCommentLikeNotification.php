<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\Comment;
use App\Models\User;

class NewCommentLikeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private Comment $comment;
    private User $liker;

    public function __construct(Comment $comment, User $liker)
    {
        $this->comment = $comment;
        $this->liker = $liker;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'comment_id' => $this->comment->id,
            'liker_id' => $this->liker->id,
            'liker_name' => $this->liker->name,
            'message' => $this->liker->name . ' поставил лайк вашему комментарию.',
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}
