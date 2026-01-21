<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\FriendRequest;
use App\Notifications\NewFriendRequestNotification;
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

        $request = FriendRequest::create([
            'requester_id' => $actor->id,
            'recipient_id' => $user->id,
            'status' => 'pending',
        ]);

        $user->notify(new NewFriendRequestNotification($request));

   
        $this->actingAs($user, 'sanctum')
            ->getJson('/api/notifications')
            ->assertStatus(200)
            ->assertJsonFragment(['type' => NewFriendRequestNotification::class]);

        
        /** @var \stdClass|null $notif */
        $notif = DB::table('notifications')->where('notifiable_id', $user->id)->first();
        $this->assertNotNull($notif);

     
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/notifications/'.$notif->id.'/read')
            ->assertStatus(200);

        $this->assertDatabaseMissing('notifications', ['id' => $notif->id, 'read_at' => null]);

        
        $actor2 = User::factory()->create();
        $request2 = FriendRequest::create([
            'requester_id' => $actor2->id,
            'recipient_id' => $user->id,
            'status' => 'pending',
        ]);

        $user->notify(new NewFriendRequestNotification($request2));

     
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/notifications/read-all')
            ->assertStatus(200);

        $this->assertDatabaseMissing('notifications', ['notifiable_id' => $user->id, 'read_at' => null]);
    }
}
