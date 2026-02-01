@extends('layouts.app')

@section('content')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="{{ asset('css/app.css') }}">

<main class="posts-section admin-panel">
    <div class="card admin-card" style="padding: 24px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 16px;">Создать лекцию</h2>
        <div style="display:grid; gap:12px; max-width:520px;">
            <input id="lectureCreateTitle" class="form-input" type="text" placeholder="Тема лекции">
            <textarea id="lectureCreateDescription" class="form-input" rows="3" placeholder="Описание (необязательно)"></textarea>
            <label style="font-size:13px; color:#6b7280;">Начало</label>
            <input id="lectureCreateStarts" class="form-input" type="datetime-local">
            <label style="font-size:13px; color:#6b7280;">Окончание</label>
            <input id="lectureCreateEnds" class="form-input" type="datetime-local">
            <button id="lectureCreateBtn" class="btn-primary" style="width:180px;">Создать</button>
            <div id="lectureCreateNote" style="color:#6b7280; font-size:12px;"></div>
        </div>
    </div>
    <div class="card admin-card" style="padding: 24px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 16px;">AI запросы</h2>
        <div style="display:grid; gap:12px; max-width:720px;">
            <select id="aiRequestType" class="form-input">
                <option value="improve">Улучшение текста</option>
                <option value="lecture_summary">Краткое содержание лекции</option>
                <option value="key_points">Ключевые пункты</option>
                <option value="lecture_outline">План лекции</option>
                <option value="lecture_questions">Вопросы по лекции</option>
            </select>
            <div id="aiLectureWrap" style="display:none; gap:6px;">
                <label style="font-size:13px; color:#6b7280;">Лекция из архива</label>
                <select id="aiRequestLecture" class="form-input">
                    <option value="">Выберите лекцию</option>
                </select>
                <div style="font-size:12px; color:#9ca3af;">Ответ строится по описанию лекции.</div>
            </div>
            <textarea id="aiRequestText" class="form-input" rows="5" placeholder="Текст или расшифровка лекции"></textarea>
            <input id="aiRequestCount" class="form-input" type="number" min="1" max="10" placeholder="Количество (опционально)">
            <button id="aiRequestSend" class="btn-primary" style="width:180px;">Отправить</button>
            <div id="aiRequestResult" style="color:#6b7280; font-size:12px;"></div>
        </div>
        <div style="margin-top: 16px;">
            <div style="font-weight: 600; margin-bottom: 8px;">История запросов</div>
            <div id="aiRequestsList" style="display:grid; gap: 10px; color: #6b7280;">
                <div>Загрузка...</div>
            </div>
        </div>
    </div>
    <div class="card admin-card" style="padding: 24px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 16px;">Админ панель: заявки на верификацию</h2>
        <div id="adminRequestsList">
            <p style="color:#999;">Загрузка заявок...</p>
        </div>
    </div>

    <div class="card admin-card" style="padding: 24px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 16px;">Одобренные заявки</h2>
        <div id="verificationApprovedList">
            <p style="color:#999;">Загрузка...</p>
        </div>
    </div>

    <div class="card admin-card admin-support" style="padding: 24px;">
        <h2 style="margin: 0 0 16px;">Поддержка: обращения пользователей</h2>
        <div class="admin-support-grid">
            <div class="admin-subcard">
                <div style="font-weight: 600; margin-bottom: 8px;">Открытые обращения</div>
                <div id="supportThreadsList" style="display: grid; gap: 8px; color: #6b7280;">
                    <div>Загрузка...</div>
                </div>
                <div style="font-weight: 600; margin: 16px 0 8px;">Решенные обращения</div>
                <div id="supportResolvedList" style="display: grid; gap: 8px; color: #6b7280;">
                    <div>Загрузка...</div>
                </div>
            </div>
            <div class="admin-subcard">
                <div id="supportChatHeader" style="font-weight: 600; margin-bottom: 8px;">Чат</div>
                <div id="supportChatMessages" style="max-height: 320px; overflow-y: auto; display: grid; gap: 10px;"></div>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <input id="supportChatInput" type="text" class="form-input" placeholder="Введите сообщение..." style="flex: 1;">
                    <button id="supportChatSend" class="btn-primary">Отправить</button>
                </div>
            </div>
        </div>
    </div>
    <div class="card admin-card" style="padding: 24px; margin-top: 20px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 16px;">Жалобы на пользователей</h2>
        <div id="userReportsList">
            <p style="color:#999;">Загрузка...</p>
        </div>
    </div>

    <div class="card admin-card" style="padding: 24px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 16px;">Жалобы на трансляции</h2>
        <div id="lectureReportsList">
            <p style="color:#999;">Загрузка...</p>
        </div>
    </div>
</main>

<aside class="info-section"></aside>
</div>

@endsection
