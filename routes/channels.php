<?php

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are used
| to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('messages.{id}', function ($user, $id) {
    // only the recipient (and optionally the sender) should subscribe to this private channel
    return (int) $user->id === (int) $id;
});

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('lecture.{id}', function ($user, $id) {
    $lecture = \App\Models\Lecture::find($id);
    if (!$lecture) {
        return false;
    }
    if ($user->isGlobalAdmin() || (int) $lecture->creator_id === (int) $user->id) {
        return true;
    }
    return $lecture->participants()->where('users.id', $user->id)->exists();
});

Broadcast::channel('group-chat.{id}', function ($user, $id) {
    $group = \App\Models\ChatGroup::find($id);
    if (!$group) {
        return false;
    }
    if ($user->isGlobalAdmin()) {
        return true;
    }
    return $group->members()->where('users.id', $user->id)->exists();
});
