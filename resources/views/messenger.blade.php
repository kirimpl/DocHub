@extends('layouts.app')

@section('content')
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <link rel="stylesheet" href="{{ asset('css/messenger.css') }}">
    <script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/laravel-echo@1.16.1/dist/echo.iife.js"></script>
    <script>
        window.Pusher = Pusher;
        window.REVERB_CONFIG = {
            key: "{{ env('VITE_REVERB_APP_KEY') }}",
            hhost: "{{ env('VITE_REVERB_HOST') }}" || window.location.hostname,
            port: {{ env('VITE_REVERB_PORT', 8080) }},
            scheme: "{{ env('VITE_REVERB_SCHEME', 'http') }}"
        };
    </script>
    <div class="messenger-container">

        <aside class="messenger-sidebar">

            <div class="card group-section">
                <h3 class="section-title">Группы</h3>
                <div class="list-container scrollable" id="groupsListContainer">
                </div>
                <button class="btn-create" id="btnCreateGroup">Создать группу</button>
            </div>

            <div class="card message-section">
                <h3 class="section-title">Сообщения</h3>
                <div class="list-container scrollable" id="chatsListContainer">
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
                    <div class="header-left">
                        <div class="avatar-sq" id="chatHeaderAvatar" style="border-radius: 50%;">AA</div>
                        <div class="header-info">
                            <h3 class="name-with-icon">
                                <span id="chatHeaderName">Имя</span>
                                <i class="fa-solid fa-chevron-down"
                                    style="font-size: 12px; margin-left: 8px; color: #0056B3; cursor: pointer;"></i>
                            </h3>
                            <span id="chatHeaderStatus" class="status-text">В сети</span>
                        </div>
                    </div>

                    <div class="header-controls">
                        <button class="icon-btn" title="Аудиозвонок"><i class="fa-solid fa-phone"></i></button>
                        <button class="icon-btn" title="Видеозвонок"><i class="fa-solid fa-video"></i></button>

                        <div class="relative-container" style="position: relative;">
                            <button class="icon-btn" id="chatMenuBtn" title="Меню чата">
                                <i class="fa-solid fa-ellipsis"></i>
                            </button>

                            <div class="chat-dropdown hidden" id="chatDropdown">
                                <div class="dropdown-item" id="menuSearchBtn">
                                    <i class="fa-solid fa-magnifying-glass"></i> Поиск
                                </div>
                                <div class="dropdown-item" id="menuClearBtn">
                                    <i class="fa-solid fa-eraser"></i> Очистить чат (Local)
                                </div>
                                <div class="dropdown-item danger" id="menuDeleteBtn">
                                    <i class="fa-solid fa-trash"></i> Удалить чат
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="pinnedMessageBar" class="pinned-bar hidden">
                    <div class="pinned-content" id="pinnedContentClick">
                        <div class="pinned-line"></div>
                        <div class="pinned-info">
                            <span class="pinned-label">Закрепленное сообщение</span>
                            <span id="pinnedText" class="pinned-text">Текст сообщения...</span>
                        </div>
                    </div>
                    <button id="unpinBtn" class="pinned-close" title="Открепить"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <div id="searchBar" class="chat-search-bar hidden">
                    <i class="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" id="searchInput" placeholder="Поиск по переписке...">
                    <i class="fa-solid fa-xmark close-icon" id="closeSearchBtn" title="Закрыть поиск"></i>
                </div>

                <div class="chat-messages">
                </div>

                <div class="chat-input-area">

                    <div id="replyPanel" class="reply-panel hidden">
                        <div class="reply-content">
                            <i class="fa-solid fa-reply reply-icon"></i>
                            <div class="reply-info">
                                <span class="reply-label">Ответ на сообщение</span>
                                <span id="replyTextPreview" class="reply-text">Текст сообщения...</span>
                            </div>
                        </div>
                        <button id="closeReplyBtn" class="close-reply"><i class="fa-solid fa-xmark"></i></button>
                    </div>

                    <div class="input-capsule">
                        <input type="file" id="hiddenFileInput" style="display: none;"
                            accept="image/*, .pdf, .doc, .docx, .txt, audio/*">

                        <button class="icon-btn attach-btn" id="attachBtn" title="Прикрепить файл">
                            <i class="fa-solid fa-paperclip"></i>
                        </button>

                        <input type="text" id="messageInput" placeholder="Сообщение..." autocomplete="off">

                        <button class="icon-btn emoji-btn" id="emojiBtn" title="Смайлики">
                            <i class="fa-regular fa-face-smile"></i>
                        </button>
                    </div>

                    <button class="aux-btn" id="micBtn" title="Голосовое сообщение">
                        <i class="fa-solid fa-microphone"></i>
                    </button>

                    <button class="aux-btn send-btn hidden" id="sendBtn" title="Отправить">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>

                    <div class="emoji-wrapper hidden" id="emojiWrapper">
                        <emoji-picker></emoji-picker>
                    </div>

                </div>

                <script type="module" src="https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js"></script>
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
                    </select>
                    <select id="filterDept">
                        <option value="">Все отделения</option>
                    </select>
                    <select id="filterRole">
                        <option value="">Все должности</option>
                    </select>
                </div>
                <div class="contacts-list" id="contactsList"></div>
            </div>
        </div>
    </div>

    <div id="createGroupModal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Новая группа</h3>
                <span class="close-modal" id="closeGroupModal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="modal-search">
                    <label style="display:block; margin-bottom:5px; color:#75ABDF; font-size:12px;">Название</label>
                    <input type="text" id="groupNameInput" placeholder="Например: Врачи ГКБ №1"
                        style="box-sizing: border-box;">
                </div>
                <div class="modal-search">
                    <label style="display:block; margin-bottom:5px; color:#75ABDF; font-size:12px;">Описание</label>
                    <input type="text" id="groupDescInput" placeholder="Цель группы..." style="box-sizing: border-box;">
                </div>
                <button class="btn-primary" id="submitCreateGroup"
                    style="width:100%; background:#0056B3; color:white; border:none; margin-top:10px;">
                    Создать
                </button>
            </div>
        </div>
    </div>

    <div id="msgContextMenu" class="ctx-menu hidden">
        <ul class="ctx-list">
            <li id="ctxReply"><i class="fa-solid fa-reply"></i> Ответить</li>
            <li id="ctxCopy"><i class="fa-regular fa-copy"></i> Копировать</li>
            <li id="ctxPin"><i class="fa-solid fa-thumbtack"></i> Закрепить</li>
            <li id="ctxForward"><i class="fa-solid fa-share"></i> Переслать</li>
            <hr>
            <li id="ctxDelete" class="ctx-danger"><i class="fa-solid fa-trash"></i> Удалить</li>
        </ul>
    </div>

    <div id="forwardModal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Переслать сообщение</h3>
                <span class="close-modal" id="closeForwardModal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="modal-search">
                    <input type="text" id="forwardSearch" placeholder="Поиск чата...">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </div>
                <div class="contacts-list" id="forwardList">
                </div>
            </div>
        </div>
    </div>

    <script src="{{ asset('js/mess.js') }}"></script>
@endsection