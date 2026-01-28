<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\ChatGroup;
use Illuminate\Support\Facades\DB;

class ProfileShareTest extends TestCase
{
    use RefreshDatabase;

    public function test_share_profile_to_user()
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        $target = User::factory()->create();

        DB::table('friends')->insert([
            'user_id' => $sender->id,
            'friend_id' => $recipient->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('friends')->insert([
            'user_id' => $recipient->id,
            'friend_id' => $sender->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = $sender->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/profile/'.$target->id.'/share', [
                'target_type' => 'user',
                'target_id' => $recipient->id,
                'body' => '???????? ???????',
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('messages', [
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'shared_user_id' => $target->id,
        ]);
    }

    public function test_share_profile_to_group()
    {
        $sender = User::factory()->create();
        $target = User::factory()->create();

        $group = ChatGroup::create([
            'name' => 'Test Group',
            'owner_id' => $sender->id,
            'type' => 'regular',
            'is_system' => false,
        ]);

        $group->members()->syncWithoutDetaching([
            $sender->id => ['role' => 'admin'],
        ]);

        $token = $sender->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/profile/'.$target->id.'/share', [
                'target_type' => 'group',
                'target_id' => $group->id,
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('chat_group_messages', [
            'chat_group_id' => $group->id,
            'sender_id' => $sender->id,
            'shared_user_id' => $target->id,
        ]);
    }
}
