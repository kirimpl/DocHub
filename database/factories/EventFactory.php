<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventFactory extends Factory
{
    protected $model = Event::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->sentence(4),
            'description' => $this->faker->optional()->paragraph(),
            'type' => $this->faker->randomElement(['lecture', 'meeting']),
            'status' => $this->faker->randomElement(['scheduled', 'live']),
            'is_online' => $this->faker->boolean(),
            'starts_at' => $this->faker->dateTimeBetween('-1 day', '+2 days'),
            'ends_at' => $this->faker->dateTimeBetween('+2 days', '+5 days'),
            'organization_name' => $this->faker->company(),
            'department_name' => $this->faker->jobTitle(),
            'creator_id' => User::factory(),
        ];
    }
}
