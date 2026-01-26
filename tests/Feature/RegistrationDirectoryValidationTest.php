<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationDirectoryValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_rejects_unknown_org_or_department()
    {
        Organization::factory()->create(['name' => 'City Hospital']);
        Department::factory()->create(['name' => 'Surgery']);

        $response = $this->postJson('/api/register', [
            'name' => 'Alice',
            'email' => 'alice@example.com',
            'password' => 'password',
            'speciality' => 'Unknown Department',
            'work_experience' => 5,
            'work_place' => 'Unknown Hospital',
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['message', 'errors']);
    }

    public function test_register_requires_verification_and_skips_groups()
    {
        Organization::factory()->create(['name' => 'City Hospital']);
        Organization::factory()->create(['name' => 'Central Clinic']);
        Department::factory()->create(['name' => 'Surgery']);

        $response = $this->postJson('/api/register', [
            'name' => 'Bob',
            'email' => 'bob@example.com',
            'password' => 'password',
            'speciality' => 'Surgery',
            'work_experience' => 10,
            'work_place' => 'City Hospital',
            'secondary_work_place' => 'Central Clinic',
            'secondary_speciality' => 'Surgery',
            'last_name' => 'Smith',
            'sex' => 'man',
            'phone_number' => '+77001234567',
            'birth_date' => '2000-01-01',
            'education' => 'KZMU',
        ]);

        $response->assertStatus(201);
        $user = User::where('email', 'bob@example.com')->firstOrFail();

        $this->assertSame('pending', $user->verification_status);
        $this->assertDatabaseMissing('chat_group_members', [
            'user_id' => $user->id,
        ]);
    }
}
