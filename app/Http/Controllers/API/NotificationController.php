<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
   
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = $user->unreadNotifications()->orderBy('created_at', 'desc')->get();

        $unreadCount = cache()->remember("notifications:unread_count:user:{$user->id}", 10, function () use ($user) {
            return $user->unreadNotifications()->count();
        });

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    
    public function markRead(Request $request, $id)
    {
        $user = $request->user();
        $notif = $user->notifications()->where('id', $id)->firstOrFail();
        $notif->markAsRead();
        cache()->forget("notifications:unread_count:user:{$user->id}");
        return response()->json(['message' => 'Marked read']);
    }

    
    public function markAllRead(Request $request)
    {
        $user = $request->user();
        $user->unreadNotifications->markAsRead();
        cache()->forget("notifications:unread_count:user:{$user->id}");
        return response()->json(['message' => 'All marked read']);
    }

    public function subscribe(Request $request)
    {
        $user = $request->user();
        $since = $request->query('since');
        $sinceTime = $since ? date('Y-m-d H:i:s', strtotime($since)) : now()->subMinutes(10)->toDateTimeString();

        $timeout = 25;
        $interval = 1;
        $started = time();

        while ((time() - $started) < $timeout) {
            $notifications = $user->unreadNotifications()
                ->where('created_at', '>', $sinceTime)
                ->orderBy('created_at', 'asc')
                ->get();

            if ($notifications->isNotEmpty()) {
                cache()->forget("notifications:unread_count:user:{$user->id}");
                return response()->json([
                    'notifications' => $notifications,
                ]);
            }

            sleep($interval);
        }

        return response()->json(['notifications' => []]);
    }
}
