<?php

namespace App\Events;

use App\Models\ChatGroupMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatGroupMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ChatGroupMessage $message;

    public function __construct(ChatGroupMessage $message)
    {
        $this->message = $message;
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('group-chat.' . $this->message->chat_group_id);
    }

    public function broadcastAs(): string
    {
        return 'GroupChatMessageSent';
    }

    public function broadcastWith(): array
    {
        $message = $this->message->loadMissing(['sender']);

        return [
            'message' => [
                'id' => $message->id,
                'chat_group_id' => $message->chat_group_id,
                'sender_id' => $message->sender_id,
                'body' => $message->body,
                'created_at' => $message->created_at,
                'audio_url' => $message->audio_url,
                'image_url' => $message->image_url,
            ],
            'sender' => [
                'id' => $message->sender?->id,
                'name' => $message->sender?->name,
                'last_name' => $message->sender?->last_name,
                'avatar' => $message->sender?->avatar,
            ],
        ];
    }
}
