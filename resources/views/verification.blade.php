@extends('layouts.app')

@section('content')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="{{ asset('css/app.css') }}">

<main class="posts-section">
    <div class="card" style="padding: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <h2 style="margin: 0;">Верификация врача</h2>
            <button id="btnHelpToggle" class="btn-secondary">Подсказка</button>
        </div>

        <div id="helpPanel" style="display: none; margin-top: 16px; background: #f8fafc; border-radius: 12px; padding: 16px;">
            <p style="margin: 0 0 12px; color: #6b7280;">
                Для доступа к функциям сайта подтвердите свои данные. Отправьте документы в чат поддержки.
            </p>
            <div style="display: grid; gap: 8px;">
                <div><strong>Шаг 1.</strong> Откройте чат поддержки ниже.</div>
                <div><strong>Шаг 2.</strong> Отправьте фото документов (ФИО, место работы).</div>
                <div><strong>Шаг 3.</strong> Дождитесь проверки статуса администратором.</div>
            </div>
        </div>

        <div style="margin-top: 18px; display: flex; gap: 12px; flex-wrap: wrap;">
            <button id="btnUploadDocs" class="btn-secondary">Отправить документы</button>
        </div>

        <div id="verificationStatus" style="margin-top: 16px; color: #374151;">
            Статус: <strong id="verificationStatusLabel">загрузка...</strong>
        </div>

        <div style="margin-top: 20px;">
            <h3 style="margin: 0 0 12px;">Чат поддержки</h3>
            <div id="supportChatBox" style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #ffffff;">
                <div id="supportChatMessages" style="max-height: 280px; overflow-y: auto; display: grid; gap: 10px;"></div>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <input id="supportChatInput" type="text" class="form-input" placeholder="Введите сообщение..." style="flex: 1;">
                    <button id="btnSupportSend" class="btn-primary">Отправить</button>
                </div>
                <div style="margin-top: 10px; color: #6b7280; font-size: 12px;">
                    Документы отправляйте через кнопку «Отправить документы».
                </div>
            </div>
        </div>

        <div style="margin-top: 20px;">
            <h3 style="margin: 0 0 10px;">Отправленные документы</h3>
            <div id="verificationDocsList" style="display: grid; gap: 8px; color: #6b7280;"></div>
        </div>
    </div>
</main>

<aside class="info-section"></aside>
</div>

<input type="file" id="verificationFileInput" accept="image/*,application/pdf" style="display:none;">
@endsection
