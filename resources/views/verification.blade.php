@extends('layouts.app')

@section('content')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="{{ asset('css/app.css') }}">

<div class="main-app-container">
    <aside class="sidebar-nav">
        <div class="brand">DocHub</div>
        <a href="/news" class="nav-item"><i class="fa-solid fa-newspaper"></i></a>
        <a href="/profile" class="nav-item"><i class="fa-solid fa-user"></i></a>
        <a href="/friends" class="nav-item"><i class="fa-solid fa-users"></i></a>
        <a href="/messages" class="nav-item"><i class="fa-solid fa-comment"></i></a>
        <a href="/events" class="nav-item"><i class="fa-solid fa-calendar"></i></a>
        <a href="/verification" class="nav-item active"><i class="fa-solid fa-shield"></i></a>
        <div class="settings-icon"><i class="fa-solid fa-gear"></i></div>
    </aside>

    <main class="posts-section">
        <div class="card" style="padding: 24px;">
            <h2 style="margin: 0 0 16px;">Верификация врача</h2>
            <p style="margin: 0 0 20px; color: #6b7280;">
                Для доступа к функциям сайта подтвердите свои данные. Отправьте документы в чат поддержки.
            </p>

            <div class="verification-steps" style="display: grid; gap: 12px;">
                <div class="step-item">
                    <strong>Шаг 1.</strong> Откройте чат поддержки.
                </div>
                <div class="step-item">
                    <strong>Шаг 2.</strong> Отправьте фото документов (ФИО, место работы).
                </div>
                <div class="step-item">
                    <strong>Шаг 3.</strong> Дождитесь проверки статуса администратором.
                </div>
            </div>

            <div style="margin-top: 20px; display: flex; gap: 12px; flex-wrap: wrap;">
                <button id="btnOpenSupport" class="btn-primary">Открыть чат поддержки</button>
                <button id="btnUploadDocs" class="btn-secondary">Отправить документы</button>
            </div>

            <div id="verificationStatus" style="margin-top: 20px; color: #374151;">
                Статус: <strong id="verificationStatusLabel">загрузка...</strong>
            </div>
        </div>
    </main>

    <aside class="info-section">
        <div class="details-card">
            <h3>Подсказка</h3>
            <p style="color: #6b7280;">
                После проверки появится синяя галочка возле профиля и откроется доступ к постам организации.
            </p>
        </div>

        <div id="adminPanel" class="details-card" style="display: none;">
            <h3>Админ панель</h3>
            <p style="color: #6b7280; margin-bottom: 12px;">Заявки на верификацию</p>
            <div id="adminRequestsList">
                <p style="color: #999;">Загрузка заявок...</p>
            </div>
        </div>
    </aside>
</div>

<input type="file" id="verificationFileInput" accept="image/*,application/pdf" style="display:none;">

<script>
    window.userData = @json(auth()->user());
</script>

<script src="{{ asset('js/verification.js') }}"></script>
@endsection
