<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DocHub</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geologica:wght,CRSV@100..900,0&display=swap" rel="stylesheet">
    <script src="{{ asset('js/feed.js') }}" defer></script>
</head>

<body>
    <header class="header-shelf">
        <div class="header-content">
            <div class="logo">
                <p>DocHub</p>
            </div>

            <div class="search-container">
                <div class="search-wrapper">
                    <input type="text" placeholder="">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </div>
            </div>

            <div class="actions">
                <button class="icon-btn1" id = "h-btn1">
                    <svg width="18" height="21" viewBox="0 0 18 21" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M18 17V18H0V17L2 15V9C2 5.9 4.03 3.17 7 2.29V2C7 1.46957 7.21071 0.960859 7.58579 0.585786C7.96086 0.210714 8.46957 0 9 0C9.53043 0 10.0391 0.210714 10.4142 0.585786C10.7893 0.960859 11 1.46957 11 2V2.29C13.97 3.17 16 5.9 16 9V15L18 17ZM11 19C11 19.5304 10.7893 20.0391 10.4142 20.4142C10.0391 20.7893 9.53043 21 9 21C8.46957 21 7.96086 20.7893 7.58579 20.4142C7.21071 20.0391 7 19.5304 7 19"
                            fill="#0056A6" />
                    </svg>
                </button>
                <button class="icon-btn2" id = "h-btn2">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M9.72933 13.5C8.80107 13.5 7.91084 13.1313 7.25446 12.4749C6.59808 11.8185 6.22933 10.9283 6.22933 10C6.22933 9.07174 6.59808 8.18151 7.25446 7.52513C7.91084 6.86875 8.80107 6.5 9.72933 6.5C10.6576 6.5 11.5478 6.86875 12.2042 7.52513C12.8606 8.18151 13.2293 9.07174 13.2293 10C13.2293 10.9283 12.8606 11.8185 12.2042 12.4749C11.5478 13.1313 10.6576 13.5 9.72933 13.5ZM17.1593 10.97C17.1993 10.65 17.2293 10.33 17.2293 10C17.2293 9.67 17.1993 9.34 17.1593 9L19.2693 7.37C19.4593 7.22 19.5093 6.95 19.3893 6.73L17.3893 3.27C17.2693 3.05 16.9993 2.96 16.7793 3.05L14.2893 4.05C13.7693 3.66 13.2293 3.32 12.5993 3.07L12.2293 0.420002C12.209 0.302219 12.1477 0.195429 12.0561 0.118553C11.9646 0.0416778 11.8489 -0.000319774 11.7293 1.83347e-06H7.72933C7.47933 1.83347e-06 7.26933 0.180002 7.22933 0.420002L6.85933 3.07C6.22933 3.32 5.68933 3.66 5.16933 4.05L2.67933 3.05C2.45933 2.96 2.18933 3.05 2.06933 3.27L0.0693316 6.73C-0.0606684 6.95 -0.000668302 7.22 0.189332 7.37L2.29933 9C2.25933 9.34 2.22933 9.67 2.22933 10C2.22933 10.33 2.25933 10.65 2.29933 10.97L0.189332 12.63C-0.000668302 12.78 -0.0606684 13.05 0.0693316 13.27L2.06933 16.73C2.18933 16.95 2.45933 17.03 2.67933 16.95L5.16933 15.94C5.68933 16.34 6.22933 16.68 6.85933 16.93L7.22933 19.58C7.26933 19.82 7.47933 20 7.72933 20H11.7293C11.9793 20 12.1893 19.82 12.2293 19.58L12.5993 16.93C13.2293 16.67 13.7693 16.34 14.2893 15.94L16.7793 16.95C16.9993 17.03 17.2693 16.95 17.3893 16.73L19.3893 13.27C19.5093 13.05 19.4593 12.78 19.2693 12.63L17.1593 10.97Z"
                            fill="#0056A6" />
                    </svg>
                </button>
            </div>
        </div>
    </header>

    <main class="main">

        <div class="profile_card" id="profile_card">
            <div class="profile-header">
                <img src="{{ asset('images/avatar.png') }}" alt="Avatar" class="avatar-img">
                <div class="profile-info">
                    <h3 class="profile-name">Lorem Ips.</h3>
                    <p class="profile-role">Терапевт</p>
                </div>
            </div>

            <div class="profile-details">
                <div class="detail-item">
                    <div class="detail-icon">
                        <svg width="22" height="18" viewBox="0 0 22 18" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M20 16H22V18H0V16H2V1C2 0.734784 2.10536 0.48043 2.29289 0.292893C2.48043 0.105357 2.73478 0 3 0H13C13.2652 0 13.5196 0.105357 13.7071 0.292893C13.8946 0.48043 14 0.734784 14 1V16H16V6H19C19.2652 6 19.5196 6.10536 19.7071 6.29289C19.8946 6.48043 20 6.73478 20 7V16ZM6 8V10H10V8H6ZM6 4V6H10V4H6Z"
                                fill="#0056A6" />
                        </svg>
                    </div>
                    <div class="detail-text">
                        <span class="label">Организация:</span> КГП на ПХВ «Городская поликлиника №3»
                    </div>
                </div>

                <div class="detail-item">
                    <div class="detail-icon">
                        <svg width="16" height="21" viewBox="0 0 16 21" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M16 0H0V2L5.81 6.36C4.04674 6.94143 2.58648 8.19917 1.75016 9.8568C0.913849 11.5144 0.769916 13.4363 1.35 15.2C1.63699 16.0737 2.09342 16.8822 2.69318 17.5794C3.29294 18.2765 4.02426 18.8486 4.84531 19.2628C5.66635 19.677 6.56101 19.9253 7.47811 19.9935C8.39521 20.0616 9.31674 19.9483 10.19 19.66C11.5905 19.1997 12.8099 18.309 13.6744 17.1149C14.5388 15.9207 15.0043 14.4842 15.0043 13.01C15.0043 11.5358 14.5388 10.0993 13.6744 8.90514C12.8099 7.71103 11.5905 6.82031 10.19 6.36L16 2V0ZM10.94 17.5L8 15.78L5.06 17.5L5.84 14.17L3.25 11.93L6.66 11.64L8 8.5L9.34 11.64L12.75 11.93L10.16 14.17L10.94 17.5Z"
                                fill="#0056A6" />
                        </svg>
                    </div>
                    <div class="detail-text">
                        <span class="label">Стаж работы:</span> 20 лет
                    </div>
                </div>

            </div>

            <button class="btn-profile">Перейти на профиль</button>
        </div>

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
        <div class="card calendar-card" id="calendar">
            <h3 class="calendar-title">Календарь событий</h3>

            <div class="calendar-wrapper">
                <div class="weekdays-row">
                    <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
                </div>

                <div class="days-grid">
                    <span class="prev-month">29</span>
                    <span class="prev-month">30</span>
                    <span class="prev-month">31</span>

                    <span>01</span><span>02</span><span>03</span><span>04</span>
                    <span>05</span><span>06</span><span>07</span><span>08</span><span>09</span><span>10</span><span>11</span>
                    <span>12</span><span>13</span><span>14</span><span>15</span><span>16</span><span>17</span><span>18</span>
                    <span>19</span><span>20</span><span>21</span><span>22</span><span>23</span><span>24</span><span>25</span>
                    <span>26</span><span>27</span><span>28</span><span>29</span><span>30</span><span>31</span>

                    <span class="next-month">01</span>
                </div>
            </div>
        </div>
        <nav class="card nav-menu" id="menu">

            <a href="#" class="nav-item active">
                <span class="nav-icon"><svg width="18" height="20" viewBox="0 0 18 20" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M0 1.8C0 1.32261 0.189642 0.864773 0.527208 0.527208C0.864773 0.189642 1.32261 0 1.8 0H12.6C13.0774 0 13.5352 0.189642 13.8728 0.527208C14.2104 0.864773 14.4 1.32261 14.4 1.8V15.9C14.4 16.7752 14.7477 17.6146 15.3665 18.2335C15.9854 18.8523 16.8248 19.2 17.7 19.2H3.3C2.42479 19.2 1.58542 18.8523 0.966548 18.2335C0.347678 17.6146 0 16.7752 0 15.9V1.8ZM4.5 10.2C4.2613 10.2 4.03239 10.2948 3.8636 10.4636C3.69482 10.6324 3.6 10.8613 3.6 11.1C3.6 11.3387 3.69482 11.5676 3.8636 11.7364C4.03239 11.9052 4.2613 12 4.5 12H9.9C10.1387 12 10.3676 11.9052 10.5364 11.7364C10.7052 11.5676 10.8 11.3387 10.8 11.1C10.8 10.8613 10.7052 10.6324 10.5364 10.4636C10.3676 10.2948 10.1387 10.2 9.9 10.2H4.5ZM4.5 13.8C4.2613 13.8 4.03239 13.8948 3.8636 14.0636C3.69482 14.2324 3.6 14.4613 3.6 14.7C3.6 14.9387 3.69482 15.1676 3.8636 15.3364C4.03239 15.5052 4.2613 15.6 4.5 15.6H9.9C10.1387 15.6 10.3676 15.5052 10.5364 15.3364C10.7052 15.1676 10.8 14.9387 10.8 14.7C10.8 14.4613 10.7052 14.2324 10.5364 14.0636C10.3676 13.8948 10.1387 13.8 9.9 13.8H4.5ZM3.6 4.5C3.6 4.2613 3.69482 4.03239 3.8636 3.8636C4.03239 3.69482 4.2613 3.6 4.5 3.6H9.9C10.1387 3.6 10.3676 3.69482 10.5364 3.8636C10.7052 4.03239 10.8 4.2613 10.8 4.5V7.5C10.8 7.73869 10.7052 7.96761 10.5364 8.1364C10.3676 8.30518 10.1387 8.4 9.9 8.4H4.5C4.2613 8.4 4.03239 8.30518 3.8636 8.1364C3.69482 7.96761 3.6 7.73869 3.6 7.5V4.5Z"
                            fill="#0056A6" />
                    </svg>
                </span> <span class="nav-text">Новости организации</span>
            </a>

            <a href="#" class="nav-item">
                <span class="nav-icon"><svg width="19" height="18" viewBox="0 0 19 18" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M0 17V16.315C0 15.63 0.498 14.832 1.114 14.531L6.774 11.769C7.595 11.369 7.786 10.481 7.194 9.779L6.832 9.35C6.096 8.478 5.5 6.85 5.5 5.71V4C5.5 2.93913 5.92143 1.92172 6.67157 1.17157C7.42172 0.421427 8.43913 0 9.5 0C10.5609 0 11.5783 0.421427 12.3284 1.17157C13.0786 1.92172 13.5 2.93913 13.5 4V5.71C13.5 6.85 12.9 8.483 12.168 9.352L11.807 9.78C11.217 10.479 11.401 11.368 12.226 11.77L17.886 14.532C18.501 14.832 19 15.625 19 16.315V17C19 17.2652 18.8946 17.5196 18.7071 17.7071C18.5196 17.8946 18.2652 18 18 18H1C0.734784 18 0.48043 17.8946 0.292893 17.7071C0.105357 17.5196 0 17.2652 0 17Z"
                            fill="#75ABDF" />
                    </svg>
                </span>
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
                    </svg>
                </span>
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
                    </svg>
                </span>
                <span class="nav-text">Сообщения</span>
            </a>

            <a href="#" class="nav-item">
                <span class="nav-icon"><svg width="14" height="19" viewBox="0 0 14 19" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M7 0C7.79565 0 8.55871 0.316071 9.12132 0.87868C9.68393 1.44129 10 2.20435 10 3V9C10 9.79565 9.68393 10.5587 9.12132 11.1213C8.55871 11.6839 7.79565 12 7 12C6.20435 12 5.44129 11.6839 4.87868 11.1213C4.31607 10.5587 4 9.79565 4 9V3C4 2.20435 4.31607 1.44129 4.87868 0.87868C5.44129 0.316071 6.20435 0 7 0ZM14 9C14 12.53 11.39 15.44 8 15.93V19H6V15.93C2.61 15.44 0 12.53 0 9H2C2 10.3261 2.52678 11.5979 3.46447 12.5355C4.40215 13.4732 5.67392 14 7 14C8.32608 14 9.59785 13.4732 10.5355 12.5355C11.4732 11.5979 12 10.3261 12 9H14Z"
                            fill="#75ABDF" />
                    </svg>
                </span> <span class="nav-text">Собрания</span>
            </a>

            <a href="#" class="nav-item">
                <span class="nav-icon"><svg width="18" height="20" viewBox="0 0 18 20" fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M16 2H13V0H11V2H7V0H5V2H2C0.897 2 0 2.897 0 4V18C0 19.103 0.897 20 2 20H16C17.103 20 18 19.103 18 18V4C18 2.897 17.103 2 16 2ZM9 12H4V10H9V12ZM14 8H4V6H14V8Z"
                            fill="#75ABDF" />
                    </svg>
                </span>
                <span class="nav-text">Записки</span>
            </a>

        </nav>
        <div class="card post-card" id = "news">

            <div class="post-header">
                <h3 class="post-author">КГП на ПХВ «Городская поликлиника №3»</h3>
                <span class="post-date">Понедельник, 10:14</span>
            </div>

            <div class="post-content">
                <p class="post-text">
                    Уважаемые сотрудники, в среду планируется обход кабинетов на проверку соответствия сан-пин нормам.
                </p>

                <div class="post-gallery">
                    <div class="gallery-item" style="background-image: url('images/hospital.png');"></div>
                    <div class="gallery-item" style="background-image: url('images/hospital2.png');"></div>
                </div>
            </div>

            <div class="post-actions">
                <button class="action-btn like-btn"><svg width="20" height="18" viewBox="0 0 20 18"
                        fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M0 5.85223C0 10.7152 4.02 13.3062 6.962 15.6262C8 16.4442 9 17.2152 10 17.2152C11 17.2152 12 16.4452 13.038 15.6252C15.981 13.3072 20 10.7152 20 5.85323C20 0.991225 14.5 -2.45977 10 2.21623C5.5 -2.45977 0 0.989226 0 5.85223Z"
                            fill="#0056A6" />
                    </svg>
                </button>
                <button class="action-btn comment-btn"><svg width="24" height="24" viewBox="0 0 24 24"
                        fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M4 18H6V22.081L11.101 18H16C17.103 18 18 17.103 18 16V8C18 6.897 17.103 6 16 6H4C2.897 6 2 6.897 2 8V16C2 17.103 2.897 18 4 18Z"
                            fill="#0056A6" />
                        <path
                            d="M20 2H8C6.897 2 6 2.897 6 4H18C19.103 4 20 4.897 20 6V14C21.103 14 22 13.103 22 12V4C22 2.897 21.103 2 20 2Z"
                            fill="#0056A6" />
                    </svg>
                </button>
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
                    </svg>
                </button>
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

    </main>

</body>

</html>
