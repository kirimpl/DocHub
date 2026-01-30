@extends('layouts.app')

@section('content')
    <main class="main">

        <aside class="column-left">
            <div class="profile_card" id="profile_card">
                <div class="profile-header">
                    <img src="" alt="Avatar" class="avatar-img" id="profile-avatar">
                    <div class="profile-info">
                        <h3 class="profile-name" id="profile-name">Lorem Ips.</h3>
                        <p class="profile-role" id="profile-role">Терапевт</p>
                    </div>
                </div>
                <div class="profile-details">
                    <div class="detail-item">
                        <div class="detail-icon">
                            <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M20 16H22V18H0V16H2V1C2 0.734784 2.10536 0.48043 2.29289 0.292893C2.48043 0.105357 2.73478 0 3 0H13C13.2652 0 13.5196 0.105357 13.7071 0.292893C13.8946 0.48043 14 0.734784 14 1V16H16V6H19C19.2652 6 19.5196 6.10536 19.7071 6.29289C19.8946 6.48043 20 6.73478 20 7V16ZM6 8V10H10V8H6ZM6 4V6H10V4H6Z"
                                    fill="#0056A6" />
                            </svg>
                        </div>
                        <div class="detail-text"><span class="label">Организация:</span> КГП на ПХВ «Городская поликлиника
                            №3»</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-icon">
                            <svg width="16" height="21" viewBox="0 0 16 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M16 0H0V2L5.81 6.36C4.04674 6.94143 2.58648 8.19917 1.75016 9.8568C0.913849 11.5144 0.769916 13.4363 1.35 15.2C1.63699 16.0737 2.09342 16.8822 2.69318 17.5794C3.29294 18.2765 4.02426 18.8486 4.84531 19.2628C5.66635 19.677 6.56101 19.9253 7.47811 19.9935C8.39521 20.0616 9.31674 19.9483 10.19 19.66C11.5905 19.1997 12.8099 18.309 13.6744 17.1149C14.5388 15.9207 15.0043 14.4842 15.0043 13.01C15.0043 11.5358 14.5388 10.0993 13.6744 8.90514C12.8099 7.71103 11.5905 6.82031 10.19 6.36L16 2V0ZM10.94 17.5L8 15.78L5.06 17.5L5.84 14.17L3.25 11.93L6.66 11.64L8 8.5L9.34 11.64L12.75 11.93L10.16 14.17L10.94 17.5Z"
                                    fill="#0056A6" />
                            </svg>
                        </div>
                        <div class="detail-text"><span class="label">Стаж работы:</span> 20 лет</div>
                    </div>
                </div>
                <button class="btn-profile">Перейти на профиль</button>
            </div>

            <nav class="card nav-menu" id="menu">
                <a href="#" class="nav-item active">
                    <span class="nav-icon"><svg width="18" height="20" viewBox="0 0 18 20" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd"
                                d="M0 1.8C0 1.32261 0.189642 0.864773 0.527208 0.527208C0.864773 0.189642 1.32261 0 1.8 0H12.6C13.0774 0 13.5352 0.189642 13.8728 0.527208C14.2104 0.864773 14.4 1.32261 14.4 1.8V15.9C14.4 16.7752 14.7477 17.6146 15.3665 18.2335C15.9854 18.8523 16.8248 19.2 17.7 19.2H3.3C2.42479 19.2 1.58542 18.8523 0.966548 18.2335C0.347678 17.6146 0 16.7752 0 15.9V1.8ZM4.5 10.2C4.2613 10.2 4.03239 10.2948 3.8636 10.4636C3.69482 10.6324 3.6 10.8613 3.6 11.1C3.6 11.3387 3.69482 11.5676 3.8636 11.7364C4.03239 11.9052 4.2613 12 4.5 12H9.9C10.1387 12 10.3676 11.9052 10.5364 11.7364C10.7052 11.5676 10.8 11.3387 10.8 11.1C10.8 10.8613 10.7052 10.6324 10.5364 10.4636C10.3676 10.2948 10.1387 10.2 9.9 10.2H4.5ZM4.5 13.8C4.2613 13.8 4.03239 13.8948 3.8636 14.0636C3.69482 14.2324 3.6 14.4613 3.6 14.7C3.6 14.9387 3.69482 15.1676 3.8636 15.3364C4.03239 15.5052 4.2613 15.6 4.5 15.6H9.9C10.1387 15.6 10.3676 15.5052 10.5364 15.3364C10.7052 15.1676 10.8 14.9387 10.8 14.7C10.8 14.4613 10.7052 14.2324 10.5364 14.0636C10.3676 13.8948 10.1387 13.8 9.9 13.8H4.5ZM3.6 4.5C3.6 4.2613 3.69482 4.03239 3.8636 3.8636C4.03239 3.69482 4.2613 3.6 4.5 3.6H9.9C10.1387 3.6 10.3676 3.69482 10.5364 3.8636C10.7052 4.03239 10.8 4.2613 10.8 4.5V7.5C10.8 7.73869 10.7052 7.96761 10.5364 8.1364C10.3676 8.30518 10.1387 8.4 9.9 8.4H4.5C4.2613 8.4 4.03239 8.30518 3.8636 8.1364C3.69482 7.96761 3.6 7.73869 3.6 7.5V4.5Z"
                                fill="#0056A6" />
                        </svg></span>
                    <span class="nav-text">Новости</span>
                </a>
                <a href="profile" class="nav-item">
                    <span class="nav-icon"><svg width="19" height="18" viewBox="0 0 19 18" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd"
                                d="M0 17V16.315C0 15.63 0.498 14.832 1.114 14.531L6.774 11.769C7.595 11.369 7.786 10.481 7.194 9.779L6.832 9.35C6.096 8.478 5.5 6.85 5.5 5.71V4C5.5 2.93913 5.92143 1.92172 6.67157 1.17157C7.42172 0.421427 8.43913 0 9.5 0C10.5609 0 11.5783 0.421427 12.3284 1.17157C13.0786 1.92172 13.5 2.93913 13.5 4V5.71C13.5 6.85 12.9 8.483 12.168 9.352L11.807 9.78C11.217 10.479 11.401 11.368 12.226 11.77L17.886 14.532C18.501 14.832 19 15.625 19 16.315V17C19 17.2652 18.8946 17.5196 18.7071 17.7071C18.5196 17.8946 18.2652 18 18 18H1C0.734784 18 0.48043 17.8946 0.292893 17.7071C0.105357 17.5196 0 17.2652 0 17Z"
                                fill="#75ABDF" />
                        </svg></span>
                    <span class="nav-text">Профиль</span>
                </a>
                <a href="#" class="nav-item">
                    <span class="nav-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M7.125 12C8.98896 12 10.5 10.489 10.5 8.625C10.5 6.76104 8.98896 5.25 7.125 5.25C5.26104 5.25 3.75 6.76104 3.75 8.625C3.75 10.489 5.26104 12 7.125 12Z"
                                fill="#75ABDF" />
                            <path
                                d="M10.9688 13.875C9.64875 13.2047 8.19187 12.9375 7.125 12.9375C5.03531 12.9375 0.75 14.2191 0.75 16.7812V18.75H7.78125V17.9967C7.78125 17.1061 8.15625 16.2131 8.8125 15.4688C9.33609 14.8744 10.0692 14.3227 10.9688 13.875Z"
                                fill="#75ABDF" />
                            <path
                                d="M15.9375 13.5C13.4967 13.5 8.625 15.0075 8.625 18V20.25H23.25V18C23.25 15.0075 18.3783 13.5 15.9375 13.5Z"
                                fill="#75ABDF" />
                            <path
                                d="M15.9375 12C18.2157 12 20.0625 10.1532 20.0625 7.875C20.0625 5.59683 18.2157 3.75 15.9375 3.75C13.6593 3.75 11.8125 5.59683 11.8125 7.875C11.8125 10.1532 13.6593 12 15.9375 12Z"
                                fill="#75ABDF" />
                        </svg></span>
                    <span class="nav-text">Коллеги</span>
                </a>
                <a href="messenger" class="nav-item">
                    <span class="nav-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M4 18H6V22.081L11.101 18H16C17.103 18 18 17.103 18 16V8C18 6.897 17.103 6 16 6H4C2.897 6 2 6.897 2 8V16C2 17.103 2.897 18 4 18Z"
                                fill="#75ABDF" />
                            <path
                                d="M20 2H8C6.897 2 6 2.897 6 4H18C19.103 4 20 4.897 20 6V14C21.103 14 22 13.103 22 12V4C22 2.897 21.103 2 20 2Z"
                                fill="#75ABDF" />
                        </svg></span>
                    <span class="nav-text">Сообщения</span>
                </a>
                <a href="#" class="nav-item">
                    <span class="nav-icon"><svg width="14" height="19" viewBox="0 0 14 19" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M7 0C7.79565 0 8.55871 0.316071 9.12132 0.87868C9.68393 1.44129 10 2.20435 10 3V9C10 9.79565 9.68393 10.5587 9.12132 11.1213C8.55871 11.6839 7.79565 12 7 12C6.20435 12 5.44129 11.6839 4.87868 11.1213C4.31607 10.5587 4 9.79565 4 9V3C4 2.20435 4.31607 1.44129 4.87868 0.87868C5.44129 0.316071 6.20435 0 7 0ZM14 9C14 12.53 11.39 15.44 8 15.93V19H6V15.93C2.61 15.44 0 12.53 0 9H2C2 10.3261 2.52678 11.5979 3.46447 12.5355C4.40215 13.4732 5.67392 14 7 14C8.32608 14 9.59785 13.4732 10.5364 12.5355C11.4732 11.5979 12 10.3261 12 9H14Z"
                                fill="#75ABDF" />
                        </svg></span>
                    <span class="nav-text">Собрания</span>
                </a>
                <a href="#" class="nav-item">
                    <span class="nav-icon"><svg width="18" height="20" viewBox="0 0 18 20" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M16 2H13V0H11V2H7V0H5V2H2C0.897 2 0 2.897 0 4V18C0 19.103 0.897 20 2 20H16C17.103 20 18 19.103 18 18V4C18 2.897 17.103 2 16 2ZM9 12H4V10H9V12ZM14 8H4V6H14V8Z"
                                fill="#75ABDF" />
                        </svg></span>
                    <span class="nav-text">Записки</span>
                </a>
                <a href="/verification/admin" class="nav-item" id="adminPanelLink" style="display: none;">
                    <span class="nav-icon"><i class="fa-solid fa-shield"></i></span>
                    <span class="nav-text">Админ панель</span>
                </a>
            </nav>
        </aside>

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
                        <div class="archive-box">+ 24 000</div>
                        <span class="archive-text">Архив лекций</span>
                    </div>
                </div>
            </div>

            <div class="create-post-card">
                <div class="cp-header">
                    <h2 class="cp-title">Создать пост</h2>

                    <div class="cp-tabs">
                        <div class="cp-tab active" data-type="org" onclick="setPostType(this, 'org')">От организации</div>
                        <div class="cp-divider"></div>
                        <div class="cp-tab" data-type="dept" onclick="setPostType(this, 'dept')">От отделения</div>
                        <div class="cp-divider"></div>
                        <div class="cp-tab" data-type="self" onclick="setPostType(this, 'self')">От себя</div>
                    </div>
                </div>

                <div class="cp-body">
                    <div class="cp-input-wrapper">
                        <button class="cp-icon-btn emoji-btn"><svg width="26" height="26" viewBox="0 0 26 26" fill="none"
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

                    <div class="cp-actions">
                        <input type="file" id="hiddenFileInput" style="display: none;" onchange="handleFileSelect(this)">

                        <button class="cp-icon-btn clip-btn" onclick="document.getElementById('hiddenFileInput').click()">
                            <svg width="19" height="22" viewBox="0 0 19 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd"
                                    d="M12.4055 14.5936L12.4204 14.5786L17.0404 9.95863C17.5822 9.41693 18.0119 8.77383 18.305 8.06606C18.5982 7.3583 18.7491 6.59971 18.7491 5.83363C18.7491 5.06755 18.5982 4.30897 18.305 3.6012C18.0119 2.89343 17.5822 2.25033 17.0404 1.70863C16.4987 1.16693 15.8557 0.737226 15.1479 0.444059C14.4401 0.150891 13.6815 0 12.9154 0C11.3683 0 9.88447 0.614613 8.79045 1.70863L4.84545 5.65363L4.83045 5.66863L2.32995 8.16763C0.838108 9.65947 0 11.6828 0 13.7926C0 15.9024 0.838108 17.9258 2.32995 19.4176C3.82179 20.9095 5.84517 21.7476 7.95495 21.7476C10.0647 21.7476 12.0881 20.9095 13.58 19.4176L18.3304 14.6686C18.4378 14.5648 18.5235 14.4406 18.5824 14.3033C18.6413 14.1661 18.6722 14.0184 18.6735 13.869C18.6747 13.7197 18.6462 13.5715 18.5895 13.4333C18.5329 13.2951 18.4493 13.1695 18.3436 13.0639C18.238 12.9584 18.1123 12.8749 17.974 12.8184C17.8357 12.7619 17.6876 12.7335 17.5382 12.7349C17.3888 12.7362 17.2412 12.7673 17.104 12.8263C16.9668 12.8854 16.8427 12.9711 16.739 13.0786L11.99 17.8276C10.92 18.8976 9.46884 19.4987 7.9557 19.4987C6.44256 19.4987 4.9914 18.8976 3.92145 17.8276C2.8515 16.7577 2.25041 15.3065 2.25041 13.7934C2.25041 12.2802 2.8515 10.8291 3.92145 9.75913L5.74545 7.93513L5.76195 7.92013L10.3819 3.29863C11.0592 2.65268 11.9623 2.29719 12.8981 2.30813C13.834 2.31907 14.7285 2.69555 15.3905 3.35716C16.0525 4.01876 16.4295 4.91302 16.441 5.84887C16.4525 6.78473 16.0975 7.68797 15.4519 8.36563L13.757 10.0606L13.739 10.0786L9.24645 14.5696C9.11256 14.7133 8.9511 14.8286 8.7717 14.9085C8.5923 14.9884 8.39864 15.0314 8.20227 15.0349C8.0059 15.0383 7.81084 15.0022 7.62874 14.9287C7.44663 14.8551 7.2812 14.7456 7.14233 14.6068C7.00345 14.4679 6.89397 14.3025 6.82041 14.1203C6.74686 13.9382 6.71073 13.7432 6.7142 13.5468C6.71766 13.3504 6.76064 13.1568 6.84058 12.9774C6.92051 12.798 7.03576 12.6365 7.17945 12.5026L11.6704 8.00863C11.8692 7.79537 11.9774 7.5133 11.9722 7.22185C11.9671 6.93039 11.849 6.65232 11.6429 6.4462C11.4368 6.24008 11.1587 6.12201 10.8672 6.11687C10.5758 6.11173 10.2937 6.21991 10.0805 6.41863L5.58795 10.9096C4.90334 11.6082 4.52207 12.5488 4.52701 13.5269C4.53195 14.505 4.9227 15.4416 5.61433 16.1332C6.30597 16.8249 7.24261 17.2156 8.22072 17.2206C9.19882 17.2255 10.1394 16.8442 10.838 16.1596L12.4055 14.5936Z"
                                    fill="#0056A6" />
                            </svg>
                            <span id="file-indicator" class="file-status"></span>
                        </button>

                        <button class="cp-send-btn" onclick="handlePublish()">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M17.7896 0.0744177C18.8056 -0.280582 19.7816 0.695418 19.4266 1.71142L13.5016 18.6414C13.1166 19.7394 11.5866 19.8014 11.1146 18.7384L8.25561 12.3064L12.2796 8.28142C12.4121 8.13924 12.4842 7.9512 12.4808 7.7569C12.4774 7.5626 12.3986 7.37721 12.2612 7.2398C12.1238 7.10238 11.9384 7.02367 11.7441 7.02024C11.5498 7.01681 11.3618 7.08894 11.2196 7.22142L7.19461 11.2454L0.762611 8.38642C-0.300389 7.91342 -0.23739 6.38442 0.859611 5.99942L17.7896 0.0744177Z"
                                    fill="#0056A6" />
                            </svg>

                        </button>
                    </div>
                </div>
            </div>

            <div id="feed-container" class="feed"></div>

            <div class="feed-filters">
                <button class="filter-tab active" data-filter="all">Все</button>
                <button class="filter-tab" data-filter="organization">Моя организация</button>
                <button class="filter-tab" data-filter="department">Отделение</button>
            </div>

            <div id="newsFeed"></div>

        </div>

        <aside class="column-right">
            <div class="card calendar-card" id="calendar">
                <div class="calendar-header-nav">
                    <button id="prevBtn" class="nav-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round" />
                        </svg>
                    </button>
                    <h3 id="monthYearLabel" class="calendar-title">Январь 2026</h3>
                    <button id="nextBtn" class="nav-arrow">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M0 5.85223C0 10.7152 4.02 13.3062 6.962 15.6262C8 16.4442 9 17.2152 10 17.2152C11 17.2152 12 16.4452 13.038 15.6252C15.981 13.3072 20 10.7152 20 5.85323C20 0.991225 14.5 -2.45977 10 2.21623C5.5 -2.45977 0 0.989226 0 5.85223Z"
                            fill="currentColor" />
                    </svg>
                    <span class="likes-count">0</span>
                </button>

                <button class="action-btn comment-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <button class="send-comment-btn"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
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