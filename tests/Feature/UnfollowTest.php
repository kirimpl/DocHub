<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class UnfollowTest extends TestCase
{
    use RefreshDatabase;

    public function test_unfollow_removes_follow_relation()
    {
        $followed = User::factory()->create();
        $follower = User::factory()->create();

        DB::table('follows')->insert([
            'follower_id' => $follower->id,
            'followed_id' => $followed->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $token = $follower->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/unfollow/'.$followed->id)
            ->assertStatus(200);

        $this->assertDatabaseMissing('follows', [
            'follower_id' => $follower->id,
            'followed_id' => $followed->id,
        ]);
    }
}
