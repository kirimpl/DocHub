<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Post;
use App\Notifications\NewLikeNotification;

class LikesTest extends TestCase
{
    use RefreshDatabase;

    public function test_like_creates_notification_for_author()
    {
        $author = User::factory()->create();
        $liker = User::factory()->create();

        $post = Post::factory()->create(['user_id' => $author->id, 'is_global' => true]);

        $token = $liker->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/posts/'.$post->id.'/like')
            ->assertStatus(200);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $author->id,
            'type' => NewLikeNotification::class,
        ]);
    }
}
