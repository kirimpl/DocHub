<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DocHub</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    @if (request()->is('lecture/*'))
        <link rel="stylesheet" href="{{ asset('css/lecture.css') }}">
    @endif
    @if (request()->is('lecture-archives'))
        <link rel="stylesheet" href="{{ asset('css/lecture-archives.css') }}">
    @endif
    @if (request()->is('notes'))
        <link rel="stylesheet" href="{{ asset('css/notes.css') }}">
    @endif
    @if (request()->is('meetings'))
        <link rel="stylesheet" href="{{ asset('css/meetings.css') }}">
    @endif
    @if (request()->is('search'))
        <link rel="stylesheet" href="{{ asset('css/search.css') }}">
    @endif
    @if (request()->is('colleagues'))
        <link rel="stylesheet" href="{{ asset('css/colleagues.css') }}">
    @endif
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geologica:wght,CRSV@100..900,0&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
        rel="stylesheet">
    <script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/laravel-echo@1.16.1/dist/echo.iife.js"></script>
</head>

<body>

    <div class="main-shell">
        <aside class="column-left">
            <div class="sidecard" id="sidecard">
                <div class="sidecard-brand">
                    <span>Doc</span>
                    <span>Hub</span>
                </div>
                <div class="sidecard-avatar">
                    <img src="{{ auth()->user() && auth()->user()->avatar ? auth()->user()->avatar : asset('images/avatar.png') }}"
                        alt="" class="sidecard-avatar-img" id="profile-avatar">
                </div>
                <div class="sidecard-nav-wrap">
                    <button class="sidecard-icon sidecard-search {{ request()->is('search') ? 'active' : '' }}"
                        type="button" title="Search">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd"
                                d="M5.36999 5.36995C4.75038 5.98131 4.25782 6.70919 3.92068 7.5117C3.58354 8.3142 3.40847 9.17547 3.40555 10.0459C3.40264 10.9163 3.57193 11.7788 3.90369 12.5835C4.23545 13.3883 4.72311 14.1194 5.33861 14.7349C5.95411 15.3504 6.68528 15.8381 7.49002 16.1698C8.29477 16.5016 9.15719 16.6709 10.0276 16.668C10.8981 16.6651 11.7593 16.49 12.5618 16.1529C13.3643 15.8157 14.0922 15.3232 14.7036 14.7035C15.9276 13.463 16.6113 11.7887 16.6055 10.0459C16.5996 8.30315 15.9047 6.63344 14.6724 5.40111C13.4401 4.16879 11.7704 3.47389 10.0276 3.46805C8.28487 3.46222 6.61054 4.14591 5.36999 5.36995ZM13.0068 13.0067C12.6168 13.3968 12.1537 13.7062 11.6441 13.9172C11.1345 14.1283 10.5884 14.237 10.0368 14.237C9.48521 14.237 8.93903 14.1283 8.42943 13.9172C7.91984 13.7062 7.45681 13.3968 7.06679 13.0067C6.67676 12.6167 6.36738 12.1537 6.15629 11.6441C5.94521 11.1345 5.83657 10.5883 5.83657 10.0367C5.83657 9.48517 5.94521 8.93899 6.15629 8.4294C6.36738 7.9198 6.67676 7.45677 7.06679 7.06675C7.85448 6.27906 8.92282 5.83653 10.0368 5.83653C11.1508 5.83653 12.2191 6.27906 13.0068 7.06675C13.7945 7.85444 14.237 8.92278 14.237 10.0367C14.237 11.1507 13.7945 12.2191 13.0068 13.0067Z"
                                fill="#75ABDF" />
                            <path
                                d="M13.4304 15.9767C13.2632 15.8095 13.1306 15.611 13.0401 15.3926C12.9496 15.1741 12.903 14.94 12.903 14.7035C12.903 14.4671 12.9496 14.2329 13.0401 14.0145C13.1306 13.796 13.2632 13.5975 13.4304 13.4303C13.5976 13.2631 13.7961 13.1305 14.0145 13.04C14.233 12.9495 14.4671 12.903 14.7036 12.903C14.94 12.903 15.1742 12.9495 15.3926 13.04C15.6111 13.1305 15.8096 13.2631 15.9768 13.4303L20.2188 17.6735C20.3907 17.8396 20.5278 18.0382 20.6222 18.2578C20.7165 18.4774 20.7662 18.7136 20.7682 18.9526C20.7703 19.1916 20.7248 19.4286 20.6343 19.6498C20.5438 19.8711 20.4101 20.072 20.2411 20.241C20.0721 20.41 19.8711 20.5437 19.6499 20.6342C19.4287 20.7247 19.1917 20.7703 18.9527 20.7682C18.7137 20.7661 18.4775 20.7164 18.2579 20.6221C18.0383 20.5278 17.8396 20.3907 17.6736 20.2187L13.4304 15.9767Z"
                                fill="#75ABDF" />
                        </svg>
                    </button>
                    <div class="sidecard-search-panel" id="sidecardSearchPanel" aria-hidden="true">
                        <input type="text" id="sidecardSearchInput" placeholder="Поиск" autocomplete="off">
                        <button type="button" class="sidecard-search-close" id="sidecardSearchClose"
                            aria-label="Закрыть">×</button>
                    </div>
                    <div class="sidecard-line"></div>
                    <nav class="sidecard-nav" id="menu">
                        <a href="/profile" class="sidecard-item {{ request()->is('profile') ? 'active' : '' }}"
                            title="Profile">
                            <svg width="19" height="19" viewBox="0 0 19 19" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd"
                                    d="M0 17.9444V17.2214C0 16.4983 0.498 15.656 1.114 15.3383L6.774 12.4228C7.595 12.0006 7.786 11.0633 7.194 10.3223L6.832 9.86944C6.096 8.949 5.5 7.23056 5.5 6.02722V4.22222C5.5 3.10242 5.92143 2.02848 6.67157 1.23666C7.42172 0.44484 8.43913 0 9.5 0C10.5609 0 11.5783 0.44484 12.3284 1.23666C13.0786 2.02848 13.5 3.10242 13.5 4.22222V6.02722C13.5 7.23056 12.9 8.95428 12.168 9.87156L11.807 10.3233C11.217 11.0612 11.401 11.9996 12.226 12.4239L17.886 15.3393C18.501 15.656 19 16.4931 19 17.2214V17.9444C19 18.2244 18.8946 18.4929 18.7071 18.6908C18.5196 18.8888 18.2652 19 18 19H1C0.734784 19 0.48043 18.8888 0.292893 18.6908C0.105357 18.4929 0 18.2244 0 17.9444Z"
                                    fill="#75ABDF" />
                            </svg>
                        </a>
                        <a href="/news" class="sidecard-item {{ request()->is('news') ? 'active' : '' }}" title="News">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd"
                                    d="M2.3999 4.1999C2.3999 3.72251 2.58954 3.26468 2.92711 2.92711C3.26468 2.58954 3.72251 2.3999 4.1999 2.3999H14.9999C15.4773 2.3999 15.9351 2.58954 16.2727 2.92711C16.6103 3.26468 16.7999 3.72251 16.7999 4.1999V18.2999C16.7999 19.1751 17.1476 20.0145 17.7664 20.6334C18.3853 21.2522 19.2247 21.5999 20.0999 21.5999H5.6999C4.82469 21.5999 3.98532 21.2522 3.36645 20.6334C2.74758 20.0145 2.3999 19.1751 2.3999 18.2999V4.1999ZM6.8999 12.5999C6.66121 12.5999 6.43229 12.6947 6.26351 12.8635C6.09472 13.0323 5.9999 13.2612 5.9999 13.4999C5.9999 13.7386 6.09472 13.9675 6.26351 14.1363C6.43229 14.3051 6.66121 14.3999 6.8999 14.3999H12.2999C12.5386 14.3999 12.7675 14.3051 12.9363 14.1363C13.1051 13.9675 13.1999 13.7386 13.1999 13.4999C13.1999 13.2612 13.1051 13.0323 12.9363 12.8635C12.7675 12.6947 12.5386 12.5999 12.2999 12.5999H6.8999ZM6.8999 16.1999C6.66121 16.1999 6.43229 16.2947 6.26351 16.4635C6.09472 16.6323 5.9999 16.8612 5.9999 17.0999C5.9999 17.3386 6.09472 17.5675 6.26351 17.7363C6.43229 17.9051 6.66121 17.9999 6.8999 17.9999H12.2999C12.5386 17.9999 12.7675 17.9051 12.9363 17.7363C13.1051 17.5675 13.1999 17.3386 13.1999 17.0999C13.1999 16.8612 13.1051 16.6323 12.9363 16.4635C12.7675 16.2947 12.5386 16.1999 12.2999 16.1999H6.8999ZM5.9999 6.8999C5.9999 6.66121 6.09472 6.43229 6.26351 6.26351C6.43229 6.09472 6.66121 5.9999 6.8999 5.9999H12.2999C12.5386 5.9999 12.7675 6.09472 12.9363 6.26351C13.1051 6.43229 13.1999 6.66121 13.1999 6.8999V9.8999C13.1999 10.1386 13.1051 10.3675 12.9363 10.5363C12.7675 10.7051 12.5386 10.7999 12.2999 10.7999H6.8999C6.66121 10.7999 6.43229 10.7051 6.26351 10.5363C6.09472 10.3675 5.9999 10.1386 5.9999 9.8999V6.8999Z"
                                    fill="#75ABDF" />
                                <path
                                    d="M19.8001 7.7999H18.6001V18.2999C18.6001 18.6977 18.7581 19.0793 19.0394 19.3606C19.3207 19.6419 19.7023 19.7999 20.1001 19.7999C20.4979 19.7999 20.8795 19.6419 21.1608 19.3606C21.4421 19.0793 21.6001 18.6977 21.6001 18.2999V9.5999C21.6001 9.12251 21.4105 8.66467 21.0729 8.3271C20.7353 7.98954 20.2775 7.7999 19.8001 7.7999Z"
                                    fill="#75ABDF" />
                            </svg>
                        </a>
                        <a href="/colleagues" class="sidecard-item {{ request()->is('colleagues') ? 'active' : '' }}"
                            title="Colleagues">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
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
                            </svg>
                        </a>
                        <a href="/messenger" class="sidecard-item {{ request()->is('messenger') ? 'active' : '' }}"
                            title="Messages">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M4 18H6V22.081L11.101 18H16C17.103 18 18 17.103 18 16V8C18 6.897 17.103 6 16 6H4C2.897 6 2 6.897 2 8V16C2 17.103 2.897 18 4 18Z"
                                    fill="#75ABDF" />
                                <path
                                    d="M20 2H8C6.897 2 6 2.897 6 4H18C19.103 4 20 4.897 20 6V14C21.103 14 22 13.103 22 12V4C22 2.897 21.103 2 20 2Z"
                                    fill="#75ABDF" />
                            </svg>
                        </a>
                        <a href="/meetings" class="sidecard-item {{ request()->is('meetings') ? 'active' : '' }}"
                            title="Meetings">
                            <i class="fa-solid fa-microphone"></i>
                        </a>
                        <a href="/notes" class="sidecard-item {{ request()->is('notes') ? 'active' : '' }}"
                            title="Notes">
                            <i class="fa-solid fa-calendar"></i>
                        </a>
                        <a href="/verification/admin" class="sidecard-item" id="adminPanelLink" style="display: none;"
                            title="Admin">
                            <i class="fa-solid fa-shield"></i>
                        </a>
                    </nav>
                    <div class="sidecard-line"></div>
                </div>
                <div class="sidecard-actions">
                    <div class="notification-wrapper">
                        <button class="sidecard-icon" id="h_btn1" type="button" title="Notifications">
                            <svg width="18" height="21" viewBox="0 0 18 21" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M18 17V18H0V17L2 15V9C2 5.9 4.03 3.17 7 2.29V2C7 1.46957 7.21071 0.960859 7.58579 0.585786C7.96086 0.210714 8.46957 0 9 0C9.53043 0 10.0391 0.210714 10.4142 0.585786C10.7893 0.960859 11 1.46957 11 2V2.29C13.97 3.17 16 5.9 16 9V15L18 17ZM11 19C11 19.5304 10.7893 20.0391 10.4142 20.4142C10.0391 20.7893 9.53043 21 9 21C8.46957 21 7.96086 20.7893 7.58579 20.4142C7.21071 20.0391 7 19.5304 7 19"
                                    fill="#75ABDF" />
                            </svg>

                            <span id="notifBadge"
                                style="display:none; position:absolute; top:-2px; right:-2px; width:8px; height:8px; background:red; border-radius:50%;"></span>
                        </button>
                        <div class="notification-popup" id="notifPopup">
                            <div class="popup-header">
                                <span>Уведомления</span>
                                <a href="#" id="clearNotifsBtn"
                                    style="font-size:12px; text-decoration:none;">Очистить</a>
                            </div>
                            <div class="popup-list" id="notifList">
                                <div class="notify-item"
                                    style="cursor:default; text-align:center; color:#999; padding:15px;">Загрузка...
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="settings-wrapper">
                        <button class="sidecard-icon" id="h_btn2" type="button" title="Settings">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M9.72933 13.5C8.80107 13.5 7.91084 13.1313 7.25446 12.4749C6.59808 11.8185 6.22933 10.9283 6.22933 10C6.22933 9.07174 6.59808 8.18151 7.25446 7.52513C7.91084 6.86875 8.80107 6.5 9.72933 6.5C10.6576 6.5 11.5478 6.86875 12.2042 7.52513C12.8606 8.18151 13.2293 9.07174 13.2293 10C13.2293 10.9283 12.8606 11.8185 12.2042 12.4749C11.5478 13.1313 10.6576 13.5 9.72933 13.5ZM17.1593 10.97C17.1993 10.65 17.2293 10.33 17.2293 10C17.2293 9.67 17.1993 9.34 17.1593 9L19.2693 7.37C19.4593 7.22 19.5093 6.95 19.3893 6.73L17.3893 3.27C17.2693 3.05 16.9993 2.96 16.7793 3.05L14.2893 4.05C13.7693 3.66 13.2293 3.32 12.5993 3.07L12.2293 0.420002C12.209 0.302219 12.1477 0.195429 12.0561 0.118553C11.9646 0.0416778 11.8489 -0.000319774 11.7293 1.83347e-06H7.72933C7.47933 1.83347e-06 7.26933 0.180002 7.22933 0.420002L6.85933 3.07C6.22933 3.32 5.68933 3.66 5.16933 4.05L2.67933 3.05C2.45933 2.96 2.18933 3.05 2.06933 3.27L0.0693316 6.73C-0.0606684 6.95 -0.000668302 7.22 0.189332 7.37L2.29933 9C2.25933 9.34 2.22933 9.67 2.22933 10C2.22933 10.33 2.25933 10.65 2.29933 10.97L0.189332 12.63C-0.000668302 12.78 -0.0606684 13.05 0.0693316 13.27L2.06933 16.73C2.18933 16.95 2.45933 17.03 2.67933 16.95L5.16933 15.94C5.68933 16.34 6.22933 16.68 6.85933 16.93L7.22933 19.58C7.26933 19.82 7.47933 20 7.72933 20H11.7293C11.9793 20 12.1893 19.82 12.2293 19.58L12.5993 16.93C13.2293 16.67 13.7693 16.34 14.2893 15.94L16.7793 16.95C16.9993 17.03 17.2693 16.95 17.3893 16.73L19.3893 13.27C19.5093 13.05 19.4593 12.78 19.2693 12.63L17.1593 10.97Z"
                                    fill="#75ABDF" />
                            </svg>

                        </button>
                        <div class="settings-popup" id="settingsPopup">
                            <ul class="settings-list">
                                <li>
                                    <a href="/profile" class="settings-link">
                                        <span class="icon">✏️</span> Редактировать профиль
                                    </a>
                                </li>
                                <li class="divider"></li>
                                <li>
                                    <a href="#" id="logoutBtn" class="settings-link text-danger">
                                        <span class="icon">🚪</span> Выйти
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
        <div class="main-shell-content">
            @yield('content')
        </div>
    </div>
    <footer class="site-footer">
        <div class="footer-container">

            <div class="footer-column info-column">
                <h2 class="footer-logo">DocHub</h2>
                <p class="footer-desc">
                    специализированная социальная сеть<br>
                    для медицинских работников
                </p>

                <h3 class="footer-heading">Наши контакты</h3>

                <div class="contact-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0056b3" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M22 6l-10 7L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                    <span class="contact-label">Почта:</span>
                    <a href="mailto:askdakjsd@mail.ru">askdakjsd@mail.ru</a>
                </div>

                <div class="contact-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0056b3" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .57 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.03 12.03 0 0 0 2.81.57A2 2 0 0 1 22 16.92z"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span class="contact-label">Телефон:</span>
                    <a href="tel:+77057823891">+77057823891</a>
                </div>
            </div>

            <div class="footer-column nav-column">
                <h3 class="footer-heading">Навигация</h3>
                <ul class="footer-links">
                    <li><a href="#">Новостная страница</a></li>
                </ul>

                <h3 class="footer-heading profile-heading">Профиль</h3>
                <ul class="footer-links">
                    <li><a href="#">Коллеги</a></li>
                    <li><a href="#">Сообщения</a></li>
                    <li><a href="#">Собрания</a></li>
                    <li><a href="#">Заметки</a></li>
                </ul>
            </div>

            <div class="footer-column help-column">
                <h3 class="footer-heading">Помощь</h3>
                <ul class="footer-links">
                    <li><a href="#">F.A.Q.</a></li>
                    <li><a href="#" id="supportLink">Поддержка</a></li>
                    <li><a href="#">Политика конфиденциальности</a></li>
                </ul>
            </div>

        </div>
    </footer>
    <script src="https://js.pusher.com/7.2/pusher.min.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/laravel-echo/dist/echo.iife.js" defer></script>
    <script src="{{ asset('js/admin.js') }}" defer></script>
    <script src="{{ asset('js/verification.js') }}" defer></script>
    <script src="{{ asset('js/verification-admin.js') }}" defer></script>
    <script src="{{ asset('js/feed.js') }}" defer></script>
    <script src="{{ asset('js/search-ui.js') }}" defer></script>
    @if (request()->is('lecture/*'))
        <script src="{{ asset('js/lecture.js') }}" defer></script>
    @endif
    @if (request()->is('lecture-archives'))
        <script src="{{ asset('js/lecture-archives.js') }}" defer></script>
    @endif
    @if (request()->is('notes'))
        <script src="{{ asset('js/notes.js') }}" defer></script>
    @endif
    @if (request()->is('meetings'))
        <script src="{{ asset('js/meetings.js') }}" defer></script>
    @endif
    @if (request()->is('search'))
        <script src="{{ asset('js/search.js') }}" defer></script>
    @endif
    @if (request()->is('colleagues'))
        <script src="{{ asset('js/colleagues.js') }}" defer></script>
    @endif
</body>

</html>