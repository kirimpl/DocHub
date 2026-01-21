<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PrivacyController extends Controller
{
    public function update(Request $request)
    {
        $data = $request->validate([
            'is_private' => 'boolean',
            'show_last_seen' => 'boolean',
            'show_status' => 'boolean',
            'allow_messages_from_non_friends' => 'boolean',
            'show_followers' => 'boolean',
            'show_following' => 'boolean',
            'email_visibility' => 'in:everyone,friends,nobody',
            'posts_visibility' => 'in:everyone,followers,friends,nobody',
            'comments_visibility' => 'in:everyone,followers,friends,nobody',
            'messages_visibility' => 'in:everyone,followers,friends,nobody',
        ]);

        $user = $request->user();
        foreach ($data as $key => $value) {
            if (in_array($key, ['posts_visibility', 'comments_visibility', 'messages_visibility'], true)) {
                $user->{$key} = $value;
                continue;
            }
            $user->{$key} = (bool) $value;
        }
        $user->save();

        return response()->json([
            'message' => 'Privacy updated',
            'is_private' => $user->is_private,
            'show_last_seen' => $user->show_last_seen,
            'show_status' => $user->show_status,
            'allow_messages_from_non_friends' => $user->allow_messages_from_non_friends,
            'show_followers' => $user->show_followers,
            'show_following' => $user->show_following,
            'email_visibility' => $user->email_visibility,
            'posts_visibility' => $user->posts_visibility,
            'comments_visibility' => $user->comments_visibility,
            'messages_visibility' => $user->messages_visibility,
        ]);
    }
}
