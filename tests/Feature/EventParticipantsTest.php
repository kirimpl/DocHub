<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventInvitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EventParticipantsTest extends TestCase
{
    use RefreshDatabase;

    public function test_join_and_leave_event(): void
    {
        $creator = User::factory()->create();
        $event = Event::factory()->create([
            'creator_id' => $creator->id,
        ]);

        $member = User::factory()->create();
        Sanctum::actingAs($member);

        $this->postJson("/api/events/{$event->id}/join")
            ->assertStatus(200);

        $this->assertDatabaseHas('event_participants', [
            'event_id' => $event->id,
            'user_id' => $member->id,
        ]);

        $this->postJson("/api/events/{$event->id}/leave")
            ->assertStatus(200);

        $this->assertDatabaseMissing('event_participants', [
            'event_id' => $event->id,
            'user_id' => $member->id,
        ]);
    }

    public function test_event_invite_flow(): void
    {
        $creator = User::factory()->create();
        Sanctum::actingAs($creator);

        $event = Event::factory()->create([
            'creator_id' => $creator->id,
        ]);

        $invitee = User::factory()->create();

        $this->postJson("/api/events/{$event->id}/invite", [
            'user_ids' => [$invitee->id],
        ])->assertStatus(200);

        Sanctum::actingAs($invitee);

        $invite = EventInvitation::where('event_id', $event->id)
            ->where('user_id', $invitee->id)
            ->first();

        $this->postJson("/api/events/{$event->id}/invites/{$invite->id}/accept")
            ->assertStatus(200);

        $this->assertDatabaseHas('event_participants', [
            'event_id' => $event->id,
            'user_id' => $invitee->id,
            'status' => 'accepted',
        ]);

        $this->postJson("/api/events/{$event->id}/invites/{$invite->id}/decline")
            ->assertStatus(200);
    }

    public function test_my_event_invites_endpoint(): void
    {
        $creator = User::factory()->create();
        $invitee = User::factory()->create();
        $event = Event::factory()->create([
            'creator_id' => $creator->id,
        ]);

        EventInvitation::factory()->create([
            'event_id' => $event->id,
            'user_id' => $invitee->id,
            'invited_by' => $creator->id,
        ]);

        Sanctum::actingAs($invitee);

        $this->getJson('/api/events/invites')
            ->assertStatus(200)
            ->assertJsonFragment(['event_id' => $event->id]);
    }
}
