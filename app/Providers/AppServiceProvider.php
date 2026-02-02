<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Post;
use App\Observers\PostObserver;

class AppServiceProvider extends ServiceProvider
{

    public function register(): void
    {
    }


    public function boot(): void
    {
        Post::observe(PostObserver::class);
    }
}
