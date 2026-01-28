// public/js/auth.js

// Адрес API (замените если порт другой)
const API_URL = "http://127.0.0.1:8000/api";

// 1. Логика переключения вкладок
function switchTab(target) {
    // Убираем активный класс со всех кнопок и форм
    document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
    document
        .querySelectorAll(".auth-form")
        .forEach((f) => f.classList.remove("active"));

    // Находим нужные элементы по индексу (0 - вход, 1 - регистрация)
    if (target === "login") {
        document.querySelectorAll(".tab")[0].classList.add("active");
        document.getElementById("loginForm").classList.add("active");
    } else {
        document.querySelectorAll(".tab")[1].classList.add("active");
        document.getElementById("registerForm").classList.add("active");
    }
}

// 2. Логика ВХОДА (только email и password)
async function handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    const originalText = btn.innerText;

    // Блокируем кнопку
    btn.disabled = true;
    btn.innerText = "Вход...";

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem("auth_token", result.token);
            window.location.href = "/news"; // Успешный вход
        } else {
            alert(result.message || "Ошибка входа");
        }
    } catch (error) {
        alert("Ошибка соединения с сервером");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// 3. Логика РЕГИСТРАЦИИ (Все поля)
async function handleRegister(e) {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    const originalText = btn.innerText;

    btn.disabled = true;
    btn.innerText = "Создание аккаунта...";

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Очистка пустых полей (Laravel не любит пустые строки в integer полях)
    for (const key in data) {
        if (data[key] === "") data[key] = null;
    }

    // Принудительная конвертация опыта работы в число
    if (data.work_experience)
        data.work_experience = Number(data.work_experience);

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem("auth_token", result.token);
            alert("Регистрация успешна!");
            window.location.href = "/news";
        } else {
            console.log(result);
            if (result.errors) {
                let msg = "Ошибки заполнения:\n";
                for (let key in result.errors) {
                    msg += `- ${result.errors[key][0]}\n`;
                }
                alert(msg);
            } else {
                alert(result.message || "Ошибка регистрации");
            }
        }
    } catch (error) {
        console.error(error);
        alert("Ошибка соединения с сервером");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}
