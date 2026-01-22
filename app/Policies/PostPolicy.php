<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;
use App\Models\UserBlock;

class PostPolicy
{
    private function isBlocked(User $user, Post $post): bool
    {
        return UserBlock::where('blocker_id', $user->id)->where('blocked_id', $post->user_id)->exists()
            || UserBlock::where('blocker_id', $post->user_id)->where('blocked_id', $user->id)->exists();
    }

    public function view(?User $user, Post $post)
    {
        if (!$user) {
            return false;
        }

        if ($this->isBlocked($user, $post)) {
            return false;
        }

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

    public function create(User $user, Post $post)
    {
        if ($this->isBlocked($user, $post)) {
            return false;
        }

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

    public function update(User $user, Post $post)
    {
        if ($this->isBlocked($user, $post)) {
            return false;
        }
        return $user->id === $post->user_id;
    }

    public function delete(User $user, Post $post)
    {
        if ($this->isBlocked($user, $post)) {
            return false;
        }
        return $user->id === $post->user_id;
    }

    public function viewLikes(User $user, Post $post)
    {
        if ($this->isBlocked($user, $post)) {
            return false;
        }
        return $user->id === $post->user_id;
    }

    public function like(User $user, Post $post)
    {
        return $this->view($user, $post);
    }
}
