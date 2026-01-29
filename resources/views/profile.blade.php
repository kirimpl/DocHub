@extends('layouts.app')

@section('content')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="{{ asset('css/profile.css') }}">

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
    <div class="profile-header">
        <div class="profile-cover"></div>

        <div class="profile-avatar">
            <img id="profileAvatar" src="{{ asset('images/default-avatar.png') }}">
        </div>
    </div>

    <div class="profile-body">
        <span class="profile-username" id="profileUsername">@doctor</span>

        <div class="profile-name-row">
            <h2 id="profileName">Гость</h2>
            <i class="fa-solid fa-circle-check verified"></i>
        </div>

        <p class="profile-meta" id="profileSexAge">
            Мужчина, 25 лет
        </p>

        <div class="profile-actions">
            <button class="btn-primary">Редактировать</button>
            <button class="btn-icon">
                <i class="fa-solid fa-share"></i>
            </button>
        </div>
    </div>
</div>


       <div class="details-card">
    <h3 class="card-title">Информация</h3>
    <div class="card-divider"></div>

    <div id="userDataGrid" class="details-grid">
        <p style="color: #999;">Загрузка данных...</p>
    </div>
</div>


    </aside>
</div>



<script src="{{ asset('js/profile.js') }}"></script>

@endsection
