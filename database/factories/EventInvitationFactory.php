<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\EventInvitation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventInvitationFactory extends Factory
{
    protected $model = EventInvitation::class;

    public function definition(): array
    {
        return [
            'event_id' => Event::factory(),
            'user_id' => User::factory(),
            'invited_by' => User::factory(),
            'status' => 'pending',
        ];
    }
}
