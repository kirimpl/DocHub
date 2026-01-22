<?php

namespace Tests\Feature;

use App\Models\Lecture;
use App\Models\Organization;
use App\Models\Department;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LecturesTest extends TestCase
{
    use RefreshDatabase;

    private function seedDirectories(): void
    {
        Organization::factory()->create(['name' => 'City Hospital']);
        Department::factory()->create(['name' => 'Surgery']);
    }

    public function test_create_online_lecture_creates_chat_group()
    {
        $this->seedDirectories();
        $creator = User::factory()->create([
            'work_place' => 'City Hospital',
            'speciality' => 'Surgery',
        ]);
        $admin = User::factory()->create(['global_role' => 'admin']);

        Sanctum::actingAs($creator);
        $response = $this->postJson('/api/lectures', [
            'title' => 'Live Lecture',
            'is_online' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['lecture', 'chat_group']);

        $lectureId = $response->json('lecture.id');
        $groupId = $response->json('chat_group.id');

        $this->assertDatabaseHas('chat_groups', [
            'id' => $groupId,
            'type' => 'lecture',
            'lecture_id' => $lectureId,
        ]);

        $this->assertDatabaseHas('chat_group_members', [
            'chat_group_id' => $groupId,
            'user_id' => $creator->id,
            'role' => 'admin',
        ]);
        $this->assertDatabaseHas('chat_group_members', [
            'chat_group_id' => $groupId,
            'user_id' => $admin->id,
            'role' => 'admin',
        ]);
    }

    public function test_join_and_end_lecture_restricts_chat()
    {
        $this->seedDirectories();
        $creator = User::factory()->create();
        $admin = User::factory()->create(['global_role' => 'admin']);
        $member = User::factory()->create();

        Sanctum::actingAs($creator);
        $create = $this->postJson('/api/lectures', [
            'title' => 'Case Review',
            'is_online' => true,
        ]);

        $lectureId = $create->json('lecture.id');
        $groupId = $create->json('chat_group.id');

        Sanctum::actingAs($member);
        $this->postJson("/api/lectures/{$lectureId}/join")
            ->assertStatus(200);

        $this->assertDatabaseHas('chat_group_members', [
            'chat_group_id' => $groupId,
            'user_id' => $member->id,
        ]);

        Sanctum::actingAs($creator);
        $this->postJson("/api/group-chats/{$groupId}/messages", ['body' => 'Welcome'])
            ->assertStatus(201);

        Sanctum::actingAs($creator);
        $this->postJson("/api/lectures/{$lectureId}/end")
            ->assertStatus(200);

        $this->assertDatabaseMissing('chat_group_members', [
            'chat_group_id' => $groupId,
            'user_id' => $creator->id,
        ]);
        $this->assertDatabaseMissing('chat_group_members', [
            'chat_group_id' => $groupId,
            'user_id' => $member->id,
        ]);

        Sanctum::actingAs($creator);
        $this->getJson("/api/group-chats/{$groupId}/messages")
            ->assertStatus(403);

        Sanctum::actingAs($admin);
        $this->getJson("/api/group-chats/{$groupId}/messages")
            ->assertStatus(200);
    }
}
