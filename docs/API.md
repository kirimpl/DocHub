# API документация (backend)

Базовый URL: `/api`

Аутентификация: **Bearer token** (Sanctum)  
Передавать в заголовке:

```
Authorization: Bearer <token>
```

## Важные правила доступа

- После регистрации пользователь имеет `verification_status = pending`.
- **Пока не верифицирован**, доступ ограничен: можно только смотреть **глобальные** посты и работать с верификацией.
- Доступы ограничиваются middleware `verified.doctor`.

### Разрешено до верификации
- `GET /api/feed/global`
- `GET /api/posts`
- `GET /api/posts/{id}`
- `GET /api/notifications*`
- `GET/POST /api/verification/*`
- `GET /api/me`

---

## Публичные эндпоинты

### POST /api/login
Вход по email/паролю.

**Body**
```
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response**
```
{ "token": "...", "user": { ... } }
```

### POST /api/register
Регистрация врача.

**Body**
```
{
  "name": "Имя",
  "email": "user@example.com",
  "password": "password",
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

**Response**
```
{ "token": "...", "user": { ... } }
```

### GET /api/organizations
Справочник организаций.

### GET /api/departments
Справочник отделений.

---

## Профиль и приватность

### GET /api/me
Текущий пользователь.

### GET /api/profile/{id}
Профиль пользователя.

### POST /api/profile
Обновление профиля.

**Body (FormData, можно частично)**
```
name, last_name, email, status_text,
is_private, avatar (file), cover_image (file),
remove_avatar, remove_cover_image,
speciality, work_experience, work_place,
secondary_work_place, secondary_speciality,
category, position, organization_role, department_role
```

### POST /api/privacy
Обновление настроек приватности.

---

## Верификация врача

### GET /api/verification/status
Статус верификации.

### GET /api/verification/support
Контакт поддержки (глобальный админ).

### GET /api/verification/documents
Список документов пользователя.

### POST /api/verification/documents
Загрузка документа.

**Body (FormData)**
```
document (jpg/png/pdf), notes (optional)
```

### GET /api/verification/pending (admin)
Список пользователей на проверку.

### POST /api/verification/{id}/approve (admin)
Подтверждение врача.

### POST /api/verification/{id}/reject (admin)
Отклонение врача.

---

## Уведомления

### GET /api/notifications
Список уведомлений.

### POST /api/notifications/{id}/read
Пометить прочитанным.

### POST /api/notifications/read-all
Пометить все прочитанными.

### GET /api/notifications/subscribe
Realtime подписка (Echo/Reverb).

---

## Лента

### GET /api/feed
Фильтрация: `scope`, `from`, `to`, `organization`.

**scope**:
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

### GET /api/posts
Список постов (глобальные + свои + локальные).

### POST /api/posts
Создание поста.

**Body**
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
- Глобальный пост → всем по тегу во всех больницах
- Локальный пост → по тегу в своей больнице

### GET /api/posts/{id}
Один пост.

### PATCH /api/posts/{id}
Обновление поста.

### DELETE /api/posts/{id}
Удаление поста.

### GET /api/my-posts
Только мои посты.

---

## Медиа

### POST /api/media
Загрузка файлов (local storage).

---

## Комментарии

### GET /api/posts/{id}/comments
Список комментариев.

### POST /api/posts/{id}/comments
Добавить комментарий.

### DELETE /api/comments/{id}
Удалить комментарий.

### POST /api/comments/{id}/like
Лайк комментария.

---

## Лайки

### POST /api/posts/{id}/like
Лайк поста.

### POST /api/posts/{id}/unlike
Снять лайк.

### GET /api/posts/{id}/likes
Список лайков.

---

## Друзья и заявки

### GET /api/friends
Список друзей.

### POST /api/friends/request
Отправить заявку.

### GET /api/friends/requests
Входящие заявки.

### GET /api/friends/requests/sent
Исходящие заявки.

### POST /api/friends/requests/{id}/accept
Принять.

### POST /api/friends/requests/{id}/decline
Отклонить.

### POST /api/friends/requests/{id}/cancel
Отменить.

### DELETE /api/friends/{id}
Удалить друга.

---

## Блокировки

### GET /api/blocks
Список блокировок.

### POST /api/blocks
Заблокировать.

### DELETE /api/blocks/{id}
Разблокировать.

---

## Сообщения (личные)

### GET /api/messages/inbox
Входящие.

### POST /api/messages/send
Отправка сообщения.

### GET /api/messages/conversation/{userId}
Диалог.

### GET /api/messages/conversation/{userId}/pinned
Закреплённые в диалоге.

### DELETE /api/messages/conversation/{userId}
Удалить диалог.

### DELETE /api/messages/{id}
Удалить сообщение.

### POST /api/messages/{id}/reactions
Реакции.

### POST /api/messages/{id}/pin
Закрепить сообщение.

### DELETE /api/messages/{id}/pin
Открепить.

### GET /api/messages/subscribe
Realtime подписка (Echo/Reverb).

---

## Групповые чаты

### GET /api/group-chats
Список групп.

### POST /api/group-chats
Создать группу.

### GET /api/group-chats/{id}
Инфо о группе.

### PATCH /api/group-chats/{id}
Обновить группу.

### POST /api/group-chats/{id}/members
Добавить участников.

### DELETE /api/group-chats/{id}/members/{memberId}
Удалить участника.

### POST /api/group-chats/{id}/leave
Выйти.

### DELETE /api/group-chats/{id}
Удалить группу.

### GET /api/group-chats/{id}/messages
Сообщения в группе.

### POST /api/group-chats/{id}/messages
Отправить сообщение.

### POST /api/group-chats/{id}/join
Системное событие join.

### DELETE /api/group-chats/{id}/messages/{messageId}
Удалить сообщение.

### POST /api/group-chats/{id}/messages/{messageId}/reactions
Реакции.

### GET /api/group-chats/{id}/pinned
Закреплённые.

### POST /api/group-chats/{id}/messages/{messageId}/pin
Закрепить.

### DELETE /api/group-chats/{id}/messages/{messageId}/pin
Открепить.

---

## Лекции (старый модуль)

### GET /api/lectures
Список.

### POST /api/lectures
Создать.

### GET /api/lectures/{id}
Одна лекция.

### PATCH /api/lectures/{id}
Обновить.

### POST /api/lectures/{id}/join
Присоединиться.

### POST /api/lectures/{id}/leave
Выйти.

### POST /api/lectures/{id}/end
Завершить.

### POST /api/lectures/{id}/admins
Назначить админов.

---

## События (календарь)

### GET /api/events
Список событий.

### GET /api/events/{id}
Одно событие.

### POST /api/events
Создать.

### PATCH /api/events/{id}
Обновить.

### DELETE /api/events/{id}
Удалить.

### GET /api/events/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
Календарь по диапазону дат.

### События: участники и приглашения
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

### GET /api/voice-rooms
### POST /api/voice-rooms
### GET /api/voice-rooms/{id}
### PATCH /api/voice-rooms/{id}
### DELETE /api/voice-rooms/{id}

**Типы**: `lecture | meeting | group_call`  
**Доступ** (для group_call): `public | organization | department | invite`

Для `lecture/meeting` обязательны `department_tags`.

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

### POST /api/ai/improve
Улучшение текста.

**Body**
```
{ "text": "..." }
```

### POST /api/ai/lecture/summary
Краткий пересказ лекции по расшифровке.

**Body**
```
{ "transcript": "..." }
```

### POST /api/ai/key-points
Ключевые пункты текста.

**Body**
```
{ "text": "...", "count": 5 }
```

### POST /api/ai/lecture/outline
План лекции.

**Body**
```
{ "text": "..." }
```

### POST /api/ai/lecture/questions
Контрольные вопросы по тексту.

**Body**
```
{ "text": "...", "count": 5 }
```

---

## Сессии и безопасность

### POST /api/security/password
Сменить пароль.

### GET /api/security/sessions
Список активных сессий.

### POST /api/security/logout-all
Выйти из всех сессий.
