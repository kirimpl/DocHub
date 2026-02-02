<?php

namespace App\Observers;

use App\Models\Post;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PostObserver
{
   public function created(Post $post)
{
    try {
        $user = $post->user;
        $relativeContext = str_replace('/storage/', '', $post->image);
        $path = storage_path('app/public/' . $relativeContext);

        $request = \Illuminate\Support\Facades\Http::withoutVerifying()->timeout(30);


        if ($post->image && file_exists($path)) {
            $request->attach(
                'image',
                file_get_contents($path),
                basename($path)
            );
        }


        $request->post('https://dema2000.app.n8n.cloud/webhook/mywork', [
            'author' => $user->username ?? $user->name ?? 'unknown',
            'organization' => $user->work_place ?? '—',
            'content' => $post->content,
            'tags' => is_array($post->department_tags) ? implode(', ', $post->department_tags) : '',
            'post_id' => $post->id,
        ]);

    } catch (\Throwable $e) {
        \Log::error('n8n error: ' . $e->getMessage());
    }
}
}
