<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DocHub - Вход в систему</title>
    <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
</head>

<body>

    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <h2>DocHub</h2>
                <p>Медицинская информационная система</p>
            </div>

            <div class="auth-tabs">
                <button class="tab active" onclick="switchTab('login')">Вход</button>
                <button class="tab" onclick="switchTab('register')">Регистрация</button>
            </div>

            <form id="loginForm" class="auth-form active" onsubmit="handleLogin(event)">
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

                <h3>Контакты и аккаунт</h3>
                <input type="tel" name="phone_number" placeholder="Телефон (+7...)" pattern="^\+?[0-9]{7,20}$" required>
                <input type="email" name="email" placeholder="Email (Логин) *" required>
                <input type="password" name="password" placeholder="Пароль (мин. 6 символов) *" minlength="6" required>
                <input type="text" name="city" placeholder="Город">

                <h3>Работа</h3>
                <input type="text" name="speciality" placeholder="Специальность (напр. Терапевт) *" required>
                <input type="text" name="education" placeholder="ВУЗ / Образование *" required>
                <input type="number" name="work_experience" placeholder="Стаж (лет) *" min="0" max="100" required>
                <input type="text" name="work_place" placeholder="Место работы *" required>

                <input type="text" name="position" placeholder="Должность">
                <input type="text" name="category" placeholder="Категория">
                <input type="text" name="secondary_work_place" placeholder="Доп. место работы">
                <input type="text" name="secondary_speciality" placeholder="Доп. специальность">

                <h3>Роль в системе</h3>
                <select name="organization_role">
                    <option value="">Без руководящей роли</option>
                    <option value="staff">Сотрудник</option>
                    <option value="chief">Главврач</option>
                    <option value="deputy">Заместитель</option>
                </select>

                <button type="submit">Зарегистрировать врача</button>
            </form>
        </div>
    </div>

    <script src="{{ asset('js/auth.js') }}"></script>
</body>

</html>