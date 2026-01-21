<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\FollowRequest;
use App\Notifications\NewFollowRequestNotification;
use App\Notifications\FollowRequestAcceptedNotification;

class FollowRequestsTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_and_accept_follow_request_flow()
    {
        /** @var \App\Models\User $privateUser */
        $privateUser = User::factory()->create(['is_private' => true]);
        /** @var \App\Models\User $requester */
        $requester = User::factory()->create();

        $token = $requester->createToken('api')->plainTextToken;

       
        $resp = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/follow/requests', ['recipient_id' => $privateUser->id]);

        $this->assertEquals(201, $resp->status(), 'Send request response: '.$resp->getContent());

        $this->assertDatabaseHas('follow_requests', [
            'requester_id' => $requester->id,
            'recipient_id' => $privateUser->id,
            'status' => 'pending',
        ]);

        $reqId = $resp->json('id');

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $privateUser->id,
            'type' => NewFollowRequestNotification::class,
        ]);

       
        $respAccept = $this->actingAs($privateUser, 'sanctum')
            ->postJson('/api/follow/requests/'.$reqId.'/accept')
            ->assertStatus(200);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $requester->id,
            'type' => FollowRequestAcceptedNotification::class,
        ]);

      
        $this->assertDatabaseHas('follows', [
            'follower_id' => $requester->id,
            'followed_id' => $privateUser->id,
        ]);
    }
}
