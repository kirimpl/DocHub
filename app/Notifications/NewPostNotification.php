<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\Post;
use App\Models\User;

class NewPostNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private Post $post;
    private User $poster;

    public function __construct(Post $post, User $poster)
    {
        $this->post = $post;
        $this->poster = $poster;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'post_id' => $this->post->id,
            'poster_id' => $this->poster->id,
            'poster_name' => $this->poster->name,
            'message' => $this->poster->name . ' опубликовал новый пост.',
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}