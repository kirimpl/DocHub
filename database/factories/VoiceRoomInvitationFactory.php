<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\VoiceRoom;
use App\Models\VoiceRoomInvitation;
use Illuminate\Database\Eloquent\Factories\Factory;

class VoiceRoomInvitationFactory extends Factory
{
    protected $model = VoiceRoomInvitation::class;

    public function definition(): array
    {
        return [
            'voice_room_id' => VoiceRoom::factory(),
            'user_id' => User::factory(),
            'invited_by' => User::factory(),
            'status' => 'pending',
        ];
    }
}
