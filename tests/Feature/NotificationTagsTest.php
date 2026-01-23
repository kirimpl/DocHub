<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\VoiceRoom;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;

class NotificationTagsTest extends TestCase
{
    use RefreshDatabase;

    public function test_post_notifications_respect_tags_and_scope(): void
    {
        $author = User::factory()->create([
            'work_place' => 'City Hospital',
            'speciality' => 'Surgery',
        ]);
        $sameOrg = User::factory()->create([
            'work_place' => 'City Hospital',
            'speciality' => 'Surgery',
        ]);
        $otherOrg = User::factory()->create([
            'work_place' => 'Other Hospital',
            'speciality' => 'Surgery',
        ]);
        $otherDept = User::factory()->create([
            'work_place' => 'City Hospital',
            'speciality' => 'Cardiology',
        ]);

        Sanctum::actingAs($author);
        $this->postJson('/api/posts', [
            'content' => 'Local post',
            'is_global' => false,
            'department_tags' => ['Surgery'],
        ])->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $sameOrg->id,
            'type' => \App\Notifications\NewPostNotification::class,
        ]);
        $this->assertDatabaseMissing('notifications', [
            'notifiable_id' => $otherOrg->id,
            'type' => \App\Notifications\NewPostNotification::class,
        ]);
        $this->assertDatabaseMissing('notifications', [
            'notifiable_id' => $otherDept->id,
            'type' => \App\Notifications\NewPostNotification::class,
        ]);
        $this->assertDatabaseMissing('notifications', [
            'notifiable_id' => $author->id,
            'type' => \App\Notifications\NewPostNotification::class,
        ]);

        $this->postJson('/api/posts', [
            'content' => 'Global post',
            'is_global' => true,
            'department_tags' => ['Surgery'],
        ])->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $sameOrg->id,
            'type' => \App\Notifications\NewPostNotification::class,
        ]);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $otherOrg->id,
            'type' => \App\Notifications\NewPostNotification::class,
        ]);
        $this->assertDatabaseMissing('notifications', [
            'notifiable_id' => $otherDept->id,
            'type' => \App\Notifications\NewPostNotification::class,
        ]);
    }

    public function test_voice_room_notifications_respect_tags_and_scope(): void
    {
        $creator = User::factory()->create([
            'department_role' => 'head',
            'work_place' => 'City Hospital',
            'speciality' => 'Surgery',
        ]);
        $sameOrg = User::factory()->create([
            'work_place' => 'City Hospital',
            'speciality' => 'Surgery',
        ]);
        $otherOrg = User::factory()->create([
            'work_place' => 'Other Hospital',
            'speciality' => 'Surgery',
        ]);
        $otherDept = User::factory()->create([
            'work_place' => 'City Hospital',
            'speciality' => 'Cardiology',
        ]);

        Sanctum::actingAs($creator);
        $this->postJson('/api/voice-rooms', [
            'title' => 'Lecture Global',
            'type' => 'lecture',
            'notify_scope' => 'global',
            'department_tags' => ['Surgery'],
            'starts_at' => now()->addDay(),
        ])->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $sameOrg->id,
            'type' => \App\Notifications\VoiceRoomNotification::class,
        ]);
        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $otherOrg->id,
            'type' => \App\Notifications\VoiceRoomNotification::class,
        ]);
        $this->assertDatabaseMissing('notifications', [
            'notifiable_id' => $otherDept->id,
            'type' => \App\Notifications\VoiceRoomNotification::class,
        ]);

        DB::table('notifications')->delete();

        $this->postJson('/api/voice-rooms', [
            'title' => 'Meeting Local',
            'type' => 'meeting',
            'department_tags' => ['Surgery'],
            'starts_at' => now()->addDays(2),
        ])->assertStatus(201);

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $sameOrg->id,
            'type' => \App\Notifications\VoiceRoomNotification::class,
        ]);
        $this->assertDatabaseMissing('notifications', [
            'notifiable_id' => $otherOrg->id,
            'type' => \App\Notifications\VoiceRoomNotification::class,
        ]);

        $this->postJson('/api/voice-rooms', [
            'title' => 'Group Call',
            'type' => 'group_call',
            'access_level' => 'public',
        ])->assertStatus(201);
    }
}
