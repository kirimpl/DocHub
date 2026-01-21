<?php

return [
    'apps' => [
        [
            'id' => env('PUSHER_APP_ID', 'local'),
            'name' => env('APP_NAME', 'Laravel'),
            'key' => env('PUSHER_APP_KEY', 'local'),
            'secret' => env('PUSHER_APP_SECRET', 'local'),
            'path' => env('PUSHER_APP_PATH', ''),
            'capacity' => null,
            'enable_client_messages' => false,
            'enable_statistics' => true,
        ],
    ],

    'default_app' => env('PUSHER_APP_ID', 'local'),

    'dashboard' => [
        'port' => env('WEBSOCKETS_DASHBOARD_PORT', 6001),
    ],

    'statistics' => [
        // Optional: set a statistics model if using beyondcode/laravel-websockets package.
        // Keep null here to avoid hard dependency on that package.
        'model' => null,
    ],
];
