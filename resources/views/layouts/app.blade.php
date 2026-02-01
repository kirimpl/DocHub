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
                    <img src="{{ auth()->user() && auth()->user()->avatar ? auth()->user()->avatar : asset('images/avatar.png') }}" alt="" class="sidecard-avatar-img" id="profile-avatar">
                </div>
                <div class="sidecard-nav-wrap">
                    <button class="sidecard-icon sidecard-search" type="button" title="Search">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.36999 5.36995C4.75038 5.98131 4.25782 6.70919 3.92068 7.5117C3.58354 8.3142 3.40847 9.17547 3.40555 10.0459C3.40264 10.9163 3.57193 11.7788 3.90369 12.5835C4.23545 13.3883 4.72311 14.1194 5.33861 14.7349C5.95411 15.3504 6.68528 15.8381 7.49002 16.1698C8.29477 16.5016 9.15719 16.6709 10.0276 16.668C10.8981 16.6651 11.7593 16.49 12.5618 16.1529C13.3643 15.8157 14.0922 15.3232 14.7036 14.7035C15.9276 13.463 16.6113 11.7887 16.6055 10.0459C16.5996 8.30315 15.9047 6.63344 14.6724 5.40111C13.4401 4.16879 11.7704 3.47389 10.0276 3.46805C8.28487 3.46222 6.61054 4.14591 5.36999 5.36995ZM13.0068 13.0067C12.6168 13.3968 12.1537 13.7062 11.6441 13.9172C11.1345 14.1283 10.5884 14.237 10.0368 14.237C9.48521 14.237 8.93903 14.1283 8.42943 13.9172C7.91984 13.7062 7.45681 13.3968 7.06679 13.0067C6.67676 12.6167 6.36738 12.1537 6.15629 11.6441C5.94521 11.1345 5.83657 10.5883 5.83657 10.0367C5.83657 9.48517 5.94521 8.93899 6.15629 8.4294C6.36738 7.9198 6.67676 7.45677 7.06679 7.06675C7.85448 6.27906 8.92282 5.83653 10.0368 5.83653C11.1508 5.83653 12.2191 6.27906 13.0068 7.06675C13.7945 7.85444 14.237 8.92278 14.237 10.0367C14.237 11.1507 13.7945 12.2191 13.0068 13.0067Z" fill="#75ABDF"/>
                            <path d="M13.4304 15.9767C13.2632 15.8095 13.1306 15.611 13.0401 15.3926C12.9496 15.1741 12.903 14.94 12.903 14.7035C12.903 14.4671 12.9496 14.2329 13.0401 14.0145C13.1306 13.796 13.2632 13.5975 13.4304 13.4303C13.5976 13.2631 13.7961 13.1305 14.0145 13.04C14.233 12.9495 14.4671 12.903 14.7036 12.903C14.94 12.903 15.1742 12.9495 15.3926 13.04C15.6111 13.1305 15.8096 13.2631 15.9768 13.4303L20.2188 17.6735C20.3907 17.8396 20.5278 18.0382 20.6222 18.2578C20.7165 18.4774 20.7662 18.7136 20.7682 18.9526C20.7703 19.1916 20.7248 19.4286 20.6343 19.6498C20.5438 19.8711 20.4101 20.072 20.2411 20.241C20.0721 20.41 19.8711 20.5437 19.6499 20.6342C19.4287 20.7247 19.1917 20.7703 18.9527 20.7682C18.7137 20.7661 18.4775 20.7164 18.2579 20.6221C18.0383 20.5278 17.8396 20.3907 17.6736 20.2187L13.4304 15.9767Z" fill="#75ABDF"/>
                        </svg>
                    </button>
                    <div class="sidecard-line"></div>
                    <nav class="sidecard-nav" id="menu">
                        <a href="profile" class="sidecard-item" title="Profile">
                            <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M0 17.9444V17.2214C0 16.4983 0.498 15.656 1.114 15.3383L6.774 12.4228C7.595 12.0006 7.786 11.0633 7.194 10.3223L6.832 9.86944C6.096 8.949 5.5 7.23056 5.5 6.02722V4.22222C5.5 3.10242 5.92143 2.02848 6.67157 1.23666C7.42172 0.44484 8.43913 0 9.5 0C10.5609 0 11.5783 0.44484 12.3284 1.23666C13.0786 2.02848 13.5 3.10242 13.5 4.22222V6.02722C13.5 7.23056 12.9 8.95428 12.168 9.87156L11.807 10.3233C11.217 11.0612 11.401 11.9996 12.226 12.4239L17.886 15.3393C18.501 15.656 19 16.4931 19 17.2214V17.9444C19 18.2244 18.8946 18.4929 18.7071 18.6908C18.5196 18.8888 18.2652 19 18 19H1C0.734784 19 0.48043 18.8888 0.292893 18.6908C0.105357 18.4929 0 18.2244 0 17.9444Z" fill="#75ABDF"/>
                            </svg>
                        </a>
                        <a href="#" class="sidecard-item active" title="News">
                            <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M0 2.1C0 1.54305 0.221249 1.0089 0.615076 0.615076C1.0089 0.221249 1.54305 0 2.1 0H14.7C15.257 0 15.7911 0.221249 16.1849 0.615076C16.5787 1.0089 16.8 1.54305 16.8 2.1V18.55C16.8 19.5711 17.2056 20.5503 17.9276 21.2724C18.6497 21.9944 19.6289 22.4 20.65 22.4H3.85C2.82892 22.4 1.84965 21.9944 1.12764 21.2724C0.405624 20.5503 0 19.5711 0 18.55V2.1ZM5.25 11.9C4.97152 11.9 4.70445 12.0106 4.50754 12.2075C4.31062 12.4045 4.2 12.6715 4.2 12.95C4.2 13.2285 4.31062 13.4955 4.50754 13.6925C4.70445 13.8894 4.97152 14 5.25 14H11.55C11.8285 14 12.0955 13.8894 12.2925 13.6925C12.4894 13.4955 12.6 13.2285 12.6 12.95C12.6 12.6715 12.4894 12.4045 12.2925 12.2075C12.0955 12.0106 11.8285 11.9 11.55 11.9H5.25ZM5.25 16.1C4.97152 16.1 4.70445 16.2106 4.50754 16.4075C4.31062 16.6045 4.2 16.8715 4.2 17.15C4.2 17.4285 4.31062 17.6955 4.50754 17.8925C4.70445 18.0894 4.97152 18.2 5.25 18.2H11.55C11.8285 18.2 12.0955 18.0894 12.2925 17.8925C12.4894 17.6955 12.6 17.4285 12.6 17.15C12.6 16.8715 12.4894 16.6045 12.2925 16.4075C12.0955 16.2106 11.8285 16.1 11.55 16.1H5.25ZM4.2 5.25C4.2 4.97152 4.31062 4.70445 4.50754 4.50754C4.70445 4.31062 4.97152 4.2 5.25 4.2H11.55C11.8285 4.2 12.0955 4.31062 12.2925 4.50754C12.4894 4.70445 12.6 4.97152 12.6 5.25V8.75C12.6 9.02848 12.4894 9.29555 12.2925 9.49246C12.0955 9.68937 11.8285 9.8 11.55 9.8H5.25C4.97152 9.8 4.70445 9.68937 4.50754 9.49246C4.31062 9.29555 4.2 9.02848 4.2 8.75V5.25Z" fill="white"/>
                                <path d="M20.3 6.30005H18.9V18.55C18.9 19.0142 19.0844 19.4593 19.4126 19.7875C19.7407 20.1157 20.1859 20.3 20.65 20.3C21.1141 20.3 21.5592 20.1157 21.8874 19.7875C22.2156 19.4593 22.4 19.0142 22.4 18.55V8.40005C22.4 7.84309 22.1787 7.30895 21.7849 6.91512C21.3911 6.5213 20.8569 6.30005 20.3 6.30005Z" fill="white"/>
                            </svg>
                        </a>
                        <a href="#" class="sidecard-item" title="Colleagues">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.125 12C8.98896 12 10.5 10.489 10.5 8.625C10.5 6.76104 8.98896 5.25 7.125 5.25C5.26104 5.25 3.75 6.76104 3.75 8.625C3.75 10.489 5.26104 12 7.125 12Z" fill="#75ABDF"/>
                                <path d="M10.9688 13.875C9.64875 13.2047 8.19187 12.9375 7.125 12.9375C5.03531 12.9375 0.75 14.2191 0.75 16.7812V18.75H7.78125V17.9967C7.78125 17.1061 8.15625 16.2131 8.8125 15.4688C9.33609 14.8744 10.0692 14.3227 10.9688 13.875Z" fill="#75ABDF"/>
                                <path d="M15.9375 13.5C13.4967 13.5 8.625 15.0075 8.625 18V20.25H23.25V18C23.25 15.0075 18.3783 13.5 15.9375 13.5Z" fill="#75ABDF"/>
                                <path d="M15.9375 12C18.2157 12 20.0625 10.1532 20.0625 7.875C20.0625 5.59683 18.2157 3.75 15.9375 3.75C13.6593 3.75 11.8125 5.59683 11.8125 7.875C11.8125 10.1532 13.6593 12 15.9375 12Z" fill="#75ABDF"/>
                            </svg>
                        </a>
                        <a href="messenger" class="sidecard-item" title="Messages">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 18H6V22.081L11.101 18H16C17.103 18 18 17.103 18 16V8C18 6.897 17.103 6 16 6H4C2.897 6 2 6.897 2 8V16C2 17.103 2.897 18 4 18Z" fill="#75ABDF"/>
                                <path d="M20 2H8C6.897 2 6 2.897 6 4H18C19.103 4 20 4.897 20 6V14C21.103 14 22 13.103 22 12V4C22 2.897 21.103 2 20 2Z" fill="#75ABDF"/>
                            </svg>
                        </a>
                        <a href="#" class="sidecard-item" title="Meetings">
                            <i class="fa-solid fa-microphone"></i>
                        </a>
                        <a href="#" class="sidecard-item" title="Notes">
                            <i class="fa-solid fa-calendar"></i>
                        </a>
                        <a href="/verification/admin" class="sidecard-item" id="adminPanelLink" style="display: none;" title="Admin">
                            <i class="fa-solid fa-shield"></i>
                        </a>
                    </nav>
                    <div class="sidecard-line"></div>
                </div>
                <div class="sidecard-actions">
                    <div class="notification-wrapper">
                        <button class="sidecard-icon" id="h_btn1" type="button" title="Notifications">
                            <i class="fa-solid fa-bell"></i>
                            <span id="notifBadge"
                                style="display:none; position:absolute; top:-2px; right:-2px; width:8px; height:8px; background:red; border-radius:50%;"></span>
                        </button>
                        <div class="notification-popup" id="notifPopup">
                            <div class="popup-header">
                                <span>РЈРІРµРґРѕРјР»РµРЅРёСЏ</span>
                                <a href="#" id="clearNotifsBtn" style="font-size:12px; text-decoration:none;">РћС‡РёСЃС‚РёС‚СЊ</a>
                            </div>
                            <div class="popup-list" id="notifList">
                                <div class="notify-item"
                                    style="cursor:default; text-align:center; color:#999; padding:15px;">Р—Р°РіСЂСѓР·РєР°...</div>
                            </div>
                        </div>
                    </div>
                    <div class="settings-wrapper">
                        <button class="sidecard-icon" id="h_btn2" type="button" title="Settings">
                            <i class="fa-solid fa-gear"></i>
                        </button>
                        <div class="settings-popup" id="settingsPopup">
                            <ul class="settings-list">
                                <li>
                                    <a href="/profile" class="settings-link">
                                        <span class="icon">вњЏпёЏ</span> Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РїСЂРѕС„РёР»СЊ
                                    </a>
                                </li>
                                <li class="divider"></li>
                                <li>
                                    <a href="#" id="logoutBtn" class="settings-link text-danger">
                                        <span class="icon">рџљЄ</span> Р’С‹Р№С‚Рё
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
    @if (request()->is('lecture/*'))
    <script src="{{ asset('js/lecture.js') }}" defer></script>
    @endif
    @if (request()->is('lecture-archives'))
    <script src="{{ asset('js/lecture-archives.js') }}" defer></script>
    @endif
</body>

</html>
