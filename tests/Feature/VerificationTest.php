<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_user_cannot_access_protected_endpoints(): void
    {
        Organization::factory()->create(['name' => 'City Hospital']);
        Department::factory()->create(['name' => 'Surgery']);

        $register = $this->postJson('/api/register', [
            'name' => 'Alice',
            'email' => 'alice@example.com',
            'password' => 'password',
            'speciality' => 'Surgery',
            'work_experience' => 5,
            'work_place' => 'City Hospital',
            'last_name' => 'Smith',
            'sex' => 'man',
            'phone_number' => '+77001234567',
            'birth_date' => '2000-01-01',
            'education' => 'KZMU',
        ])->assertStatus(201);

        $token = $register->json('token');

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/feed')
            ->assertStatus(403);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/feed/global')
            ->assertStatus(200);
    }

    public function test_verification_document_upload_and_status(): void
    {
        Storage::fake('public');
        $user = User::factory()->create(['verification_status' => 'pending']);
        Sanctum::actingAs($user);

        $this->postJson('/api/verification/documents', [
            'document' => \Illuminate\Http\UploadedFile::fake()->create('doc.pdf', 200, 'application/pdf'),
            'notes' => 'My documents',
        ])->assertStatus(201);

        $this->assertDatabaseHas('verification_documents', [
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
    }

    public function test_admin_can_approve_and_user_gets_groups(): void
    {
        Organization::factory()->create(['name' => 'City Hospital']);
        Department::factory()->create(['name' => 'Surgery']);

        $pending = User::factory()->create([
            'verification_status' => 'pending',
            'work_place' => 'City Hospital',
            'speciality' => 'Surgery',
            'organization_role' => 'staff',
            'department_role' => 'staff',
        ]);

        $admin = User::factory()->create([
            'global_role' => 'admin',
            'verification_status' => 'verified',
        ]);

        Sanctum::actingAs($admin);
        $this->postJson('/api/verification/' . $pending->id . '/approve')
            ->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => $pending->id,
            'verification_status' => 'verified',
        ]);

        $this->assertDatabaseHas('chat_group_members', [
            'user_id' => $pending->id,
        ]);
    }
}
