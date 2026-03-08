<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NewPostTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_and_view_post(): void
    {
        $user = User::factory()->create(['work_place' => 'City Hospital']);

        $postData = [
            'content' => 'Test post with tags and visibility.',
            'department_tags' => ['Surgery', 'Therapy'],
            'is_public' => true,
            'is_global' => true,
            'image_url' => 'https://via.placeholder.com/600x400.png',
        ];

        $token = $user->createToken('api')->plainTextToken;
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/posts', $postData);

        $response->assertStatus(201);
        $this->assertDatabaseCount('posts', 1);
    }
}
