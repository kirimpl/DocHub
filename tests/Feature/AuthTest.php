<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_and_login()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Alice',
            'email' => 'alice@example.com',
            'password' => 'password',
            'speciality'=> 'Хирург',
            'work_experience'=> '12',
            'work_place'=> '3 городская пол',

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
