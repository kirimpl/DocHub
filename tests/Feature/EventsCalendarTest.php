<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EventsCalendarTest extends TestCase
{
    use RefreshDatabase;

    public function test_calendar_returns_events_in_range(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $inRange = Event::factory()->create([
            'starts_at' => now()->addDays(2),
            'ends_at' => now()->addDays(2)->addHour(),
        ]);
        $outRange = Event::factory()->create([
            'starts_at' => now()->addDays(10),
            'ends_at' => now()->addDays(10)->addHour(),
        ]);
        $spanning = Event::factory()->create([
            'starts_at' => now()->subDays(1),
            'ends_at' => now()->addDays(1),
        ]);

        $from = now()->toDateString();
        $to = now()->addDays(3)->toDateString();

        $response = $this->getJson("/api/events/calendar?from={$from}&to={$to}")
            ->assertStatus(200);

        $ids = collect($response->json())->pluck('id')->values()->all();
        $this->assertContains($inRange->id, $ids);
        $this->assertContains($spanning->id, $ids);
        $this->assertNotContains($outRange->id, $ids);
    }

    public function test_calendar_requires_range(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/events/calendar?from=' . now()->toDateString())
            ->assertStatus(422);
    }
}
