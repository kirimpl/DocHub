<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Organization;
use App\Models\Department;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_and_login()
    {
        Organization::factory()->create(['name' => 'City Hospital']);
        Department::factory()->create(['name' => 'Surgeon']);

        $response = $this->postJson('/api/register', [
            'name' => 'Alice',
            'email' => 'alice@example.com',
            'password' => 'password',
            'username'=>'username',
            'last_name'=>'Alxw',
            'sex'=>'woman',
            'birth_date'=>'06.04.2000',
            'education'=>'Macan',
            'phone_number'=>'+77056797188',
            'speciality'=> 'Surgeon',
            'work_experience'=> 12,
            'work_place'=> 'City Hospital',
            'category' => 'First',
            'position' => 'Doctor',
            'organization_role' => 'staff',
        ]);

        $response->assertStatus(201)->assertJsonStructure(['token','user']);

        $login = $this->postJson('/api/login', [
            'email' => 'alice@example.com',
            'password' => 'password',
        ]);

        $login->assertStatus(200)->assertJsonStructure(['token','user']);
    }

    public function test_logout_revokes_token()
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);
        $token = $user->createToken('api')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/logout')
            ->assertStatus(200);
    }
}
