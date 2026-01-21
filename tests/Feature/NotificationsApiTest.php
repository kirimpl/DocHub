<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Notifications\NewFollowNotification;
use Illuminate\Support\Facades\DB;

class NotificationsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_and_mark_notifications()
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create();

        /** @var \App\Models\User $actor */
        $actor = User::factory()->create();

        $token = $actor->createToken('api')->plainTextToken;

  
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/follow/'.$user->id)
            ->assertStatus(200);

   
        $this->actingAs($user, 'sanctum')
            ->getJson('/api/notifications')
            ->assertStatus(200)
            ->assertJsonFragment(['type' => NewFollowNotification::class]);

        
        /** @var \stdClass|null $notif */
        $notif = DB::table('notifications')->where('notifiable_id', $user->id)->first();
        $this->assertNotNull($notif);

     
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/notifications/'.$notif->id.'/read')
            ->assertStatus(200);

        $this->assertDatabaseMissing('notifications', ['id' => $notif->id, 'read_at' => null]);

        
        $this->actingAs($actor, 'sanctum')
            ->postJson('/api/follow/'.$user->id)
            ->assertStatus(200);

     
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/notifications/read-all')
            ->assertStatus(200);

        $this->assertDatabaseMissing('notifications', ['notifiable_id' => $user->id, 'read_at' => null]);
    }
}
