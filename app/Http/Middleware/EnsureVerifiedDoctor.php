<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureVerifiedDoctor
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        if ($user->verification_status === 'verified') {
            return $next($request);
        }

        $method = $request->method();

        if ($request->is('api/feed/global') && $method === 'GET') {
            return $next($request);
        }
        if ($request->is('api/posts') && $method === 'GET') {
            return $next($request);
        }
        if ($request->is('api/posts/*') && $method === 'GET') {
            return $next($request);
        }
        if ($request->is('api/notifications*')) {
            return $next($request);
        }
        if ($request->is('api/verification/*')) {
            return $next($request);
        }
        if ($request->is('api/me') && $method === 'GET') {
            return $next($request);
        }

        return response()->json([
            'message' => 'Требуется верификация. Подтвердите данные в поддержке.',
        ], 403);
    }
}
