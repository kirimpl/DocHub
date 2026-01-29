@extends('layouts.app')

@section('content')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="{{ asset('css/app.css') }}">

<main class="posts-section">
    <div class="card" style="padding: 24px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 16px;">Админ панель: заявки на верификацию</h2>
        <div id="adminRequestsList">
            <p style="color:#999;">Загрузка заявок...</p>
        </div>
    </div>

    <div class="card" style="padding: 24px;">
        <h2 style="margin: 0 0 16px;">Поддержка: обращения пользователей</h2>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 16px;">
            <div style="border: 1px solid #eef2f7; border-radius: 12px; padding: 12px; background: #fff;">
                <div style="font-weight: 600; margin-bottom: 8px;">Список обращений</div>
                <div id="supportThreadsList" style="display: grid; gap: 8px; color: #6b7280;">
                    <div>Загрузка...</div>
                </div>
            </div>
            <div style="border: 1px solid #eef2f7; border-radius: 12px; padding: 12px; background: #fff;">
                <div id="supportChatHeader" style="font-weight: 600; margin-bottom: 8px;">Чат</div>
                <div id="supportChatMessages" style="max-height: 320px; overflow-y: auto; display: grid; gap: 10px;"></div>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <input id="supportChatInput" type="text" class="form-input" placeholder="Введите сообщение..." style="flex: 1;">
                    <button id="supportChatSend" class="btn-primary">Отправить</button>
                </div>
            </div>
        </div>
    </div>
</main>

<aside class="info-section"></aside>
</div>

@endsection
