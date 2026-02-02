@extends('layouts.app')

@section('content')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="{{ asset('css/profile.css') }}">

<div class="main-app-container">

    <main class="posts-section">
        <!-- Контейнер для постов -->
        <div id="newsFeed">
            <p style="text-align: center; color: var(--accent); padding: 20px;">Загрузка ленты...</p>
        </div>

        <!-- Шаблон поста -->
        <template id="postTemplate">
            <div class="post-card">
                <div class="post-header"></div>
                <div class="post-text"></div>
                <div class="post-gallery"></div>
                <div class="post-actions">
                    <button class="like-btn">❤️</button> <span class="likes-count">0</span>
                    <button class="comment-btn">💬</button> <span class="comments-count">0</span>
                </div>
                <div class="comments-section">
                    <div class="comments-list"></div>
                    <input type="text" class="comment-input" placeholder="Комментарий...">
                    <button class="send-comment-btn">Отправить</button>
                </div>
            </div>
        </template>
    </main>

    <aside class="info-section">
        <div class="profile-card">
            <div class="profile-header">
                <div class="profile-cover" id="profileCover"
                    style="background-image: url('{{ auth()->check() && auth()->user()->cover_image ? auth()->user()->cover_image . '?t=' . time() : asset('images/default-cover.jpg') }}');">
                    <input type="file" id="coverInput" accept="image/*" hidden>
                    <div class="cover-overlay" id="coverOverlay">Изменить обложку</div>
                </div>

                <div class="profile-avatar">
                    <img id="profileAvatar"
                        src="{{ auth()->check() && auth()->user()->avatar ? auth()->user()->avatar . '?t=' . time() : asset('images/avatar.png') }}">
                    <input type="file" id="avatarInput" accept="image/*" hidden>
                </div>
            </div>

            <div class="profile-body">
                <span class="profile-username" id="profileUsername">@doctor</span>
                <div class="profile-name-row">
                    <h2 id="profileName">Гость</h2>
                    <i class="fa-solid fa-circle-check verified"></i>
                </div>
                <p class="profile-meta" id="profileSexAge">Мужчина, 25 лет</p>

                <div class="profile-actions">
                    <button class="btn-primary">Редактировать</button>
                    <button class="btn-icon"><i class="fa-solid fa-share"></i></button>
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
