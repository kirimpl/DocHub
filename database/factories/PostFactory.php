<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Post;

class PostFactory extends Factory
{
    protected $model = Post::class;

    public function definition()
    {
        return [
            'content' => $this->faker->paragraph(),
            'image' => null,
            'is_public' => $this->faker->boolean(80),
            'is_global'=> $this->faker->boolean(0),
        ];
    }
}
