<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Вход в систему</title>
    <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
</head>
<body>

    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <h2>DocHub</h2>
                <p>Система для врачей</p>
            </div>

            <div class="auth-tabs">
                <button class="tab active" onclick="switchTab('login')">Вход</button>
                <button class="tab" onclick="switchTab('register')">Регистрация</button>
            </div>

            <form id="loginForm" class="auth-form active" onsubmit="handleLogin(event)">
                <div class="input-group">
                    <label>Email</label>
                    <input type="email" required placeholder="admin@med.com">
                </div>
                <div class="input-group">
                    <label>Пароль</label>
                    <input type="password" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn-primary">Войти</button>
            </form>

            <form id="registerForm" class="auth-form">
                <div class="input-group">
                    <label>ФИО</label>
                    <input type="text" required placeholder="Иванов Иван">
                </div>
                <div class="input-group">
                    <label>Email</label>
                    <input type="email" required>
                </div>
                <div class="input-group">
                    <label>Пароль</label>
                    <input type="password" required>
                </div>
                <button type="button" class="btn-primary" onclick="alert('Регистрация пока недоступна в демо-режиме')">Создать аккаунт</button>
            </form>
        </div>
    </div>
    <script src="{{ asset('js/auth.js') }}" defer></script>
</body>
</html>