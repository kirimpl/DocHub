<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Post;
use App\Policies\PostPolicy;
use App\Models\Message;
use App\Policies\MessagePolicy;
use App\Policies\CommentPolicy;
use App\Policies\LikePolicy;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Post::class => PostPolicy::class,
        Message::class => MessagePolicy::class,
     
        \App\Models\Comment::class => CommentPolicy::class,
        \App\Models\Like::class => LikePolicy::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
