<?php

namespace App\Policies;

use App\Models\Like;
use App\Models\User;
use App\Models\Post;

class LikePolicy
{
    public function like(User $user, Post $post)
    {
        if ($user->id === $post->user_id) {
            return true;
        }
        if ($post->is_global) {
            return true;
        }
        $viewerOrg = $user->work_place;
        if ($viewerOrg && $post->organization_name && $viewerOrg === $post->organization_name) {
            return true;
        }
        return false;
    }
}
