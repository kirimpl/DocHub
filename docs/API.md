# API документация (backend)

Базовый URL: `/api`  
Аутентификация: **Bearer token** (Sanctum)

Заголовок:
```
Authorization: Bearer <token>
```

## Важные правила доступа
- После регистрации у пользователя `verification_status = pending`.
- Пока пользователь **не верифицирован**, доступ ограничен: можно смотреть **глобальные** посты и работать с верификацией/поддержкой.
- Доступы ограничивает middleware `verified.doctor`.
- **Системные группы** (организация/отделение) создаются **после одобрения** верификации.
- При повторной верификации (например, смена места работы) членство в системных группах пересобирается по актуальным данным.

**Важно:** из системных групп выйти нельзя (`leave` вернёт 403).

### Разрешено до верификации
- `GET /api/feed/global` — глобальная лента.
- `GET /api/posts` — список глобальных постов.
- `GET /api/posts/{id}` — просмотр поста.
- `GET /api/notifications*` — уведомления.
- `GET/POST /api/verification/*` — верификация/поддержка.
- `GET /api/me` — профиль текущего пользователя.

---

## Публичные справочники (для регистрации)
- `GET /api/directory/cities` — города.
- `GET /api/directory/educations` — образование/ВУЗы.
- `GET /api/directory/departments` — специальности/отделения.
- `GET /api/directory/organizations` — организации.
- `GET /api/directory/work-places?city=Название` — места работы по городу.
- `GET /api/directory/positions` — должности.
- `GET /api/directory/categories` — категории.

---

## Аутентификация
### POST /api/login
Вход по email/паролю.
```
{ "email": "user@example.com", "password": "password" }
```
Ответ:
```
{ "token": "...", "user": { ... } }
```

### POST /api/register
Регистрация врача.
```
{
  "name": "Имя",
  "last_name": "Фамилия",
  "email": "user@example.com",
  "password": "password",
  "sex": "male|female",
  "birth_date": "YYYY-MM-DD",
  "phone_number": "+77001234567",
  "education": "Название ВУЗа",
  "city": "Город",
  "speciality": "Хирургия",
  "work_experience": 10,
  "work_place": "Городская больница №1",
  "secondary_work_place": "Клиника N",
  "secondary_speciality": "Хирургия",
  "category": "Высшая",
  "position": "Врач",
  "organization_role": "staff|chief|deputy",
  "department_role": "staff|head"
}
```
**Важно:** `organization_role` обязателен.

---

## Профиль
- `GET /api/me` — текущий пользователь.
- `GET /api/profile/{id}` — профиль пользователя.
- `POST /api/profile` — обновление профиля (FormData, частично).

**FormData поля:**
```
name, last_name, email, phone_number, status_text, bio,
is_private, avatar (file), cover_image (file),
remove_avatar, remove_cover_image,
speciality, work_experience, work_place, education, city,
secondary_work_place, secondary_speciality,
category, position, organization_role, department_role
```

### POST /api/profile/{id}/share
Поделиться профилем в ЛС или групповой чат.
```
{
  "target_type": "user|group",
  "target_id": 123,
  "body": "Комментарий (опционально)"
}
```

---

## Верификация врача
### GET /api/verification/status
Статус верификации.

### GET /api/verification/support
Контакт поддержки (глобальный админ).

### GET /api/verification/documents
Список документов пользователя.

### POST /api/verification/documents
Загрузка документа (FormData).
```
document (jpg/png/pdf), notes (optional)
```

### GET /api/verification/pending (admin)
Список пользователей на проверке.

### POST /api/verification/{id}/approve (admin)
Подтверждение врача. Создаются системные группы.

### POST /api/verification/{id}/reject (admin)
Отклонение врача.

---

## Поддержка / CRM (обращения)
### Пользователь
- `GET /api/verification/support/tickets?status=open|resolved` — мои обращения.
- `GET /api/verification/support/messages?ticket_id=ID` — сообщения по обращению.
- `POST /api/verification/support/messages` — отправить сообщение.
```
{ "body": "Текст", "ticket_id": 123 }
```
**Важно:** если `ticket_id` не передан — создаётся новое обращение (open).

### Админ
- `GET /api/verification/support/threads?status=open|resolved` — список обращений.
- `GET /api/verification/support/threads/{ticketId}` — сообщения обращения.
- `POST /api/verification/support/threads/{ticketId}` — ответить.
```
{ "body": "Ответ" }
```
- `POST /api/verification/support/threads/{ticketId}/resolve` — пометить решённым.
- `DELETE /api/verification/support/threads/{ticketId}` — удалить **решённое** обращение и историю.

