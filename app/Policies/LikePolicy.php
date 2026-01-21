<?php

namespace App\Policies;

use App\Models\Like;
use App\Models\User;
use App\Models\Post;

class LikePolicy
{
    public function like(User $user, Post $post)
    {
  
        if ($post->is_public) return true;
        if ($user->id === $post->user_id) return true;
        return $user->friends()->where('users.id', $post->user_id)->exists();
    }
}
