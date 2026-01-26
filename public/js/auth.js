function switchTab(target) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

    if (target === 'login') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

// 2. Функция входа (Фейковая для теста)
function handleLogin(e) {
    e.preventDefault();

    const email = e.target.querySelector('input[type="email"]').value;
    console.log("Вход выполнен:", email);
    localStorage.setItem('auth_token', 'demo-token-123');
    alert('Успешный вход! Переходим на главную...');
    window.location.href = 'news';
}