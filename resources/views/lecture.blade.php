@extends('layouts.app')

@section('content')
<main class="lecture-page" data-lecture-id="{{ $lectureId ?? '' }}">
    <div class="lecture-header">
        <div class="lecture-title" id="lectureTitle">Тема лекции</div>
        <div class="lecture-timer" id="lectureTimer">До конца лекции: --:--</div>
    </div>

    <div class="lecture-topbar">
        <button class="lecture-back" id="lectureBackBtn" title="Назад">
            <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div class="lecture-host">
            <img id="lectureHostAvatar" class="lecture-host-avatar" alt="Ведущий">
            <div class="lecture-host-info">
                <div class="lecture-host-label">Ведущий лекции</div>
                <div class="lecture-host-name" id="lectureHostName">—</div>
            </div>
        </div>
        <div class="lecture-people">
            <div class="lecture-people-avatars" id="lecturePeopleAvatars"></div>
            <div class="lecture-people-count" id="lecturePeopleCount">0 участников</div>
        </div>
        <button class="lecture-share" id="lectureShareBtn" title="Поделиться">
            <i class="fa-solid fa-share-nodes"></i>
        </button>
    </div>

    <div class="lecture-alert" id="lectureWarning" hidden>
        До завершения лекции осталось 5 минут.
    </div>

    <div class="lecture-modal" id="lectureStartModal" hidden>
        <div class="lecture-modal-card">
            <h3>Это собрание еще не началось</h3>
            <p>Начало через <span id="lectureStartCountdown">--:--</span></p>
            <button type="button" id="lectureStartDismiss">Выйти</button>
        </div>
    </div>

    <section class="lecture-stage">
        <div class="lecture-main" id="lectureMainTile">
            <div class="lecture-video-shell">
                <video id="lectureMainVideo" autoplay playsinline></video>
                <div class="lecture-nameplate" id="lectureMainLabel"></div>
                <div class="lecture-mic" id="lectureMainMic" hidden>
                    <i class="fa-solid fa-microphone-slash"></i>
                </div>
                <div class="lecture-role" id="lectureMainRole" hidden>
                    <i class="fa-solid fa-crown"></i>
                </div>
            </div>
        </div>

        <div class="lecture-side" id="lectureGrid">
            <div class="lecture-grid" id="lectureGridTiles"></div>
            <button class="lecture-more" id="lectureMoreBtn" hidden>
                <span id="lectureMoreCount">+0</span>
            </button>
        </div>

        <div class="lecture-panel" id="lectureParticipantsPanel" hidden>
            <div class="lecture-panel-header">
                <span>Участники лекции</span>
                <button class="lecture-panel-close" id="lectureParticipantsClose">×</button>
            </div>
            <div class="lecture-panel-list" id="lectureParticipantsList"></div>
        </div>

        <div class="lecture-panel" id="lectureChatPanel" hidden>
            <div class="lecture-panel-header">
                <span>Чат лекции</span>
                <button class="lecture-panel-close" id="lectureChatClose">×</button>
            </div>
            <div class="lecture-chat-messages" id="lectureChatMessages"></div>
            <div class="lecture-chat-input">
                <input type="text" id="lectureChatInput" placeholder="Введите сообщение...">
                <button id="lectureChatSend">Отправить</button>
            </div>
        </div>
    </section>

    <div class="lecture-controls">
        <div class="lecture-controls-inner">
            <div class="lecture-controls-left">
                <button class="lecture-control" id="lectureArchiveBtn" title="Архивировать трансляцию">
                    <i class="fa-solid fa-box-archive"></i>
                </button>
                <button class="lecture-control lecture-control--danger" id="lectureEndBtn" title="Окончить трансляцию">
                    <i class="fa-solid fa-stop"></i>
                </button>
            </div>

            <div class="lecture-controls-center">
                <button class="lecture-control" id="lectureMicBtn" title="Микрофон">
                    <i class="fa-solid fa-microphone"></i>
                </button>
                <button class="lecture-control" id="lectureVideoBtn" title="Видео">
                    <i class="fa-solid fa-video"></i>
                </button>
                <button class="lecture-control" id="lectureChatBtn" title="Чат">
                    <i class="fa-solid fa-comments"></i>
                </button>
                <button class="lecture-control" id="lectureEmojiBtn" title="Эмодзи">
                    <i class="fa-regular fa-face-smile"></i>
                </button>
            </div>

            <div class="lecture-controls-right">
                <button class="lecture-control lecture-control--danger" id="lectureLeaveBtn" title="Выйти">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
                <button class="lecture-control lecture-control--warn" id="lectureReportBtn" title="Пожаловаться на трансляцию">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </button>
            </div>
        </div>
    </div>
</main>
@endsection
