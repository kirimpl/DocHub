<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Post;
use App\Models\ChatGroup;
use Illuminate\Support\Facades\DB;

class PostShareTest extends TestCase
{
    use RefreshDatabase;

    public function test_share_post_to_user()
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

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

        $post = Post::factory()->create([
            'user_id' => $sender->id,
            'is_global' => true,
            'department_tags' => ['General'],
        ]);

        $token = $sender->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/posts/'.$post->id.'/share', [
                'target_type' => 'user',
                'target_id' => $recipient->id,
                'body' => '?????? ????',
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('messages', [
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'shared_post_id' => $post->id,
        ]);
    }

    public function test_share_post_to_group()
    {
        $sender = User::factory()->create();

        $post = Post::factory()->create([
            'user_id' => $sender->id,
            'is_global' => true,
            'department_tags' => ['General'],
        ]);

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
            ->postJson('/api/posts/'.$post->id.'/share', [
                'target_type' => 'group',
                'target_id' => $group->id,
            ])
            ->assertStatus(201);

        $this->assertDatabaseHas('chat_group_messages', [
            'chat_group_id' => $group->id,
            'sender_id' => $sender->id,
            'shared_post_id' => $post->id,
        ]);
    }
}
