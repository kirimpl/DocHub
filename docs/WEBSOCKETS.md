# Realtime setup (Laravel Reverb)

This project uses Laravel Reverb as the primary realtime backend.

## 1) Required env values

Set values in `.env`:

```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=local
REVERB_APP_KEY=local
REVERB_APP_SECRET=local
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http
```

Frontend values:

```env
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

## 2) Start Reverb

```bash
php artisan reverb:start
```

## 3) Auth for private channels

Private channels are authorized via:

- `POST /broadcasting/auth`

Use a Sanctum bearer token in request headers.

## 4) Channels used in project

- `private-messages.{userId}` (Echo naming: `private('messages.{id}')`)
- `private-App.Models.User.{userId}` (Laravel notifications)

## 5) Troubleshooting

- If subscribe fails, verify bearer token and channel auth route.
- If frontend cannot connect, check `REVERB_HOST/PORT/SCHEME` and matching Vite vars.
- If events are not delivered, verify queue/broadcast config and logs.
