<?php

namespace App\Events;

use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SupportTicketResolved implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public User $user;
    public SupportTicket $ticket;

    public function __construct(User $user, SupportTicket $ticket)
    {
        $this->user = $user;
        $this->ticket = $ticket;
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('messages.' . $this->user->id)];
    }

    public function broadcastAs(): string
    {
        return 'SupportTicketResolved';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->user->id,
            'ticket_id' => $this->ticket->id,
            'cleared_at' => optional($this->ticket->last_cleared_at)->toDateTimeString(),
        ];
    }
}
