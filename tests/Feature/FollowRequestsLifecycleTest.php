<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class FollowRequestsLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_decline_and_cancel_follow_request()
    {
        /** @var User $private */
        $private = User::factory()->create(['is_private' => true]);
        /** @var User $requester */
        $requester = User::factory()->create();

        $token = $requester->createToken('api')->plainTextToken;

        $resp = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/follow/requests', ['recipient_id' => $private->id])
            ->assertStatus(201);

        $reqId = $resp->json('id');

        // decline
        $this->actingAs($private, 'sanctum')
            ->postJson("/api/follow/requests/{$reqId}/decline")
            ->assertStatus(200);

        $this->assertDatabaseMissing('follow_requests', ['id' => $reqId]);

       
        $resp2 = $this->actingAs($requester, 'sanctum')
            ->postJson('/api/follow/requests', ['recipient_id' => $private->id])
            ->assertStatus(201);

        $reqId2 = $resp2->json('id');

        $this->actingAs($requester, 'sanctum')
            ->postJson("/api/follow/requests/{$reqId2}/cancel")
            ->assertStatus(200);

        $this->assertDatabaseMissing('follow_requests', ['id' => $reqId2]);
    }
}
