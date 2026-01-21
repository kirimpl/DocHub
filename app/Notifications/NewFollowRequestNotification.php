<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\FollowRequest;

class NewFollowRequestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private FollowRequest $request;

    public function __construct(FollowRequest $request)
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
            'follow_request_id' => $this->request->id,
            'requester_id' => $this->request->requester_id,
            'recipient_id' => $this->request->recipient_id,
            'message' => $this->request->requester->name . ' отправил запрос на подписку.',
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}
