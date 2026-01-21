<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Notifications\NewFriendRequestNotification;
use App\Notifications\FriendRequestAcceptedNotification;

class FriendRequestsTest extends TestCase
{
    use RefreshDatabase;

    public function test_sending_friend_request_creates_notification_for_recipient()
    {
        /** @var \App\Models\User $recipient */
        $recipient = User::factory()->create();
        /** @var \App\Models\User $requester */
        $requester = User::factory()->create();

        $token = $requester->createToken('api')->plainTextToken;

        $resp = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/friends/request', ['recipient_id' => $recipient->id])
            ->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $recipient->id,
            'type' => NewFriendRequestNotification::class,
        ]);

        $reqId = $resp->json('id');


        $this->assertDatabaseHas('friend_requests', [
            'id' => $reqId,
            'requester_id' => $requester->id,
            'recipient_id' => $recipient->id,
            'status' => 'pending',
        ]);

   
        $tokenRecipient = $recipient->createToken('api')->plainTextToken;

        
        $respAccept = $this->actingAs($recipient, 'sanctum')
            ->postJson('/api/friends/requests/'.$reqId.'/accept');

        $this->assertEquals(200, $respAccept->status(), 'Accept response content: '.$respAccept->getContent());

       
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $requester->id,
            'type' => FriendRequestAcceptedNotification::class,
        ]);
    }
}
