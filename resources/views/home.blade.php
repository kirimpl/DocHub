@extends('layouts.app')

@section('content')
    <main class="main">

        <div class="column-center">

            <div class="card lectures-card" id="lesson">
                <div class="lectures-header">
                    <div class="lectures-title-group">
                        <h3>Присоединитесь к лекциям</h3>
                        <p>Проводимые в данный момент лекции</p>
                    </div>
                    <button class="btn-more">⌄</button>
                </div>
                <div class="lectures-list">
                    <div class="lecture-item">
                        <div class="lecture-img" style="background-image: url('images/zoom.png');"></div>
                        <span>Кардиология</span>
                    </div>
                    <div class="lecture-item">
                        <div class="lecture-img" style="background-image: url('images/zoom2.png');"></div>
                        <span>Неврология</span>
                    </div>
                    <div class="lecture-item">
                        <div class="lecture-img" style="background-image: url('images/zoom3.png');"></div>
                        <span>Терапия</span>
                    </div>
                    <div class="lecture-item archive-item">
                        <a href="lecture-archives" class="archive-link">
                            <div class="archive-box">+ 24 000</div>
                            <span class="archive-text">Архив лекций</span>
                        </a>
                    </div>
                </div>
                <div class="lecture-actions">
                    <button class="create-meeting-btn" id="createMeetingBtn" type="button">Создать собрание</button>
                </div>
            </div>

            <div class="create-post-card">
                <div class="cp-header">
                    <h2 class="cp-title">Создать пост</h2>

                    <div class="cp-tabs">
                        <div class="cp-tab active" data-type="org" onclick="setPostType(this, 'org')">От организации
                        </div>
                        <div class="cp-divider"></div>
                        <div class="cp-tab" data-type="dept" onclick="setPostType(this, 'dept')">От отделения</div>
                        <div class="cp-divider"></div>
                        <div class="cp-tab" data-type="self" onclick="setPostType(this, 'self')">От себя</div>
                    </div>
                </div>

                <div class="cp-body">

                    <div class="cp-input-wrapper">
                        <button class="cp-icon-btn emoji-btn">
                            <svg width="26" height="26" viewBox="0 0 26 26" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M13 25C19.6274 25 25 19.6274 25 13C25 6.37258 19.6274 1 13 1C6.37258 1 1 6.37258 1 13C1 19.6274 6.37258 25 13 25Z"
                                    stroke="#0056A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                <path
                                    d="M8.2002 15.4001C8.2002 15.4001 10.0002 17.8001 13.0002 17.8001C16.0002 17.8001 17.8002 15.4001 17.8002 15.4001M9.4002 9.40015H9.4122M16.6002 9.40015H16.6122"
                                    stroke="#0056A6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </button>
                        <input type="text" id="postText" class="cp-input">
                    </div>

                    <div style="position: relative;">
                        <input type="file" id="hiddenFileInput" style="display: none;" onchange="handleFileSelect(this)">
                        <button class="cp-icon-btn clip-btn" onclick="document.getElementById('hiddenFileInput').click()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path
                                    d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48">
                                </path>
                            </svg>
                        </button>
                        <div id="file-indicator" class="file-status"></div>
                    </div>

                    <button class="cp-send-btn" onclick="handlePublish()">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M17.7896 0.0744177C18.8056 -0.280582 19.7816 0.695418 19.4266 1.71142L13.5016 18.6414C13.1166 19.7394 11.5866 19.8014 11.1146 18.7384L8.25561 12.3064L12.2796 8.28142C12.4121 8.13924 12.4842 7.9512 12.4808 7.7569C12.4774 7.5626 12.3986 7.37721 12.2612 7.2398C12.1238 7.10238 11.9384 7.02367 11.7441 7.02024C11.5498 7.01681 11.3618 7.08894 11.2196 7.22142L7.19461 11.2454L0.762611 8.38642C-0.300389 7.91342 -0.23739 6.38442 0.859611 5.99942L17.7896 0.0744177Z"
                                fill="#0056A6" />
                        </svg>
                    </button>

                </div>
            </div>

            <div id="feed-container" class="feed"></div>

            <div class="feed-filters">
                <button class="filter-tab active" data-filter="all">Все посты</button>
                <div class="filter-divider"></div>
                <button class="filter-tab" data-filter="mine">От себя</button>
                <div class="filter-divider"></div>
                <button class="filter-tab" data-filter="department">От отделения</button>
                <div class="filter-divider"></div>
                <button class="filter-tab" data-filter="organization">От организации</button>
                <div class="filter-divider"></div>
                <button class="filter-tab" data-filter="global">Глобальные</button>
            </div>


            <div id="newsFeed"></div>

        </div>

        <aside class="column-right">
            <div class="card calendar-card" id="calendar">
                <div class="calendar-header-nav">
                    <button id="prevBtn" class="nav-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </button>
                    <h3 id="monthYearLabel" class="calendar-title">Январь 2026</h3>
                    <button id="nextBtn" class="nav-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </button>
                </div>
                <div class="calendar-wrapper">
                    <div class="weekdays-row">
                        <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
                    </div>
                    <div class="days-grid" id="daysGrid"></div>
                </div>
            </div>

            <div class="card messages-widget" id="messages">
                <div class="widget-header">
                    <h3 class="widget-title">Сообщения</h3>
                    <button class="icon-btn-edit"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M9.401 16.1607L16.797 8.76472C15.5528 8.24494 14.4227 7.48592 13.471 6.53072C12.5153 5.57877 11.756 4.44837 11.236 3.20372L3.84 10.5997C3.263 11.1767 2.974 11.4657 2.726 11.7837C2.43339 12.1592 2.18226 12.5652 1.977 12.9947C1.804 13.3587 1.675 13.7467 1.417 14.5207L0.0549955 18.6037C-0.00769076 18.7907 -0.0169912 18.9914 0.0281393 19.1833C0.0732699 19.3753 0.171042 19.5508 0.310467 19.6903C0.449892 19.8297 0.625441 19.9274 0.817383 19.9726C1.00932 20.0177 1.21005 20.0084 1.397 19.9457L5.48 18.5837C6.255 18.3257 6.642 18.1967 7.006 18.0237C7.43733 17.8184 7.841 17.5687 8.217 17.2747C8.535 17.0267 8.824 16.7377 9.401 16.1607ZM18.849 6.71272C19.5864 5.97529 20.0007 4.97511 20.0007 3.93222C20.0007 2.88933 19.5864 1.88916 18.849 1.15172C18.1116 0.414286 17.1114 7.77013e-09 16.0685 0C15.0256 -7.77013e-09 14.0254 0.414286 13.288 1.15172L12.401 2.03872L12.439 2.14972C12.876 3.4005 13.5913 4.53571 14.531 5.46972C15.4929 6.43754 16.6679 7.16696 17.962 7.59972L18.849 6.71272Z"
                                fill="#0056A6" />
                        </svg></button>
                </div>
                <div class="message-list">

                    <div class="message-item">
                        <div class="msg-avatar"></div>
                        <div class="msg-info">
                            <span class="msg-name">Lorem ips.</span>
                            <p class="msg-preview">Lorem ipsum!</p>
                        </div>
                    </div>

                    <div class="message-item">
                        <div class="msg-avatar"></div>
                        <div class="msg-info">
                            <span class="msg-name">Lorem ips.</span>
                            <p class="msg-preview">Lorem ipsum!</p>
                        </div>
                    </div>

                    <div class="message-item">
                        <div class="msg-avatar"></div>
                        <div class="msg-info">
                            <span class="msg-name">Lorem ips.</span>
                            <p class="msg-preview">Lorem ipsum!</p>
                        </div>
                    </div>

                    <div class="message-item">
                        <div class="msg-avatar"></div>
                        <div class="msg-info">
                            <span class="msg-name">Lorem ips.</span>
                            <p class="msg-preview">Lorem ipsum!</p>
                        </div>
                    </div>

                    <div class="message-item">
                        <div class="msg-avatar"></div>
                        <div class="msg-info">
                            <span class="msg-name">Lorem ips.</span>
                            <p class="msg-preview">Lorem ipsum!</p>
                        </div>
                    </div>

                </div>
            </div>
        </aside>

    </main>

    <div id="eventModal" class="modal-overlay">
        <div class="modal-window">
            <div class="modal-header">
                <h3 id="modalDateTitle">Добавить событие</h3>
                <button class="close-modal-btn" id="closeAddBtn">&times;</button>
            </div>
            <div class="modal-body">
                <p class="modal-date-label">Что планируется?</p>
                <input type="text" id="eventInput" class="modal-input" placeholder="Например: Дежурство">
                <div class="modal-actions">
                    <button id="cancelBtn" class="btn-secondary">Отмена</button>
                    <button id="saveEventBtn" class="btn-primary">Сохранить</button>
                </div>
            </div>
        </div>
    </div>

    <div id="viewEventModal" class="modal-overlay">
        <div class="modal-window">
            <div class="modal-header">
                <h3 id="viewDateTitle">События</h3> <button class="close-modal-btn" id="closeViewXBtn">&times;</button>
            </div>
            <div class="modal-body">
                <div id="eventsListWrapper" class="events-list-container">
                </div>

                <div class="modal-actions">
                    <button id="closeViewBtn" class="btn-secondary">Закрыть</button>
                    <button id="addMoreBtn" class="btn-primary">Добавить еще</button>
                </div>
            </div>
        </div>
    </div>

    <div id="meetingModal" class="modal-overlay">
        <div class="modal-window">
            <div class="modal-header">
                <h3>Создать собрание</h3>
                <button class="close-modal-btn" id="closeMeetingBtn">&times;</button>
            </div>
            <div class="modal-body">
                <p class="modal-date-label">Тема собрания</p>
                <input type="text" id="meetingTitle" class="modal-input"
                    placeholder="Например: Обсуждение отделения">

                <p class="modal-date-label">Описание</p>
                <textarea id="meetingDescription" class="modal-input modal-textarea" rows="3" placeholder="Краткое описание"></textarea>

                <div class="meeting-dates">
                    <div>
                        <p class="modal-date-label">Начало</p>
                        <input type="datetime-local" id="meetingStartsAt" class="modal-input">
                    </div>
                    <div>
                        <p class="modal-date-label">Окончание</p>
                        <input type="datetime-local" id="meetingEndsAt" class="modal-input">
                    </div>
                </div>

                <div id="meetingAdminFields" class="meeting-admin-fields">
                    <p class="modal-date-label">Организация</p>
                    <select id="meetingOrgSelect" class="modal-input"></select>

                    <p class="modal-date-label">Отделение</p>
                    <select id="meetingDeptSelect" class="modal-input"></select>
                </div>

                <div class="modal-actions">
                    <button id="cancelMeetingBtn" class="btn-secondary">Отмена</button>
                    <button id="saveMeetingBtn" class="btn-primary">Создать</button>
                </div>
            </div>
        </div>
    </div>

    <template id="postTemplate">
        <div class="card post-card">
            <div class="post-header">
                <h3 class="post-author"></h3>
                <span class="post-date"></span>
            </div>
            <div class="post-content">
                <p class="post-text"></p>
                <div class="post-gallery"></div>
            </div>

            <div class="post-actions">
                <button class="action-btn like-btn">
                    <svg width="20" height="18" viewBox="0 0 20 18" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M0 5.85223C0 10.7152 4.02 13.3062 6.962 15.6262C8 16.4442 9 17.2152 10 17.2152C11 17.2152 12 16.4452 13.038 15.6252C15.981 13.3072 20 10.7152 20 5.85323C20 0.991225 14.5 -2.45977 10 2.21623C5.5 -2.45977 0 0.989226 0 5.85223Z"
                            fill="currentColor" />
                    </svg>
                    <span class="likes-count">0</span>
                </button>

                <button class="action-btn comment-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M4 18H6V22.081L11.101 18H16C17.103 18 18 17.103 18 16V8C18 6.897 17.103 6 16 6H4C2.897 6 2 6.897 2 8V16C2 17.103 2.897 18 4 18Z"
                            fill="currentColor" />
                        <path
                            d="M20 2H8C6.897 2 6 2.897 6 4H18C19.103 4 20 4.897 20 6V14C21.103 14 22 13.103 22 12V4C22 2.897 21.103 2 20 2Z"
                            fill="currentColor" />
                    </svg>
                    <span class="comments-count">0</span>
                </button>
            </div>

            <div class="comments-section" style="display: none;">
                <div class="comments-list"></div>
                <div class="comment-input-wrapper">
                    <input type="text" placeholder="Напишите комментарий..." class="comment-input">
                    <button class="send-comment-btn"><svg width="20" height="20" viewBox="0 0 20 20"
                            fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M17.7896 0.0744177C18.8056 -0.280582 19.7816 0.695418 19.4266 1.71142L13.5016 18.6414C13.1166 19.7394 11.5866 19.8014 11.1146 18.7384L8.25561 12.3064L12.2796 8.28142C12.4121 8.13924 12.4842 7.9512 12.4808 7.7569C12.4774 7.5626 12.3986 7.37721 12.2612 7.2398C12.1238 7.10238 11.9384 7.02367 11.7441 7.02024C11.5498 7.01681 11.3618 7.08894 11.2196 7.22142L7.19461 11.2454L0.762611 8.38642C-0.300389 7.91342 -0.23739 6.38442 0.859611 5.99942L17.7896 0.0744177Z"
                                fill="#0056A6" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </template>
@endsection
