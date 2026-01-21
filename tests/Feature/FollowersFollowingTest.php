<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class FollowersFollowingTest extends TestCase
{
    use RefreshDatabase;

    public function test_followers_and_following_endpoints_return_correct_users()
    {
        /** @var \App\Models\User $author */
        $author = User::factory()->create();

        /** @var \App\Models\User $me */
        $me = User::factory()->create();

        DB::table('follows')->insert([
            'follower_id' => $me->id,
            'followed_id' => $author->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        
        $this->actingAs($author, 'sanctum')
            ->getJson('/api/followers/'.$author->id)
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $me->id]);

        
        $this->actingAs($me, 'sanctum')
            ->getJson('/api/following/'.$me->id)
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $author->id]);
    }
}