---

## Уведомления
- `GET /api/notifications` — список уведомлений.
- `POST /api/notifications/{id}/read` — отметить прочитанным.
- `POST /api/notifications/read-all` — прочитать все.
- `GET /api/notifications/subscribe` — realtime подписка (Echo/Reverb).

---

## Лента
### GET /api/feed
Фильтры: `scope`, `from`, `to`, `organization`.

**scope:**
- `global` — только глобальные
- `organization` / `local` — только по своей организации
- `mine` — только мои
- `all` — все доступные

Примеры:
- `/api/feed?scope=global`
- `/api/feed?scope=local&from=2026-01-01&to=2026-01-31`

### GET /api/feed/global
Только глобальные.

### GET /api/feed/organization
Только по организации пользователя.

---

## Посты
- `GET /api/posts` — список постов.
- `POST /api/posts` — создание поста.
- `GET /api/posts/{id}` — один пост.
- `PATCH /api/posts/{id}` — обновить пост.
- `DELETE /api/posts/{id}` — удалить пост.
- `GET /api/my-posts` — только мои посты.

**Body для создания:**
```
{
  "content": "Текст",
  "image": null,
  "is_global": true|false,
  "is_public": true|false,
  "department_tags": ["Хирургия", "Терапия"]
}
```

**Уведомления по тегам:**
- глобальный пост → всем по тегу во всех больницах
- локальный пост → по тегу в своей больнице

### POST /api/posts/{id}/share
Поделиться постом в ЛС или групповой чат.
```
{
  "target_type": "user|group",
  "target_id": 123,
  "body": "Комментарий (опционально)"
}
```

---

## Медиа
- `POST /api/media` — загрузка файлов (local storage).

---

## Комментарии
- `GET /api/posts/{id}/comments` — список комментариев.
- `POST /api/posts/{id}/comments` — добавить комментарий.
- `DELETE /api/comments/{id}` — удалить комментарий.
- `POST /api/comments/{id}/like` — лайк комментария.

---

## Лайки
- `POST /api/posts/{id}/like` — лайк поста.
- `POST /api/posts/{id}/unlike` — снять лайк.
- `GET /api/posts/{id}/likes` — список лайков.

---

## Друзья и заявки
- `GET /api/friends` — список друзей.
- `POST /api/friends/request` — отправить заявку.
- `GET /api/friends/requests` — входящие заявки.
- `GET /api/friends/requests/sent` — исходящие заявки.
- `POST /api/friends/requests/{id}/accept` — принять заявку.
- `POST /api/friends/requests/{id}/decline` — отклонить заявку.
- `POST /api/friends/requests/{id}/cancel` — отменить исходящую.
- `DELETE /api/friends/{id}` — удалить друга.

---

## Блокировки
- `GET /api/blocks` — список блокировок.
- `POST /api/blocks` — заблокировать пользователя.
- `DELETE /api/blocks/{id}` — разблокировать.

---

## Сообщения (личные)
- `GET /api/messages/inbox` — список диалогов.
- `POST /api/messages/send` — отправить сообщение.
- `GET /api/messages/conversation/{userId}` — сообщения диалога.
- `GET /api/messages/conversation/{userId}/pinned` — закреплённые.
- `DELETE /api/messages/conversation/{userId}` — удалить диалог.
- `DELETE /api/messages/{id}` — удалить сообщение.
- `POST /api/messages/{id}/reactions` — реакции.
- `POST /api/messages/{id}/pin` — закрепить.
- `DELETE /api/messages/{id}/pin` — открепить.
- `GET /api/messages/subscribe` — realtime подписка.

---

## Групповые чаты
- `GET /api/group-chats` — список групп.
- `POST /api/group-chats` — создать группу.
- `GET /api/group-chats/{id}` — информация о группе.
- `PATCH /api/group-chats/{id}` — обновить группу.
- `POST /api/group-chats/{id}/members` — добавить участника.
- `DELETE /api/group-chats/{id}/members/{memberId}` — удалить участника.
- `POST /api/group-chats/{id}/leave` — выйти (нельзя для системных).
- `DELETE /api/group-chats/{id}` — удалить группу.
- `GET /api/group-chats/{id}/messages` — сообщения группы.
- `POST /api/group-chats/{id}/messages` — отправить сообщение.
- `POST /api/group-chats/{id}/join` — системное join.
- `DELETE /api/group-chats/{id}/messages/{messageId}` — удалить сообщение.
- `POST /api/group-chats/{id}/messages/{messageId}/reactions` — реакции.
- `GET /api/group-chats/{id}/pinned` — закреплённые.
- `POST /api/group-chats/{id}/messages/{messageId}/pin` — закрепить.
- `DELETE /api/group-chats/{id}/messages/{messageId}/pin` — открепить.

