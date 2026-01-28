# API документация (backend)

Базовый URL: `/api`  
Аутентификация: **Bearer token** (Sanctum)

Заголовок:
```
Authorization: Bearer <token>
```

## Важные правила доступа

- После регистрации у пользователя `verification_status = pending`.
- Пока пользователь **не верифицирован**, доступ ограничен: можно смотреть **глобальные** посты и работать с верификацией.
- Доступы ограничивает middleware `verified.doctor`.
- **Системные группы** (организация/отделение) создаются **после одобрения** верификации.
- Из **системных групп** нельзя выйти вручную (`leave` вернёт 403).
- При повторной верификации (например, при смене места работы) членство в системных группах пересобирается по актуальным данным.

### Разрешено до верификации
- `GET /api/feed/global` — глобальная лента.
- `GET /api/posts` — список постов (глобальные).
- `GET /api/posts/{id}` — просмотр поста.
- `GET /api/notifications*` — уведомления.
- `GET/POST /api/verification/*` — верификация.
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

**Body**
```
{ "email": "user@example.com", "password": "password" }
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

**Важно:** `organization_role` **обязателен**.

**Response**
```
{ "token": "...", "user": { ... } }
```

---

## Профиль

### GET /api/me
Текущий пользователь.

### GET /api/profile/{id}
Профиль пользователя.

### POST /api/profile
Обновление профиля (FormData).

**Body (FormData, можно частично)**
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

**Body**
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
Подтверждение врача.  
**Создаются системные группы** по месту работы и отделению.

### POST /api/verification/{id}/reject (admin)
Отклонение врача.

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

- `GET /api/posts` — список постов (глобальные + локальные).
- `POST /api/posts` — создание поста.
- `GET /api/posts/{id}` — один пост.
- `PATCH /api/posts/{id}` — обновить пост.
- `DELETE /api/posts/{id}` — удалить пост.
- `GET /api/my-posts` — только мои посты.

**Body для создания**
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
- `POST /api/friends/requests/{id}/accept` — принять.
- `POST /api/friends/requests/{id}/decline` — отклонить.
- `POST /api/friends/requests/{id}/cancel` — отменить исходящую.
- `DELETE /api/friends/{id}` — удалить друга.

---

## Блокировки

- `GET /api/blocks` — список блокировок.
- `POST /api/blocks` — заблокировать.
- `DELETE /api/blocks/{id}` — разблокировать.

---

## Сообщения (личные)

- `GET /api/messages/inbox` — список диалогов.
- `POST /api/messages/send` — отправить сообщение.
- `GET /api/messages/conversation/{userId}` — диалог.
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
- `POST /api/group-chats/{id}/members` — добавить участников.
- `DELETE /api/group-chats/{id}/members/{memberId}` — удалить участника.
- `POST /api/group-chats/{id}/leave` — выйти (нельзя для системных).
- `DELETE /api/group-chats/{id}` — удалить группу.
- `GET /api/group-chats/{id}/messages` — сообщения в группе.
- `POST /api/group-chats/{id}/messages` — отправить сообщение.
- `POST /api/group-chats/{id}/join` — системное событие join.
- `DELETE /api/group-chats/{id}/messages/{messageId}` — удалить сообщение.
- `POST /api/group-chats/{id}/messages/{messageId}/reactions` — реакции.
- `GET /api/group-chats/{id}/pinned` — закреплённые.
- `POST /api/group-chats/{id}/messages/{messageId}/pin` — закрепить.
- `DELETE /api/group-chats/{id}/messages/{messageId}/pin` — открепить.

**Важно:** из системных групп выйти нельзя.

---

## Лекции (старый модуль)

- `GET /api/lectures` — список.
- `POST /api/lectures` — создать.
- `GET /api/lectures/{id}` — одна лекция.
- `PATCH /api/lectures/{id}` — обновить.
- `POST /api/lectures/{id}/join` — присоединиться.
- `POST /api/lectures/{id}/leave` — выйти.
- `POST /api/lectures/{id}/end` — завершить.
- `POST /api/lectures/{id}/admins` — назначить админов.

---

## События (календарь)

- `GET /api/events` — список событий.
- `GET /api/events/{id}` — одно событие.
- `POST /api/events` — создать.
- `PATCH /api/events/{id}` — обновить.
- `DELETE /api/events/{id}` — удалить.
- `GET /api/events/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` — события по диапазону дат.

### Участники и приглашения
```
POST /api/events/{id}/join             # вступить
POST /api/events/{id}/leave            # выйти
POST /api/events/{id}/invite           # пригласить
POST /api/events/{id}/invites/{inviteId}/accept  # принять
POST /api/events/{id}/invites/{inviteId}/decline # отклонить
GET  /api/events/invites               # мои приглашения
```

---

## Голосовые комнаты (лекции/собрания/созвоны)

- `GET /api/voice-rooms` — список комнат.
- `POST /api/voice-rooms` — создать комнату.
- `GET /api/voice-rooms/{id}` — детали комнаты.
- `PATCH /api/voice-rooms/{id}` — обновить.
- `DELETE /api/voice-rooms/{id}` — удалить.

**Типы:** `lecture | meeting | group_call`  
**Доступ для group_call:** `public | organization | department | invite`  
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
```
{ "text": "..." }
```

### POST /api/ai/lecture/summary
Краткий пересказ лекции по расшифровке.
```
{ "transcript": "..." }
```

### POST /api/ai/key-points
Ключевые пункты текста.
```
{ "text": "...", "count": 5 }
```

### POST /api/ai/lecture/outline
План лекции.
```
{ "text": "..." }
```

### POST /api/ai/lecture/questions
Контрольные вопросы по тексту.
```
{ "text": "...", "count": 5 }
```

---

## Сессии и безопасность

- `POST /api/security/password` — сменить пароль.
- `GET /api/security/sessions` — список активных сессий.
- `POST /api/security/logout-all` — выйти из всех сессий.

