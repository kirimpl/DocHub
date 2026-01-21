<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class FriendLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_decline_and_cancel_friend_request()
    {
        /** @var \App\Models\User $recipient */
        $recipient = User::factory()->create();

        /** @var \App\Models\User $requester */
        $requester = User::factory()->create();

        $token = $requester->createToken('api')->plainTextToken;

        $resp = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/friends/request', ['recipient_id' => $recipient->id])
            ->assertStatus(201);

        $reqId = $resp->json('id');

        // decline as recipient
        $this->actingAs($recipient, 'sanctum')
            ->postJson('/api/friends/requests/'.$reqId.'/decline')
            ->assertStatus(200);

        $this->assertDatabaseMissing('friend_requests', ['id' => $reqId]);

        // send again to a different recipient and cancel as requester
        /** @var \App\Models\User $recipient2 */
        $recipient2 = User::factory()->create();

        // ensure we are acting as the requester when creating the second request
        $resp2 = $this->actingAs($requester, 'sanctum')
            ->postJson('/api/friends/request', ['recipient_id' => $recipient2->id]);

        $this->assertEquals(201, $resp2->status(), 'Send second request response: '.$resp2->getContent());

        $reqId2 = $resp2->json('id');

        $this->assertDatabaseHas('friend_requests', ['id' => $reqId2, 'requester_id' => $requester->id]);

        $this->actingAs($requester, 'sanctum')
            ->postJson('/api/friends/requests/'.$reqId2.'/cancel')
            ->assertStatus(200);

        $this->assertDatabaseMissing('friend_requests', ['id' => $reqId2]);
    }

    public function test_remove_friend()
    {
        /** @var \App\Models\User $a */
        $a = User::factory()->create();

        /** @var \App\Models\User $b */
        $b = User::factory()->create();

       
        $this->actingAs($a, 'sanctum');
        $a->friends()->syncWithoutDetaching([$b->id]);
        $b->friends()->syncWithoutDetaching([$a->id]);

        $this->actingAs($a, 'sanctum')
            ->deleteJson('/api/friends/'.$b->id)
            ->assertStatus(200);

        $this->assertDatabaseMissing('friends', ['user_id' => $a->id, 'friend_id' => $b->id]);
        $this->assertDatabaseMissing('friends', ['user_id' => $b->id, 'friend_id' => $a->id]);
    }
}
