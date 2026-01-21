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
            'email_visibility' => 'in:everyone,friends,nobody',
            'posts_visibility' => 'in:everyone,friends,nobody',
            'comments_visibility' => 'in:everyone,friends,nobody',
            'messages_visibility' => 'in:everyone,friends,nobody',
            'notifications_enabled' => 'boolean',
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
            'email_visibility' => $user->email_visibility,
            'posts_visibility' => $user->posts_visibility,
            'comments_visibility' => $user->comments_visibility,
            'messages_visibility' => $user->messages_visibility,
            'notifications_enabled' => $user->notifications_enabled,
        ]);
    }
}
