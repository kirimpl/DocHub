<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\FriendRequest;

class FriendRequestAcceptedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private FriendRequest $request;

    public function __construct(FriendRequest $request)
    {
        $this->request = $request;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'friend_request_id' => $this->request->id,
            'requester_id' => $this->request->requester_id,
            'recipient_id' => $this->request->recipient_id,
            'message' => $this->request->recipient->name . ' принял ваш запрос в друзья.',
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}