---

## Лекции (старый модуль)
- `GET /api/lectures` — список лекций.
- `POST /api/lectures` — создать лекцию.
- `GET /api/lectures/{id}` — одна лекция.
- `PATCH /api/lectures/{id}` — обновить лекцию.
- `POST /api/lectures/{id}/join` — присоединиться.
- `POST /api/lectures/{id}/leave` — выйти.
- `POST /api/lectures/{id}/end` — завершить.
- `POST /api/lectures/{id}/admins` — назначить админов.

---

## События (календарь)
- `GET /api/events` — список событий.
- `GET /api/events/{id}` — одно событие.
- `POST /api/events` — создать событие.
- `PATCH /api/events/{id}` — обновить событие.
- `DELETE /api/events/{id}` — удалить событие.
- `GET /api/events/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` — события по диапазону дат.

### Участники и приглашения
```
POST /api/events/{id}/join
POST /api/events/{id}/leave
POST /api/events/{id}/invite
POST /api/events/{id}/invites/{inviteId}/accept
POST /api/events/{id}/invites/{inviteId}/decline
GET  /api/events/invites
```

---

## Голосовые комнаты (лекции/собрания/созвоны)
- `GET /api/voice-rooms` — список комнат.
- `POST /api/voice-rooms` — создать комнату.
- `GET /api/voice-rooms/{id}` — детали комнаты.
- `PATCH /api/voice-rooms/{id}` — обновить комнату.
- `DELETE /api/voice-rooms/{id}` — удалить комнату.

**Типы:** `lecture | meeting | group_call`  
**Доступ для group_call:** `public | organization | department | invite`  
**Важно:** для `lecture/meeting` обязательны `department_tags`.

### Действия
```
POST /api/voice-rooms/{id}/join
POST /api/voice-rooms/{id}/leave
POST /api/voice-rooms/{id}/invite
POST /api/voice-rooms/{id}/invites/{inviteId}/accept
POST /api/voice-rooms/{id}/invites/{inviteId}/decline
GET  /api/voice-rooms/invites
```

**Уведомления:**
- lecture: notify_scope = global|local
- meeting: всегда local
- group_call: уведомления не отправляются

---

## Поиск
### GET /api/search
Поиск пользователей (имя/фамилия).

---

## AI (Gemini)
- `POST /api/ai/improve` — улучшение текста.
- `POST /api/ai/lecture/summary` — краткий пересказ по расшифровке.
- `POST /api/ai/key-points` — ключевые пункты текста.
- `POST /api/ai/lecture/outline` — план лекции.
- `POST /api/ai/lecture/questions` — контрольные вопросы.

---

## Сессии и безопасность
- `POST /api/security/password` — сменить пароль.
- `GET /api/security/sessions` — активные сессии.
- `POST /api/security/logout-all` — выйти из всех сессий.

---

## WebSocket / Reverb (Realtime)
**Авторизация канала:**  
`POST /broadcasting/auth` (Bearer token обязателен)

**Каналы:**
- `private-messages.{userId}` *(Pusher protocol; в Echo это `private('messages.{id}')`)*
- `private-App.Models.User.{userId}` *(Laravel Notifications)*

**События:**
- `MessageSent` — новое сообщение (ЛС + поддержка).
- `SupportTicketResolved` — обращение решено (только пользователю).
- `notification` — стандартные уведомления Laravel.

**Payload MessageSent:**
```
{
  "message": {
    "id": 1,
    "sender_id": 10,
    "recipient_id": 20,
    "support_ticket_id": 55,
    "body": "..."
  },
  "sender": { "id": 10, "name": "..." }
}
```

**Payload SupportTicketResolved:**
```
{ "user_id": 20, "ticket_id": 55, "cleared_at": "2026-01-29 21:14:00" }
```

### Пример подписки (Echo/Reverb)
```js
const userId = window.currentUserId;

// Сообщения (ЛС + поддержка)
window.Echo.private(`messages.${userId}`)
  .listen('.MessageSent', (e) => {
    console.log('MessageSent', e.message);
  })
  .listen('.SupportTicketResolved', (e) => {
    console.log('SupportTicketResolved', e);
  });

// Уведомления (Laravel Notifications)
window.Echo.private(`App.Models.User.${userId}`)
  .notification((notification) => {
    console.log('Notification', notification);
  });
```
