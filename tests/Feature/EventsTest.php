<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EventsTest extends TestCase
{
    use RefreshDatabase;

    public function test_event_crud(): void
    {
        $user = User::factory()->create([
            'work_place' => 'City Hospital',
            'speciality' => 'Surgery',
        ]);
        Sanctum::actingAs($user);

        $create = $this->postJson('/api/events', [
            'title' => 'Weekly meeting',
            'description' => 'Discussing cases',
            'type' => 'meeting',
            'status' => 'scheduled',
            'is_online' => false,
        ])->assertStatus(201);

        $eventId = $create->json('id');

        $this->getJson('/api/events')
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $eventId]);

        $this->getJson('/api/events/' . $eventId)
            ->assertStatus(200)
            ->assertJsonFragment(['title' => 'Weekly meeting']);

        $this->patchJson('/api/events/' . $eventId, [
            'title' => 'Weekly meeting updated',
        ])->assertStatus(200)
            ->assertJsonFragment(['title' => 'Weekly meeting updated']);

        $this->deleteJson('/api/events/' . $eventId)
            ->assertStatus(200);
    }
}
