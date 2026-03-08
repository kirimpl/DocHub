# DocHub Backend

Backend-платформа для профессиональной медицинской сети: верификация врачей, лента, личные/групповые чаты, лекции, события, voice rooms, уведомления и AI-инструменты.

## Для портфолио

- Готовый презентационный текст и демо-сценарий: `docs/PORTFOLIO.md`
- Быстрые ссылки: `docs/API.md`, `openapi.yaml`, `tests/Feature`

## Что это за продукт

DocHub решает задачу внутренней коммуникации и обмена знаниями для медсообщества:

- регистрация и профиль врача;
- верификация с документами и встроенной поддержкой;
- публикации, комментарии, лайки, репосты;
- личные и групповые чаты (реакции, закрепы, пересылка);
- лекции/события/голосовые комнаты;
- realtime-уведомления;
- модерация (жалобы, ограничения);
- AI-эндпоинты для работы с текстом и материалами лекций.

## Технологии

- PHP 8.2
- Laravel 12
- Sanctum (API auth)
- Reverb (realtime)
- MySQL 8 / SQLite (тесты)
- Redis (очереди и realtime)
- Vite / npm

## Основные модули

- `app/Http/Controllers/API` — бизнес-логика API
- `routes/api.php` — все API-маршруты
- `app/Models` — доменные модели
- `app/Notifications` / `app/Events` — уведомления и broadcast
- `docs/API.md` — подробные API-заметки
- `openapi.yaml` — OpenAPI-спецификация
- `tests/Feature` — интеграционные тесты

## Быстрый старт (локально)

### 1) Установка

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

### 2) База данных

```bash
php artisan migrate
```

### 3) Запуск приложения

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

### 4) Realtime и очередь (в отдельных терминалах)

```bash
php artisan reverb:start
php artisan queue:work --tries=3 --timeout=120
```

## Запуск через Docker

```bash
docker compose up -d --build
```

После старта контейнеров:

```bash
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate
```

Сервисы в `docker-compose.yml`:

- `web` — Nginx (`http://localhost:8000`)
- `app` — PHP/Laravel
- `db` — MySQL
- `redis` — Redis
- `reverb` — realtime-сервер
- `queue` — воркер очередей

## Тестирование и проверки

```bash
php artisan test
php artisan route:list --path=api --except-vendor
php -l routes/api.php
```

## Документация API

- Человекочитаемая: `docs/API.md`
- OpenAPI: `openapi.yaml`
- Postman: `docs/postman_collection.json`

## Realtime

Проект использует Laravel Reverb.

- Документация по настройке: `docs/WEBSOCKETS.md`
- Приватные каналы: `routes/channels.php`
- Ключевые события: `MessageSent`, `GroupChatMessageSent`, `LectureSignal`, `SupportTicketResolved`

## Переменные окружения (минимум)

Проверьте в `.env`:

- `APP_URL`
- `DB_*`
- `QUEUE_CONNECTION`
- `BROADCAST_CONNECTION=reverb`
- `REVERB_*`
- `GEMINI_API_KEY` (если используете AI)

## Лицензия

MIT
