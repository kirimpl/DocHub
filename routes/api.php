<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\FeedController;
use App\Http\Controllers\API\MessageController;
use App\Http\Controllers\API\PostController;
use App\Http\Controllers\API\CommentController;
use App\Http\Controllers\API\LikeController;
use App\Http\Controllers\API\SearchController;
use App\Http\Controllers\API\PrivacyController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\MessageReactionController;
use App\Http\Controllers\API\ChatGroupController;
use App\Http\Controllers\API\ChatGroupMessageController;
use App\Http\Controllers\API\ChatGroupMessageReactionController;
use App\Http\Controllers\API\BlockController;
use App\Http\Controllers\API\OrganizationController;
use App\Http\Controllers\API\DepartmentController;
use App\Http\Controllers\API\LectureController;
use App\Http\Controllers\API\LectureRecordingController;
use App\Http\Controllers\API\EventController;
use App\Http\Controllers\API\VoiceRoomController;
use App\Http\Controllers\API\VerificationController;
use App\Http\Controllers\API\AiController;
use App\Http\Controllers\API\DirectoryController;
use App\Http\Controllers\API\ProfileController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\NoteController;

// public endpoints
Route::get('ping', function () {
    return response()->json(['pong' => true]);
});

Route::post('login', [AuthController::class, 'login']);
Route::post('register', [AuthController::class, 'register']);
Route::get('organizations', [OrganizationController::class, 'index']);
Route::get('departments', [DepartmentController::class, 'index']);
Route::get('directory/organizations', [DirectoryController::class, 'organizations']);
Route::get('directory/work-places', [DirectoryController::class, 'workPlaces']);
Route::get('directory/departments', [DirectoryController::class, 'departments']);
Route::get('directory/cities', [DirectoryController::class, 'cities']);
Route::get('directory/educations', [DirectoryController::class, 'educations']);
Route::get('directory/positions', [DirectoryController::class, 'positions']);
Route::get('directory/categories', [DirectoryController::class, 'categories']);

Route::middleware('auth:sanctum', 'update.last.seen')->group(function () {
    // verification (available for pending users)
    Route::get('verification/status', [VerificationController::class, 'status']);
    Route::get('verification/support', [VerificationController::class, 'support']);
    Route::get('verification/support/tickets', [VerificationController::class, 'supportTickets']);
    Route::get('verification/support/messages', [VerificationController::class, 'supportMessages']);
    Route::post('verification/support/messages', [VerificationController::class, 'sendSupportMessage']);
    Route::get('verification/support/threads', [VerificationController::class, 'supportThreads']);
    Route::get('verification/support/threads/{ticketId}', [VerificationController::class, 'supportThreadMessages'])->whereNumber('ticketId');
    Route::post('verification/support/threads/{ticketId}', [VerificationController::class, 'sendSupportReply'])->whereNumber('ticketId');
    Route::post('verification/support/threads/{ticketId}/resolve', [VerificationController::class, 'resolveSupportTicket'])->whereNumber('ticketId');
    Route::delete('verification/support/threads/{ticketId}', [VerificationController::class, 'deleteSupportTicket'])->whereNumber('ticketId');
    Route::get('verification/documents', [VerificationController::class, 'documents']);
    Route::post('verification/documents', [VerificationController::class, 'uploadDocument']);
    Route::get('verification/pending', [VerificationController::class, 'pending']);
    Route::get('verification/approved', [VerificationController::class, 'approved']);
    Route::post('verification/{id}/approve', [VerificationController::class, 'approve'])->whereNumber('id');
    Route::post('verification/{id}/reject', [VerificationController::class, 'reject'])->whereNumber('id');
});

