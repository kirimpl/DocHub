<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\VoiceRoom;
use Illuminate\Database\Eloquent\Factories\Factory;

class VoiceRoomFactory extends Factory
{
    protected $model = VoiceRoom::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'type' => $this->faker->randomElement(['lecture', 'meeting', 'group_call']),
            'status' => $this->faker->randomElement(['scheduled', 'live']),
            'access_level' => $this->faker->randomElement(['public', 'organization', 'department', 'invite']),
            'is_recorded' => $this->faker->boolean(),
            'starts_at' => $this->faker->optional()->dateTimeBetween('-1 day', '+2 days'),
            'ends_at' => $this->faker->optional()->dateTimeBetween('+2 days', '+5 days'),
            'organization_name' => $this->faker->company(),
            'department_name' => $this->faker->jobTitle(),
            'creator_id' => User::factory(),
        ];
    }
}
