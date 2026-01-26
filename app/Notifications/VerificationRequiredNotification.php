<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class VerificationRequiredNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private ?int $supportUserId;

    public function __construct(?int $supportUserId)
    {
        $this->supportUserId = $supportUserId;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => 'Подтвердите свои данные. Для подтверждения пришлите документы в поддержку.',
            'support_user_id' => $this->supportUserId,
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}
