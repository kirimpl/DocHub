laravel-websockets — Local setup (quick)

Goal: run a local WebSocket server (no admin rights required) to support real-time features (messages, notifications) using the Pusher-compatible API.

1) Install packages (one time):

   composer require beyondcode/laravel-websockets pusher/pusher-php-server

2) Publish config and migration (optional for dashboard):

   php artisan vendor:publish --provider="BeyondCode\\LaravelWebSockets\\WebSocketsServiceProvider" --tag="config"
   php artisan vendor:publish --provider="BeyondCode\\LaravelWebSockets\\WebSocketsServiceProvider" --tag="migrations"
   php artisan migrate

3) .env settings (example):

   BROADCAST_DRIVER=pusher
   PUSHER_APP_ID=local
   PUSHER_APP_KEY=local
   PUSHER_APP_SECRET=local
   PUSHER_APP_CLUSTER=mt1
   PUSHER_HOST=127.0.0.1
   PUSHER_PORT=6001
   PUSHER_SCHEME=http
   PUSHER_APP_USE_TLS=false

4) Run websocket server locally (no admin rights needed):

   php artisan websockets:serve --host=127.0.0.1 --port=6001

   The command runs in foreground; you can run it in background using your OS job runner (nohup / screen / PowerShell Start-Job) or use a process manager (Supervisor/Systemd) for production.

5) Frontend: the test client (`public/test-client.html`) includes Pusher + Laravel Echo from CDN and will attempt to connect to the local server if a token is present and you are authenticated.

6) Notes:
 - For production you may keep the Pusher API but use the websockets server for dev/self-hosting.
 - Ensure your `routes/channels.php` includes appropriate authorization callbacks (the project already uses `messages.{id}` and `App.Models.User.{id}`).
 - No admin rights are required to run `php artisan websockets:serve` locally.

Troubleshooting:
 - If Echo can't authenticate, check that `Authorization: Bearer <token>` is provided to the broadcast auth endpoint (`/broadcasting/auth`).
 - If CORS issues arise when serving websockets on a different host, set PUSHER_HOST to the correct host and ensure HTTP broadcast auth endpoint accepts Authorization headers.
