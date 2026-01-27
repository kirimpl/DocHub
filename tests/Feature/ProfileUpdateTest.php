<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Organization;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_profile_updates_fields_and_removes_media()
    {
        Organization::factory()->create(['name' => 'City Hospital']);
        Department::factory()->create(['name' => 'Surgeon']);

        Storage::fake('public');
        Storage::disk('public')->put('avatars/old.jpg', 'old-avatar');
        Storage::disk('public')->put('covers/old.jpg', 'old-cover');

        $user = User::factory()->create([
            'avatar' => 'avatars/old.jpg',
            'cover_image' => 'covers/old.jpg',
            'email' => 'old@example.com',
            'phone_number' => '+70000000000',
        ]);

        Sanctum::actingAs($user);

        $payload = [
            'name' => 'Иван',
            'last_name' => 'Петров',
            'city' => 'Алматы',
            'work_place' => 'City Hospital',
            'speciality' => 'Surgeon',
            'work_experience' => 12,
            'education' => 'КазНМУ',
            'email' => 'new@example.com',
            'phone_number' => '+77001234567',
            'bio' => 'Короткое описание профиля.',
            'remove_avatar' => true,
            'remove_cover_image' => true,
        ];

        $this->postJson('/api/profile', $payload)
            ->assertOk()
            ->assertJsonPath('user.name', 'Иван')
            ->assertJsonPath('user.last_name', 'Петров')
            ->assertJsonPath('user.city', 'Алматы')
            ->assertJsonPath('user.work_place', 'City Hospital')
            ->assertJsonPath('user.speciality', 'Surgeon')
            ->assertJsonPath('user.work_experience', 12)
            ->assertJsonPath('user.education', 'КазНМУ')
            ->assertJsonPath('user.email', 'new@example.com')
            ->assertJsonPath('user.phone_number', '+77001234567')
            ->assertJsonPath('user.bio', 'Короткое описание профиля.')
            ->assertJsonPath('user.avatar', null)
            ->assertJsonPath('user.cover_image', null);

        $user->refresh();

        $this->assertSame('Иван', $user->name);
        $this->assertSame('Петров', $user->last_name);
        $this->assertSame('Алматы', $user->city);
        $this->assertSame('City Hospital', $user->work_place);
        $this->assertSame('Surgeon', $user->speciality);
        $this->assertSame(12, $user->work_experience);
        $this->assertSame('КазНМУ', $user->education);
        $this->assertSame('new@example.com', $user->email);
        $this->assertSame('+77001234567', $user->phone_number);
        $this->assertSame('Короткое описание профиля.', $user->bio);
        $this->assertNull($user->avatar);
        $this->assertNull($user->cover_image);

        Storage::disk('public')->assertMissing('avatars/old.jpg');
        Storage::disk('public')->assertMissing('covers/old.jpg');
    }
}
