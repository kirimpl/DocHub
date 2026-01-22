<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrganizationDepartmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_organizations_list_and_search()
    {
        Organization::factory()->create(['name' => 'City Hospital']);
        Organization::factory()->create(['name' => 'Central Clinic']);

        $this->getJson('/api/organizations')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'City Hospital'])
            ->assertJsonFragment(['name' => 'Central Clinic']);

        $this->getJson('/api/organizations?q=City')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'City Hospital'])
            ->assertJsonMissing(['name' => 'Central Clinic']);
    }

    public function test_departments_list_and_search()
    {
        Department::factory()->create(['name' => 'Surgery']);
        Department::factory()->create(['name' => 'Cardiology']);

        $this->getJson('/api/departments')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Surgery'])
            ->assertJsonFragment(['name' => 'Cardiology']);

        $this->getJson('/api/departments?q=Card')
            ->assertStatus(200)
            ->assertJsonFragment(['name' => 'Cardiology'])
            ->assertJsonMissing(['name' => 'Surgery']);
    }
}
