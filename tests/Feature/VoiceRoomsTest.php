<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use App\Models\VoiceRoom;
use App\Models\VoiceRoomInvitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VoiceRoomsTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_head_or_org_admin_can_create_lecture_or_meeting(): void
    {
        $staff = User::factory()->create([
            'organization_role' => 'staff',
            'department_role' => 'staff',
        ]);
        Sanctum::actingAs($staff);

        $this->postJson('/api/voice-rooms', [
            'title' => 'Lecture',
            'type' => 'lecture',
            'department_tags' => ['Surgery'],
        ])->assertStatus(403);

        $head = User::factory()->create([
            'department_role' => 'head',
        ]);
        Sanctum::actingAs($head);

        $this->postJson('/api/voice-rooms', [
            'title' => 'Lecture',
            'type' => 'lecture',
            'starts_at' => now()->addDay(),
            'department_tags' => ['Surgery'],
        ])->assertStatus(201);
    }

    public function test_group_call_access_levels(): void
    {
        $creator = User::factory()->create([
            'work_place' => 'City Hospital',
            'speciality' => 'Surgery',
        ]);
        Sanctum::actingAs($creator);

        $create = $this->postJson('/api/voice-rooms', [
            'title' => 'Dept Call',
            'type' => 'group_call',
            'access_level' => 'department',
        ])->assertStatus(201);

        $roomId = $create->json('id');

        $sameDept = User::factory()->create([
            'work_place' => 'Other Hospital',
            'speciality' => 'Surgery',
        ]);
        Sanctum::actingAs($sameDept);
        $this->postJson("/api/voice-rooms/{$roomId}/join")->assertStatus(200);

        $otherDept = User::factory()->create([
            'work_place' => 'City Hospital',
            'speciality' => 'Cardiology',
        ]);
        Sanctum::actingAs($otherDept);
        $this->postJson("/api/voice-rooms/{$roomId}/join")->assertStatus(403);
    }

    public function test_invite_only_room_flow(): void
    {
        $creator = User::factory()->create();
        Sanctum::actingAs($creator);

        $create = $this->postJson('/api/voice-rooms', [
            'title' => 'Invite Call',
            'type' => 'group_call',
            'access_level' => 'invite',
        ])->assertStatus(201);

        $roomId = $create->json('id');
        $invitee = User::factory()->create();

        $this->postJson("/api/voice-rooms/{$roomId}/invite", [
            'user_ids' => [$invitee->id],
        ])->assertStatus(200);

        Sanctum::actingAs($invitee);
        $this->postJson("/api/voice-rooms/{$roomId}/join")->assertStatus(403);

        $invite = VoiceRoomInvitation::where('voice_room_id', $roomId)
            ->where('user_id', $invitee->id)
            ->first();

        $this->postJson("/api/voice-rooms/{$roomId}/invites/{$invite->id}/accept")
            ->assertStatus(200);

        $this->postJson("/api/voice-rooms/{$roomId}/join")->assertStatus(200);
    }

    public function test_calendar_event_created_for_lecture_and_meeting(): void
    {
        $head = User::factory()->create([
            'department_role' => 'head',
            'work_place' => 'City Hospital',
            'speciality' => 'Surgery',
        ]);
        Sanctum::actingAs($head);

        $lecture = $this->postJson('/api/voice-rooms', [
            'title' => 'Lecture',
            'type' => 'lecture',
            'starts_at' => now()->addDays(2),
            'department_tags' => ['Surgery'],
        ])->assertStatus(201);

        $lectureId = $lecture->json('id');
        $this->assertDatabaseHas('voice_rooms', ['id' => $lectureId]);

        $room = VoiceRoom::find($lectureId);
        $this->assertNotNull($room->event_id);
        $this->assertTrue(Event::where('id', $room->event_id)->exists());

        $call = $this->postJson('/api/voice-rooms', [
            'title' => 'Call',
            'type' => 'group_call',
            'access_level' => 'public',
            'starts_at' => now()->addDays(3),
        ])->assertStatus(201);

        $callRoom = VoiceRoom::find($call->json('id'));
        $this->assertNull($callRoom->event_id);
    }

    public function test_my_invites_endpoint(): void
    {
        $creator = User::factory()->create();
        $invitee = User::factory()->create();
        $room = VoiceRoom::factory()->create([
            'creator_id' => $creator->id,
            'type' => 'group_call',
            'access_level' => 'invite',
        ]);

        VoiceRoomInvitation::factory()->create([
            'voice_room_id' => $room->id,
            'user_id' => $invitee->id,
            'invited_by' => $creator->id,
        ]);

        Sanctum::actingAs($invitee);
        $this->getJson('/api/voice-rooms/invites')
            ->assertStatus(200)
            ->assertJsonFragment(['voice_room_id' => $room->id]);
    }
}