Route::middleware('auth:sanctum', 'update.last.seen', 'verified.doctor', 'not.restricted')->group(function () {
    Route::get('me', [AuthController::class, 'me']);
    // users
    Route::get('users', function (Request $request) {
        $user = $request->user();
        $blockedIds = \App\Models\UserBlock::where('blocker_id', $user->id)->pluck('blocked_id');
        $blockedByIds = \App\Models\UserBlock::where('blocked_id', $user->id)->pluck('blocker_id');
        $blocked = $blockedIds->merge($blockedByIds)->unique()->values()->all();
        $query = \App\Models\User::select('id', 'name', 'email', 'avatar', 'is_online', 'last_seen');
        if (!empty($blocked)) {
            $query->whereNotIn('id', $blocked);
        }
        return $query->get();
    });
    Route::get('users/online', function (Request $request) {
        $user = $request->user();
        $blockedIds = \App\Models\UserBlock::where('blocker_id', $user->id)->pluck('blocked_id');
        $blockedByIds = \App\Models\UserBlock::where('blocked_id', $user->id)->pluck('blocker_id');
        $blocked = $blockedIds->merge($blockedByIds)->unique()->values()->all();
        $query = \App\Models\User::where('is_online', true)->select('id', 'name', 'email', 'avatar', 'last_seen');
        if (!empty($blocked)) {
            $query->whereNotIn('id', $blocked);
        }
        return $query->get();
    });
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('profile/{id}', [AuthController::class, 'profile'])->whereNumber('id');
    // notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/subscribe', [NotificationController::class, 'subscribe']);
    Route::post('notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);

    // AI
    Route::post('ai/improve', [AiController::class, 'improve']);
    Route::post('ai/lecture/summary', [AiController::class, 'lectureSummary']);
    Route::post('ai/key-points', [AiController::class, 'keyPoints']);
    Route::post('ai/lecture/outline', [AiController::class, 'lectureOutline']);
    Route::post('ai/lecture/questions', [AiController::class, 'quizQuestions']);
    // feed
    Route::get('feed', [FeedController::class, 'index']);
    Route::get('feed/global', [FeedController::class, 'global']);
    Route::get('feed/organization', [FeedController::class, 'organization']);

    // posts
    Route::get('posts', [PostController::class, 'index']);
    Route::post('posts', [PostController::class, 'store']);
    Route::post('posts/{id}/share', [PostController::class, 'share']);
    Route::get('posts/{id}', [PostController::class, 'show']);
    Route::patch('posts/{id}', [PostController::class, 'update']);
    Route::delete('posts/{id}', [PostController::class, 'destroy']);
    Route::get('my-posts', [PostController::class, 'myPosts']);

    // media uploads (local storage for images/files)
    Route::post('media', [\App\Http\Controllers\API\MediaController::class, 'store']);

    // comments
    Route::get('posts/{id}/comments', [CommentController::class, 'index']);
    Route::post('posts/{id}/comments', [CommentController::class, 'store']);
    Route::delete('comments/{id}', [CommentController::class, 'destroy']);
    Route::post('comments/{id}/like', [LikeController::class, 'likeComment']);

    // likes
    Route::post('posts/{id}/like', [LikeController::class, 'like']);
    Route::post('posts/{id}/unlike', [LikeController::class, 'unlike']);
    Route::get('posts/{id}/likes', [LikeController::class, 'index']);

    // messages
    Route::get('messages/inbox', [MessageController::class, 'inbox']);
    Route::post('messages/send', [MessageController::class, 'send']);
    Route::get('messages/subscribe', [MessageController::class, 'subscribe']);
    Route::get('messages/conversation/{userId}', [MessageController::class, 'conversation']);
    Route::get('messages/conversation/{userId}/pinned', [MessageController::class, 'pinned']);
    Route::delete('messages/conversation/{userId}', [MessageController::class, 'deleteConversation']);
    Route::patch('messages/conversation/{userId}', [MessageController::class, 'deleteConversation']);
    Route::delete('messages/{id}', [MessageController::class, 'deleteMessage']);
    Route::post('messages/{id}/reactions', [MessageReactionController::class, 'toggle'])->whereNumber('id');
    Route::post('messages/{id}/pin', [MessageController::class, 'pin'])->whereNumber('id');
    Route::delete('messages/{id}/pin', [MessageController::class, 'unpin'])->whereNumber('id');

    // group chats
    Route::get('group-chats', [ChatGroupController::class, 'index']);
    Route::post('group-chats', [ChatGroupController::class, 'store']);
    Route::get('group-chats/{id}', [ChatGroupController::class, 'show'])->whereNumber('id');
    Route::patch('group-chats/{id}', [ChatGroupController::class, 'update'])->whereNumber('id');
    Route::post('group-chats/{id}/members', [ChatGroupController::class, 'addMembers'])->whereNumber('id');
    Route::delete('group-chats/{id}/members/{memberId}', [ChatGroupController::class, 'removeMember'])->whereNumber('id')->whereNumber('memberId');
    Route::post('group-chats/{id}/leave', [ChatGroupController::class, 'leave'])->whereNumber('id');
    Route::delete('group-chats/{id}', [ChatGroupController::class, 'destroy'])->whereNumber('id');
    Route::get('group-chats/{id}/messages', [ChatGroupMessageController::class, 'index'])->whereNumber('id');
    Route::post('group-chats/{id}/messages', [ChatGroupMessageController::class, 'store'])->whereNumber('id');
    Route::post('group-chats/{id}/join', [ChatGroupMessageController::class, 'joinNotify'])->whereNumber('id');
    Route::delete('group-chats/{id}/messages/{messageId}', [ChatGroupMessageController::class, 'destroy'])->whereNumber('id')->whereNumber('messageId');
    Route::post('group-chats/{id}/messages/{messageId}/reactions', [ChatGroupMessageReactionController::class, 'toggle'])->whereNumber('id')->whereNumber('messageId');
    Route::get('group-chats/{id}/pinned', [ChatGroupMessageController::class, 'pinned'])->whereNumber('id');
    Route::post('group-chats/{id}/messages/{messageId}/pin', [ChatGroupMessageController::class, 'pin'])->whereNumber('id')->whereNumber('messageId');
    Route::delete('group-chats/{id}/messages/{messageId}/pin', [ChatGroupMessageController::class, 'unpin'])->whereNumber('id')->whereNumber('messageId');

    // friends / friend requests
    Route::get('friends', [\App\Http\Controllers\API\FriendController::class, 'index']);
    Route::post('friends/request', [\App\Http\Controllers\API\FriendController::class, 'sendRequest']);
    Route::get('friends/requests', [\App\Http\Controllers\API\FriendController::class, 'listRequests']);
    Route::get('friends/requests/sent', [\App\Http\Controllers\API\FriendController::class, 'sentRequests']);
    Route::post('friends/requests/{id}/accept', [\App\Http\Controllers\API\FriendController::class, 'acceptRequest']);
    Route::post('friends/requests/{id}/decline', [\App\Http\Controllers\API\FriendController::class, 'declineRequest']);
    Route::post('friends/requests/{id}/cancel', [\App\Http\Controllers\API\FriendController::class, 'cancelRequest']);
    Route::delete('friends/{id}', [\App\Http\Controllers\API\FriendController::class, 'removeFriend']);

    // search
    Route::get('search', [SearchController::class, 'search']);

    // privacy
    Route::post('privacy', [PrivacyController::class, 'update']);
    Route::post('profile', [AuthController::class, 'updateProfile']);
    Route::post('profile/{id}/share', [AuthController::class, 'shareProfile'])->whereNumber('id');
    Route::post('profile/pin-post', [AuthController::class, 'pinPost']);
    Route::post('security/password', [AuthController::class, 'updatePassword']);
    Route::get('security/sessions', [AuthController::class, 'sessions']);
    Route::post('security/logout-all', [AuthController::class, 'logoutAll']);

    // blocks
    Route::get('blocks', [BlockController::class, 'index']);
    Route::post('blocks', [BlockController::class, 'store']);
    Route::delete('blocks/{id}', [BlockController::class, 'destroy'])->whereNumber('id');

    // lectures
    Route::get('lectures', [LectureController::class, 'index']);
    Route::post('lectures', [LectureController::class, 'store']);
    Route::get('lectures/{id}', [LectureController::class, 'show'])->whereNumber('id');
    Route::patch('lectures/{id}', [LectureController::class, 'update'])->whereNumber('id');
    Route::post('lectures/{id}/join', [LectureController::class, 'join'])->whereNumber('id');
    Route::post('lectures/{id}/leave', [LectureController::class, 'leave'])->whereNumber('id');
    Route::post('lectures/{id}/end', [LectureController::class, 'end'])->whereNumber('id');
    Route::post('lectures/{id}/admins', [LectureController::class, 'addAdmins'])->whereNumber('id');
    Route::get('lectures/{id}/participants', [LectureController::class, 'participants'])->whereNumber('id');
    Route::get('lectures/invites', [LectureController::class, 'myInvites']);
    Route::post('lectures/{id}/invite', [LectureController::class, 'invite'])->whereNumber('id');
    Route::post('lectures/{id}/invites/{inviteId}/accept', [LectureController::class, 'acceptInvite'])->whereNumber('id')->whereNumber('inviteId');
    Route::post('lectures/{id}/invites/{inviteId}/decline', [LectureController::class, 'declineInvite'])->whereNumber('id')->whereNumber('inviteId');
    Route::post('lectures/{id}/kick', [LectureController::class, 'kick'])->whereNumber('id');
    Route::post('lectures/{id}/ban', [LectureController::class, 'ban'])->whereNumber('id');
    Route::post('lectures/{id}/signal', [LectureController::class, 'signal'])->whereNumber('id');
    Route::get('lectures/{id}/recordings', [LectureRecordingController::class, 'index'])->whereNumber('id');
    Route::post('lectures/{id}/recordings', [LectureRecordingController::class, 'store'])->whereNumber('id');
    Route::get('lectures/{id}/recordings/{recordingId}/download', [LectureRecordingController::class, 'download'])->whereNumber('id')->whereNumber('recordingId');

    // reports
    Route::post('reports/lectures', [ReportController::class, 'reportLecture']);
    Route::post('reports/users', [ReportController::class, 'reportUser']);
    Route::get('reports/lectures', [ReportController::class, 'lectureReports']);
    Route::get('reports/users', [ReportController::class, 'userReports']);
    Route::post('reports/lectures/{id}/approve', [ReportController::class, 'approveLectureReport'])->whereNumber('id');
    Route::post('reports/lectures/{id}/reject', [ReportController::class, 'rejectLectureReport'])->whereNumber('id');
    Route::post('reports/users/{id}/approve', [ReportController::class, 'approveUserReport'])->whereNumber('id');
    Route::post('reports/users/{id}/reject', [ReportController::class, 'rejectUserReport'])->whereNumber('id');

    // events
    Route::get('events', [EventController::class, 'index']);
    Route::get('events/meetings', [EventController::class, 'meetings']);
    Route::get('events/calendar', [EventController::class, 'calendar']);
    Route::get('events/invites', [EventController::class, 'myInvites']);
    Route::post('events', [EventController::class, 'store']);
    Route::get('events/{id}', [EventController::class, 'show'])->whereNumber('id');
    Route::patch('events/{id}', [EventController::class, 'update'])->whereNumber('id');
    Route::delete('events/{id}', [EventController::class, 'destroy'])->whereNumber('id');
    Route::post('events/{id}/join', [EventController::class, 'join'])->whereNumber('id');
    Route::post('events/{id}/leave', [EventController::class, 'leave'])->whereNumber('id');
    Route::post('events/{id}/invite', [EventController::class, 'invite'])->whereNumber('id');
    Route::post('events/{id}/invites/{inviteId}/accept', [EventController::class, 'acceptInvite'])->whereNumber('id')->whereNumber('inviteId');
    Route::post('events/{id}/invites/{inviteId}/decline', [EventController::class, 'declineInvite'])->whereNumber('id')->whereNumber('inviteId');

    // voice rooms
    Route::get('voice-rooms', [VoiceRoomController::class, 'index']);
    Route::post('voice-rooms', [VoiceRoomController::class, 'store']);
    Route::get('voice-rooms/invites', [VoiceRoomController::class, 'myInvites']);
    Route::get('voice-rooms/{id}', [VoiceRoomController::class, 'show'])->whereNumber('id');
    Route::patch('voice-rooms/{id}', [VoiceRoomController::class, 'update'])->whereNumber('id');
    Route::delete('voice-rooms/{id}', [VoiceRoomController::class, 'destroy'])->whereNumber('id');
    Route::post('voice-rooms/{id}/join', [VoiceRoomController::class, 'join'])->whereNumber('id');
    Route::post('voice-rooms/{id}/leave', [VoiceRoomController::class, 'leave'])->whereNumber('id');
    Route::post('voice-rooms/{id}/invite', [VoiceRoomController::class, 'invite'])->whereNumber('id');
    Route::post('voice-rooms/{id}/invites/{inviteId}/accept', [VoiceRoomController::class, 'acceptInvite'])->whereNumber('id')->whereNumber('inviteId');
    Route::post('voice-rooms/{id}/invites/{inviteId}/decline', [VoiceRoomController::class, 'declineInvite'])->whereNumber('id')->whereNumber('inviteId');

    // notes
    Route::get('notes', [NoteController::class, 'index']);
    Route::post('notes', [NoteController::class, 'store']);
    Route::patch('notes/{id}', [NoteController::class, 'update'])->whereNumber('id');
    Route::delete('notes/{id}', [NoteController::class, 'destroy'])->whereNumber('id');
    //avatar
    

    Route::post('profile/cover', [ProfileController::class, 'updateCover'])->middleware('auth:sanctum');
    Route::middleware('auth:sanctum')->post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
});
    
