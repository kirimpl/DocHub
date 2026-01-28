<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DocHub - Вход / Регистрация</title>
    <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
</head>

<body>

    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <h2>DocHub</h2>
                <p>Единый вход для врачей платформы DocHub</p>
            </div>

            <div class="auth-tabs">
                <button class="tab active" onclick="switchTab('login')">Вход</button>
                <button class="tab" onclick="switchTab('register')">Регистрация</button>
            </div>

            <form id="loginForm" class="auth-form active" onsubmit="handleLogin(event)">
                <div class="auth-error" role="alert"></div>
                <div>
                    <label>Email</label>
                    <input type="email" name="email" required placeholder="name@clinic.com">
                </div>
                <div>
                    <label>Пароль</label>
                    <input type="password" name="password" required placeholder="••••••••">
                </div>
                <button type="submit">Войти</button>
            </form>

            <form id="registerForm" class="auth-form" onsubmit="handleRegister(event)">
                <div class="auth-error" role="alert"></div>
                <h3>Личные данные</h3>
                <input type="text" name="last_name" placeholder="Фамилия *" required>
                <input type="text" name="name" placeholder="Имя *" required>

                <select name="sex" required>
                    <option value="" disabled selected>Пол *</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                </select>

                <div>
                    <label>Дата рождения *</label>
                    <input type="date" name="birth_date" required>
                </div>

                <h3>Контакты и учетная запись</h3>
                <input type="tel" name="phone_number" placeholder="Телефон (+7...)" pattern="^\+?[0-9]{7,20}$" required>
                <input type="email" name="email" placeholder="Email *" required>
                <input type="password" name="password" placeholder="Пароль (мин. 6 символов) *" minlength="6" required>
                <select name="city" id="citySelect">
                    <option value="" disabled selected>Город</option>
                </select>
                <div style="font-size:12px; color:#6b7280; margin-top:-6px;">Выберите город, чтобы открыть список мест работы</div>

                <h3>Профиль</h3>
                <select name="speciality" id="specialitySelect" required>
                    <option value="" disabled selected>Специальность *</option>
                </select>
                <select name="education" id="educationSelect" required>
                    <option value="" disabled selected>ВУЗ / образование *</option>
                </select>
                <input type="number" name="work_experience" placeholder="Стаж (лет) *" min="0" max="100" required>
                <select name="work_place" id="workPlaceSelect" required disabled>
                    <option value="" disabled selected>Сначала выберите город</option>
                </select>
                <div style="font-size:12px; color:#6b7280; margin-top:-6px;">Поле «Место работы» станет доступным после выбора города</div>

                <select name="position" id="positionSelect">
                    <option value="" disabled selected>Должность</option>
                </select>
                <select name="category" id="categorySelect">
                    <option value="" disabled selected>Категория</option>
                </select>

                <div class="secondary-toggle">
                    <label class="checkbox">
                        <input type="checkbox" id="toggleSecondaryWork">
                        <span>Доп. место работы</span>
                    </label>
                </div>
                <div id="secondaryWorkFields" style="display:none;">
                    <select name="secondary_work_place" id="secondaryWorkPlaceSelect" disabled>
                        <option value="" disabled selected>Сначала выберите город</option>
                    </select>
                    <input type="text" name="secondary_speciality" placeholder="Доп. специальность" list="specialityList">
                </div>

                <h3>Роль в организации</h3>
                <select name="organization_role" required>
                    <option value="" disabled selected>Выберите роль в организации *</option>
                    <option value="staff">Сотрудник</option>
                    <option value="chief">Главврач</option>
                    <option value="deputy">Заместитель</option>
                </select>

                <button type="submit">Зарегистрироваться</button>
            </form>
        </div>
    </div>

    <datalist id="specialityList"></datalist>

    <script src="{{ asset('js/auth.js') }}"></script>
</body>

</html>
