<link rel="stylesheet" href="css/messenger.css">
<script src="{{ asset('js/mess.js') }}"></script>

<link rel="stylesheet" href="{{ asset('css/messenger_new.css') }}">
<script src="{{ asset('js/mess_new.js') }}"></script>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>messenger</title>
    <link rel="stylesheet" href="css/messenger.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geologica:wght,CRSV@100..900,0&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>

    <div class="app-container">

        <header class="header-shelf">
            <div class="header-content">
                <div class="logo-container">
                    <i class="fa-solid fa-arrow-left back-btn"></i>
                    <span class="logo-text">DocHub</span>
                </div>

                <div class="search-container">
                    <div class="search-wrapper">
                        <input type="text" placeholder="">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </div>
                </div>

                <div class="actions">
                    <button class="icon-btn1" id="h-btn1">
                        <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M18 17V18H0V17L2 15V9C2 5.9 4.03 3.17 7 2.29V2C7 1.46957 7.21071 0.960859 7.58579 0.585786C7.96086 0.210714 8.46957 0 9 0C9.53043 0 10.0391 0.210714 10.4142 0.585786C10.7893 0.960859 11 1.46957 11 2V2.29C13.97 3.17 16 5.9 16 9V15L18 17ZM11 19C11 19.5304 10.7893 20.0391 10.4142 20.4142C10.0391 20.7893 9.53043 21 9 21C8.46957 21 7.96086 20.7893 7.58579 20.4142C7.21071 20.0391 7 19.5304 7 19"
                                fill="#0056A6" />
                        </svg>
                    </button>
                    <button class="icon-btn2" id="h-btn2">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M9.72933 13.5C8.80107 13.5 7.91084 13.1313 7.25446 12.4749C6.59808 11.8185 6.22933 10.9283 6.22933 10C6.22933 9.07174 6.59808 8.18151 7.25446 7.52513C7.91084 6.86875 8.80107 6.5 9.72933 6.5C10.6576 6.5 11.5478 6.86875 12.2042 7.52513C12.8606 8.18151 13.2293 9.07174 13.2293 10C13.2293 10.9283 12.8606 11.8185 12.2042 12.4749C11.5478 13.1313 10.6576 13.5 9.72933 13.5ZM17.1593 10.97C17.1993 10.65 17.2293 10.33 17.2293 10C17.2293 9.67 17.1993 9.34 17.1593 9L19.2693 7.37C19.4593 7.22 19.5093 6.95 19.3893 6.73L17.3893 3.27C17.2693 3.05 16.9993 2.96 16.7793 3.05L14.2893 4.05C13.7693 3.66 13.2293 3.32 12.5993 3.07L12.2293 0.420002C12.209 0.302219 12.1477 0.195429 12.0561 0.118553C11.9646 0.0416778 11.8489 -0.000319774 11.7293 1.83347e-06H7.72933C7.47933 1.83347e-06 7.26933 0.180002 7.22933 0.420002L6.85933 3.07C6.22933 3.32 5.68933 3.66 5.16933 4.05L2.67933 3.05C2.45933 2.96 2.18933 3.05 2.06933 3.27L0.0693316 6.73C-0.0606684 6.95 -0.000668302 7.22 0.189332 7.37L2.29933 9C2.25933 9.34 2.22933 9.67 2.22933 10C2.22933 10.33 2.25933 10.65 2.29933 10.97L0.189332 12.63C-0.000668302 12.78 -0.0606684 13.05 0.0693316 13.27L2.06933 16.73C2.18933 16.95 2.45933 17.03 2.67933 16.95L5.16933 15.94C5.68933 16.34 6.22933 16.68 6.85933 16.93L7.22933 19.58C7.26933 19.82 7.47933 20 7.72933 20H11.7293C11.9793 20 12.1893 19.82 12.2293 19.58L12.5993 16.93C13.2293 16.67 13.7693 16.34 14.2893 15.94L16.7793 16.95C16.9993 17.03 17.2693 16.95 17.3893 16.73L19.3893 13.27C19.5093 13.05 19.4593 12.78 19.2693 12.63L17.1593 10.97Z"
                                fill="#0056A6" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>

        <div class="main-grid">
            <aside class="sidebar">
                <div class="card group-section">
                    <h3 class="section-title">Группы</h3>
                    <div class="list-container">
                        <div class="list-item">
                            <div class="avatar-sq"></div>
                            <div class="item-info">
                                <span class="name">Lorem ips.</span>
                                <span class="desc">Lorem ipsum!</span>
                            </div>
                            <div class="item-meta">
                                <span class="time">20:31</span>
                                <i class="fa-solid fa-microphone"></i>
                            </div>
                        </div>
                    </div>
                    <button class="btn-create">Создать новую группу</button>
                </div>

                <div class="card message-section">
                    <h3 class="section-title">Сообщения</h3>
                    <div class="list-container scrollable">
                        <div class="list-item">
                            <div class="avatar-sq"></div>
                            <div class="item-info">
                                <span class="name">Lorem ips.</span>
                                <span class="desc">Lorem ipsum!</span>
                            </div>
                            <div class="item-meta">
                                <span class="time">20:31</span>
                                <i class="fa-solid fa-microphone"></i>
                            </div>
                        </div>
                    </div>
                    <button class="btn-create">Создать новый чат</button>
                </div>
            </aside>

            <main class="card chat-empty-state">
                <div class="empty-content">
                    <h2>Выберите диалог...</h2>
                    <p>или</p>
                    <button class="btn-primary">Создать новый чат</button>
                </div>
            </main>
        </div>
    </div>
    <script src="{{ asset('js/mess.js') }}"></script>
</body>
</html>
