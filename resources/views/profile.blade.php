@extends('layouts.app')

@section('content')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="{{ asset('css/profile.css') }}">

@php
    $user = auth()->user();
@endphp

<div class="main-app-container">
    <aside class="sidebar-nav">
        <div class="brand">DocHub</div>
        <a href="#" class="nav-item active"><i class="fa-solid fa-user"></i></a>
        <a href="#" class="nav-item"><i class="fa-solid fa-comment"></i></a>
        <a href="#" class="nav-item"><i class="fa-solid fa-users"></i></a>
        <div class="settings-icon"><i class="fa-solid fa-gear"></i></div>
    </aside>

    <main class="posts-section">
        <div id="postsList">
            <p style="text-align: center; color: #8abceb; padding: 20px;">Загрузка ленты...</p>
        </div>
    </main>

    <aside class="info-section">

        <div class="profile-card">
            <div class="card-banner"></div>
            <div class="profile-info-content">
                <div class="avatar-wrapper">
                    <img src="{{ $user->avatar ?? asset('images/default-avatar.png') }}" alt="Avatar">
                </div>
                <span class="username-tag">@ {{ $user->username ?? 'doctor' }}</span>
                <h2 class="display-name">
                    {{ $user->name ?? 'Гость' }}
                    <i class="fa-solid fa-circle-check" style="color: #004080;"></i>
                </h2>
                <p class="user-meta">
                    {{ ($user->sex ?? 'male') == 'woman' ? 'Женщина' : 'Мужчина' }},
                    {{ $user && $user->birth_date ? \Carbon\Carbon::parse($user->birth_date)->age : '25' }} лет
                </p>
                <div class="action-btns">
                    <button class="btn-edit">Редактировать</button>
                    <button class="btn-share"><i class="fa-solid fa-share"></i></button>
                </div>
            </div>
        </div>

        <div class="details-card">
            <h3>Информация</h3>
            <div id="userDataGrid" class="details-grid">
                <p style="color: #999;">Загрузка данных...</p>
            </div>
        </div>

    </aside>
</div>

<script>
    /**
     * Превращаем PHP-объект пользователя со всеми полями (work_place, education, phone_number и др.)
     * в объект JavaScript, чтобы profile.js мог их отобразить.
     */
    window.userData = @json(auth()->user());

    // Для совместимости с твоим старым кодом постов
    window.userName = "{{ $user->name ?? 'Доктор' }}";
</script>

<script src="{{ asset('js/profile.js') }}"></script>

@endsection
