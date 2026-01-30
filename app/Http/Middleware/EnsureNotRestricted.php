<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotRestricted
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        $method = strtoupper($request->method());
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        if ($user->isRestricted()) {
            return response()->json([
                'message' => 'Your account is temporarily restricted.',
                'restricted_until' => optional($user->restricted_until)->toISOString(),
            ], 403);
        }

        return $next($request);
    }
}
