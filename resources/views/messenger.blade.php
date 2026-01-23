@extends('layouts.app')

@section('content')
    <link rel="stylesheet" href="{{ asset('css/messenger.css') }}">
    
    <div class="messenger-container">

        <aside class="messenger-sidebar">

            <div class="card group-section">
                <h3 class="section-title">Группы</h3>
                <div class="list-container">
                    <div class="list-item">
                        <div class="avatar-sq">Вр</div>
                        <div class="item-info">
                            <span class="name">Врачи</span>
                            <span class="desc">Обсуждение кейсов</span>
                        </div>
                    </div>
                </div>
                <button class="btn-create">Создать группу</button>
            </div>

            <div class="card message-section">
                <h3 class="section-title">Сообщения</h3>
                <div class="list-container scrollable" id="chatsListContainer">
                    <div class="list-item">
                        <div class="avatar-sq">ИИ</div>
                        <div class="item-info">
                            <span class="name">Иван Иванов</span>
                            <span class="desc">Привет, как дела?</span>
                        </div>
                        <div class="item-meta">
                            <span class="time">19:00</span>
                        </div>
                    </div>
                </div>
                <button class="btn-create trigger-modal">
                    <i class="fa-solid fa-plus"></i> Создать чат
                </button>
            </div>
        </aside>

        <main class="messenger-chat-area">

            <div id="emptyState" class="chat-empty-state">
                <div class="empty-content">
                    <h2>Выберите диалог...</h2>
                    <p>или начните новое общение</p>
                    <button class="btn-primary trigger-modal">Создать новый чат</button>
                </div>
            </div>

            <div id="chatView" class="chat-window hidden">
                <div class="chat-header">
                    <div class="avatar-sq" id="chatHeaderAvatar" style="border-radius: 50%;">AA</div>
                    <div class="header-info">
                        <h3 id="chatHeaderName">Имя</h3>
                        <span id="chatHeaderRole">Должность</span>
                    </div>
                </div>

                <div class="chat-messages">
                    <div class="message-bubble received">
                        Здравствуйте! Вы уже посмотрели отчет?
                    </div>
                    <div class="message-bubble sent">
                        Добрый день. Да, прямо сейчас изучаю результаты.
                    </div>
                </div>

                <div class="chat-input-area">
                    <input type="text" placeholder="Напишите сообщение...">
                    <button><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </div>
        </main>

    </div>

    <div id="createChatModal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Новый чат</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="modal-search">
                    <input type="text" id="contactSearch" placeholder="Поиск сотрудника...">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </div>
                <div class="filters-grid">
                    <select id="filterHospital">
                        <option value="">Все больницы</option>
                        <option value="ГКБ №1">ГКБ №1</option>
                    </select>
                    <select id="filterDept">
                        <option value="">Все отделения</option>
                        <option value="Хирургия">Хирургия</option>
                    </select>
                    <select id="filterRole">
                        <option value="">Все должности</option>
                        <option value="Врач">Врач</option>
                    </select>
                </div>
                <div class="contacts-list" id="contactsList"></div>
            </div>
        </div>
    </div>

    <script src="{{ asset('js/mess.js') }}"></script>
@endsection
