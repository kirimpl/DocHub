<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LectureSignal implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $lecture_id,
        public int $from_user_id,
        public ?int $to_user_id,
        public array $payload
    ) {
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('lecture.'.$this->lecture_id);
    }

    public function broadcastAs(): string
    {
        return 'LectureSignal';
    }
}
