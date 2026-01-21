<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Post;
use App\Notifications\NewCommentNotification;

class CommentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_comment_creates_notification_for_author()
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();

        $post = Post::factory()->create(['user_id' => $author->id, 'is_public' => true]);

        $token = $commenter->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/posts/'.$post->id.'/comments', ['body' => 'Nice post'])
            ->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $author->id,
            'type' => NewCommentNotification::class,
        ]);
    }

    public function test_delete_comment_by_author()
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);
        $comment = \App\Models\Comment::factory()->create(['user_id' => $user->id, 'post_id' => $post->id]);

        $token = $user->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson('/api/comments/'.$comment->id)
            ->assertStatus(200)->assertJson(['message' => 'Deleted']);

        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }

    public function test_delete_comment_by_post_author()
    {
        $author = User::factory()->create();
        $commenter = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $author->id]);
        $comment = \App\Models\Comment::factory()->create(['user_id' => $commenter->id, 'post_id' => $post->id]);

        $token = $author->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->deleteJson('/api/comments/'.$comment->id)
            ->assertStatus(200)->assertJson(['message' => 'Deleted']);

        $this->assertDatabaseMissing('comments', ['id' => $comment->id]);
    }
}
