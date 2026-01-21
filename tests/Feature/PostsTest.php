<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Post;
use Illuminate\Support\Facades\DB;
class PostsTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_and_view_post()
    {
        $user = User::factory()->create();

        $token = $user->createToken('api')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/posts', ['content' => 'Hello world']);

        $response->assertStatus(201)->assertJsonFragment(['content' => 'Hello world']);

        $postId = $response->json('id');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/posts/'.$postId)
            ->assertStatus(200)->assertJsonFragment(['content' => 'Hello world']);
    }

    public function test_feed_returns_posts()
    {
        $users = User::factory(3)->create();
        $author = $users->first();
        Post::factory()->create(['user_id' => $author->id, 'content' => 'post1', 'is_public' => true]);

        $me = $users->last();
        $token = $me->createToken('api')->plainTextToken;

        
        DB::table('friends')->insert([
            'user_id' => $me->id,
            'friend_id' => $author->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/feed')
            ->assertStatus(200)->assertJsonFragment(['content' => 'post1']);
    }

    public function test_delete_post()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $token = $user->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson('/api/posts/'.$post->id)
            ->assertStatus(200)->assertJson(['message' => 'Deleted']);

        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }
}
