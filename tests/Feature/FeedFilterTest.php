<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FeedFilterTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'work_place' => 'City Hospital',
        ]);

        $this->otherUser = User::factory()->create([
            'work_place' => 'Another Hospital',
        ]);

        Sanctum::actingAs($this->user);
    }

    /** @test */
    public function it_returns_only_global_posts_when_scope_is_global()
{
    Post::factory()->create([
        'user_id'   => $this->user->id,
        'is_global' => true,
    ]);

    Post::factory()->create([
        'user_id'            => $this->otherUser->id,
        'is_global'          => false,
        'organization_name'  => 'City Hospital',
    ]);

    $response = $this->getJson('/api/feed?scope=global');

    $response->assertOk();
    $response->assertJsonCount(1);
    $response->assertJsonFragment(['is_global' => true]);
}

    /** @test */
    public function it_returns_only_local_posts_when_scope_is_local()
{
    Post::factory()->create([
        'user_id'           => $this->user->id,
        'organization_name' => 'City Hospital',
        'is_global'         => false,
    ]);

    Post::factory()->create([
        'user_id'           => $this->otherUser->id,
        'organization_name' => 'Another Hospital',
        'is_global'         => false,
    ]);

    $response = $this->getJson('/api/feed?scope=local');

    $response->assertOk();
    $response->assertJsonCount(1);
    $response->assertJsonFragment([
        'organization_name' => 'City Hospital',
    ]);
}

    /** @test */
    public function it_returns_only_my_posts_when_scope_is_mine()
    {
        Post::factory()->create([
            'user_id' => $this->user->id,
        ]);

        Post::factory()->create([
            'user_id' => $this->otherUser->id,
        ]);

        $response = $this->getJson('/api/feed?scope=mine');

        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonFragment([
            'user_id' => $this->user->id,
        ]);
    }

    /** @test */
    public function it_filters_posts_by_date_range()
    {
        Post::factory()->create([
            'user_id'    => $this->user->id,
            'created_at' => now()->subDays(10),
        ]);
    
        Post::factory()->create([
            'user_id'    => $this->user->id,
            'created_at' => now()->subDays(2),
        ]);
    
        $response = $this->getJson('/api/feed?from=' . now()->subDays(3)->toDateString());
    
        $response->assertOk();
        $response->assertJsonCount(1);
    }
    
    /** @test */
    public function it_combines_scope_and_date_filters()
{
    Post::factory()->create([
        'user_id'           => $this->user->id,
        'organization_name' => 'City Hospital',
        'created_at'        => now()->subDays(1),
    ]);

    Post::factory()->create([
        'user_id'           => $this->user->id,
        'organization_name' => 'City Hospital',
        'created_at'        => now()->subDays(10),
    ]);

    $response = $this->getJson('/api/feed?scope=local&from=' . now()->subDays(3)->toDateString());

    $response->assertOk();
    $response->assertJsonCount(1);
}

}
