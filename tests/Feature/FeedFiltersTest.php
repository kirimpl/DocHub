<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FeedFiltersTest extends TestCase
{
    use RefreshDatabase;

    public function test_feed_global_and_organization_routes()
    {
        $orgUser = User::factory()->create(['work_place' => 'City Hospital']);
        $otherUser = User::factory()->create(['work_place' => 'Other Clinic']);

        $globalPost = Post::factory()->create([
            'user_id' => $otherUser->id,
            'content' => 'Global post',
            'is_public' => true,
            'is_global' => true,
            'organization_name' => null,
        ]);

        Post::factory()->create([
            'user_id' => $otherUser->id,
            'content' => 'Other org post',
            'is_public' => true,
            'is_global' => false,
            'organization_name' => 'Other Clinic',
        ]);

        $orgPost = Post::factory()->create([
            'user_id' => $orgUser->id,
            'content' => 'Org post',
            'is_public' => true,
            'is_global' => false,
            'organization_name' => 'City Hospital',
        ]);

        Sanctum::actingAs($orgUser);

        $globalResponse = $this->getJson('/api/feed/global')->assertStatus(200);
        $globalIds = collect($globalResponse->json())->pluck('id')->values()->all();
        $this->assertSame([$globalPost->id], $globalIds);

        $orgResponse = $this->getJson('/api/feed/organization')->assertStatus(200);
        $orgIds = collect($orgResponse->json())->pluck('id')->values()->all();
        $this->assertSame([$orgPost->id], $orgIds);
    }

    public function test_feed_date_filter()
    {
        $user = User::factory()->create(['work_place' => 'City Hospital']);

        $oldPost = Post::factory()->create([
            'user_id' => $user->id,
            'content' => 'Old post',
            'is_public' => true,
            'is_global' => true,
            'organization_name' => null,
            'created_at' => now()->subDays(10),
            'updated_at' => now()->subDays(10),
        ]);

        $newPost = Post::factory()->create([
            'user_id' => $user->id,
            'content' => 'New post',
            'is_public' => true,
            'is_global' => true,
            'organization_name' => null,
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);

        Sanctum::actingAs($user);

        $from = now()->subDays(5)->toDateString();
        $to = now()->toDateString();

        $response = $this->getJson("/api/feed?scope=all&from={$from}&to={$to}")
            ->assertStatus(200);

        $ids = collect($response->json())->pluck('id')->values()->all();
        $this->assertSame([$newPost->id], $ids);
        $this->assertNotContains($oldPost->id, $ids);
    }
}