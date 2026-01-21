<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Notifications\NewMessageNotification;
use Illuminate\Support\Facades\DB;

class MessagePrivacyTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_send_message_to_private_user_without_mutual_friendship()
    {
        $private = User::factory()->create(['is_private' => true]);
        $sender = User::factory()->create();

        $token = $sender->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/messages/send', ['recipient_id' => $private->id, 'body' => 'Hello'])
            ->assertStatus(403);
    }

    public function test_can_send_message_to_private_user_if_mutual_friends_and_notification_sent()
    {
        $private = User::factory()->create(['is_private' => true]);
        $sender = User::factory()->create();

    
        DB::table('friends')->insert([
            ['user_id' => $private->id, 'friend_id' => $sender->id, 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $sender->id, 'friend_id' => $private->id, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $token = $sender->createToken('api')->plainTextToken;

        $resp = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/messages/send', ['recipient_id' => $private->id, 'body' => 'Hello'])
            ->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $private->id,
            'type' => NewMessageNotification::class,
        ]);

        $this->assertDatabaseHas('messages', [
            'sender_id' => $sender->id,
            'recipient_id' => $private->id,
            'body' => 'Hello',
        ]);
    }
}
