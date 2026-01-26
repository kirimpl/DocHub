<?php

namespace App\Notifications;

use App\Models\VoiceRoom;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class VoiceRoomNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private VoiceRoom $room;
    private User $creator;
    private array $tags;
    private string $scope;

    public function __construct(VoiceRoom $room, User $creator, array $tags = [], string $scope = 'local')
    {
        $this->room = $room;
        $this->creator = $creator;
        $this->tags = $tags;
        $this->scope = $scope;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'voice_room_id' => $this->room->id,
            'creator_id' => $this->creator->id,
            'creator_name' => $this->creator->name,
            'room_title' => $this->room->title,
            'room_type' => $this->room->type,
            'message' => $this->creator->name . ' создал ' . $this->room->title . '.',
            'tags' => $this->tags,
            'scope' => $this->scope,
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }
}
