<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Notifications\NewFollowNotification;

class FollowTest extends TestCase
{
    use RefreshDatabase;

    public function test_follow_creates_notification_for_followed_user()
    {
        $followed = User::factory()->create();
        $follower = User::factory()->create();

        $token = $follower->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/follow/'.$followed->id)
            ->assertStatus(200);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $followed->id,
            'type' => NewFollowNotification::class,
        ]);
    }
}
