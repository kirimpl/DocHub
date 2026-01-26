<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\FriendRequest;
use App\Models\Message;
use App\Models\Post;
use App\Models\User;
use App\Models\VoiceRoom;
use App\Notifications\FriendRequestAcceptedNotification;
use App\Notifications\NewCommentLikeNotification;
use App\Notifications\NewCommentNotification;
use App\Notifications\NewFriendRequestNotification;
use App\Notifications\NewLikeNotification;
use App\Notifications\NewMessageNotification;
use App\Notifications\NewPostNotification;
use App\Notifications\VerificationRequiredNotification;
use App\Notifications\VoiceRoomNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationRealtimeChannelsTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_notifications_include_broadcast_channel(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);
        $comment = Comment::factory()->create(['user_id' => $other->id, 'post_id' => $post->id]);
        $message = Message::factory()->create(['sender_id' => $other->id, 'recipient_id' => $user->id]);
        $room = VoiceRoom::factory()->create(['creator_id' => $user->id]);

        $friendRequest = FriendRequest::create([
            'requester_id' => $other->id,
            'recipient_id' => $user->id,
            'status' => 'pending',
        ]);

        $notifications = [
            new NewPostNotification($post, $user, ['General'], 'local'),
            new NewCommentNotification($post, $comment),
            new NewLikeNotification($post, $other),
            new NewCommentLikeNotification($comment, $other),
            new NewFriendRequestNotification($friendRequest),
            new FriendRequestAcceptedNotification($friendRequest),
            new NewMessageNotification($message),
            new VoiceRoomNotification($room, $user, ['General'], 'local'),
            new VerificationRequiredNotification($other->id),
        ];

        foreach ($notifications as $notification) {
            $channels = $notification->via($user);
            $this->assertContains('broadcast', $channels);
            $this->assertContains('database', $channels);
        }
    }
}
