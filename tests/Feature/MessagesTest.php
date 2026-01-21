<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Message;
use Illuminate\Support\Facades\DB;

class MessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_and_retrieve_message()
    {
        $users = User::factory(2)->create();
        $a = $users[0];
        $b = $users[1];

        $token = $a->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/messages/send', ['recipient_id' => $b->id, 'body' => 'Hi'])
            ->assertStatus(201)->assertJsonFragment(['body' => 'Hi']);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/messages/conversation/'.$b->id)
            ->assertStatus(200)->assertJsonFragment(['body' => 'Hi']);
    }

    public function test_conversation_private_user_requires_mutual_friends()
    {
        $private = User::factory()->create(['is_private' => true]);
        $other = User::factory()->create();

        $token = $other->createToken('api')->plainTextToken;

    
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/messages/conversation/'.$private->id)
            ->assertStatus(403);

      
        DB::table('friends')->insert([
            ['user_id' => $private->id, 'friend_id' => $other->id, 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $other->id, 'friend_id' => $private->id, 'created_at' => now(), 'updated_at' => now()],
        ]);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/messages/conversation/'.$private->id)
            ->assertStatus(200);
    }

    public function test_send_message_creates_notification()
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $token = $sender->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/messages/send', ['recipient_id' => $recipient->id, 'body' => 'Test message'])
            ->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $recipient->id,
            'type' => \App\Notifications\NewMessageNotification::class,
        ]);
    }
}
