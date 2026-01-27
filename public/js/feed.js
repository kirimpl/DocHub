// main.js (или в начале скрипта главной страницы)

document.addEventListener("DOMContentLoaded", () => {
    // 1. Проверяем наличие токена
    const token = localStorage.getItem("auth_token");

    // 2. Если токена нет — сразу перенаправляем на вход
    if (!token) {
        window.location.href = "/";
        return;
    }
    console.log("Пользователь авторизован, грузим контент...");
});

// main.js

// Функция выхода
function logout() {
    // 1. Удаляем токен и данные юзера
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_info");

    // 2. (Опционально) Отправляем запрос на бэк, чтобы он тоже убил сессию
    // fetch('/api/logout', ...);

    // 3. Перенаправляем на страницу входа
    window.location.href = "/";
}

// Находим кнопку выхода (добавь ей id="logoutBtn" в HTML или ищи по классу)
const logoutBtn =
    document.querySelector(".icon-btn-logout") ||
    document.querySelector(".text-danger");

if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.querySelector(".btn-more");
    const card = document.querySelector(".lectures-card");

    // Проверка, что элементы найдены
    if (toggleBtn && card) {
        console.log("Кнопка и карточка найдены, вешаем событие");

        toggleBtn.addEventListener("click", function (e) {
            e.preventDefault(); // На всякий случай предотвращаем стандартное поведение
            card.classList.toggle("collapsed");
            console.log("Класс collapsed переключен");
        });
    } else {
        console.error(
            "Ошибка: Не найдена кнопка .btn-more или карточка .lectures-card"
        );
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const postsData = [
        {
            id: 1,
            author: "КГП на ПХВ «Городская поликлиника №3»",
            date: "Понедельник, 10:14",
            text: "Уважаемые сотрудники, в среду планируется обход кабинетов.",
            images: ["images/hospital.png", "images/hospital2.png"],
            category: "organization",

            // Новые поля
            likes: 42,
            isLiked: false, // Я лайкнул?
            comments: [
                { user: "Иванова А.А.", text: "Принято." },
                { user: "Петров В.В.", text: "Во сколько точно?" },
            ],
        },
        {
            id: 2,
            author: "Отделение Терапии",
            date: "Вчера, 15:30",
            text: "Коллеги, прошу сдать отчеты до конца недели.",
            images: [],
            category: "department",
            likes: 12,
            isLiked: true,
            comments: [],
        },
        {
            id: 3,
            author: "Министерство Здравоохранения",
            date: "20.01.2026",
            text: "Новые протоколы лечения ОРВИ уже доступны.",
            images: [],
            category: "all",
            likes: 156,
            isLiked: false,
            comments: [{ user: "Admin", text: "Ссылка на портале." }],
        },
    ];

    const feedContainer = document.getElementById("newsFeed");
    const template = document.getElementById("postTemplate");
    const filterTabs = document.querySelectorAll(".filter-tab");

    function renderFeed(filter = "all") {
        feedContainer.innerHTML = "";

        postsData.forEach((post) => {
            if (filter !== "all" && post.category !== filter) return;

            const clone = template.content.cloneNode(true);

            // --- Заполнение текстов ---
            clone.querySelector(".post-author").textContent = post.author;
            clone.querySelector(".post-date").textContent = post.date;
            clone.querySelector(".post-text").textContent = post.text;

            // --- Галерея ---
            const gallery = clone.querySelector(".post-gallery");
            if (post.images.length > 0) {
                post.images.forEach((imgSrc) => {
                    const imgDiv = document.createElement("div");
                    imgDiv.classList.add("gallery-item");
                    imgDiv.style.backgroundImage = `url('${imgSrc}')`;
                    gallery.appendChild(imgDiv);
                });
            } else {
                gallery.style.display = "none";
            }

            // ============================================
            // === НОВАЯ ЛОГИКА: ЛАЙКИ И КОММЕНТАРИИ ===
            // ============================================

            // 1. ЛАЙКИ
            const likeBtn = clone.querySelector(".like-btn");
            const likeCounter = clone.querySelector(".likes-count");

            // Инициализация (ставим число и цвет, если уже лайкнуто)
            likeCounter.textContent = post.likes;
            if (post.isLiked) {
                likeBtn.classList.add("active");
            }

            // Обработчик клика
            likeBtn.addEventListener("click", () => {
                // Переключаем состояние в данных (для правильной логики)
                post.isLiked = !post.isLiked;

                // Меняем визуал
                if (post.isLiked) {
                    likeBtn.classList.add("active");
                    post.likes++; // Увеличиваем
                } else {
                    likeBtn.classList.remove("active");
                    post.likes--; // Уменьшаем
                }

                // Обновляем цифру
                likeCounter.textContent = post.likes;
            });

            // 2. КОММЕНТАРИИ
            const commentBtn = clone.querySelector(".comment-btn");
            const commentCounter = clone.querySelector(".comments-count");
            const commentsSection = clone.querySelector(".comments-section");
            const commentsList = clone.querySelector(".comments-list");
            const commentInput = clone.querySelector(".comment-input");

            // Ставим количество комментариев
            commentCounter.textContent = post.comments.length;

            // Заполняем список существующих комментариев
            post.comments.forEach((comment) => {
                const p = document.createElement("p");
                p.classList.add("comment-row");
                p.innerHTML = `<span class="comment-author">${comment.user}:</span> ${comment.text}`;
                commentsList.appendChild(p);
            });

            // Обработчик клика (Показать/Скрыть)
            commentBtn.addEventListener("click", () => {
                if (commentsSection.style.display === "none") {
                    commentsSection.style.display = "block"; // Показываем
                    commentInput.focus(); // Фокус в поле ввода
                } else {
                    commentsSection.style.display = "none"; // Скрываем
                }
            });

            feedContainer.appendChild(clone);
        });
    }

    // Обработчики фильтров (без изменений)
    filterTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            filterTabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");
            renderFeed(tab.dataset.filter);
        });
    });

    renderFeed("all");
});

document.addEventListener("DOMContentLoaded", () => {
    // --- КОНФИГУРАЦИЯ API ---
    const API_URL = "http://localhost:8000/api"; // Проверь порт!
    const token = localStorage.getItem("auth_token");

    // Если нет токена — календарь не заработает (или можно редиректить)
    if (!token) console.warn("Нет токена авторизации!");

    // --- ЭЛЕМЕНТЫ UI ---
    const daysContainer = document.getElementById("daysGrid");
    const monthYearLabel = document.getElementById("monthYearLabel");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    // Элементы модального окна
    const modal = document.getElementById("eventModal");
    const modalTitle = document.getElementById("modalDateTitle");
    const eventInput = document.getElementById("eventInput");
    const saveBtn = document.getElementById("saveEventBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const closeXBtn = document.querySelector(".close-modal-btn");

    // --- СОСТОЯНИЕ ---
    let currentDate = new Date();
    let activeMonth = currentDate.getMonth();
    let activeYear = currentDate.getFullYear();
    let selectedDateStr = null;

    // ИЗМЕНЕНИЕ 1: Изначально массив пуст, данные придут с сервера
    let events = [];

    // === БЭКЕНД: ЗАГРУЗКА СОБЫТИЙ ===
    async function loadEventsFromBackend() {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/events`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const serverData = await response.json();
                events = serverData.map((event) => {
                    // Берем только первые 10 символов (YYYY-MM-DD)
                    return event.start.substring(0, 10);
                });

                console.log("События обновлены:", events);
                renderCalendar(activeYear, activeMonth); // Перерисовываем сетку
            }
        } catch (error) {
            console.error("Ошибка загрузки событий:", error);
        }
    }

    // === ЛОГИКА КАЛЕНДАРЯ (Твой код) ===
    function renderCalendar(year, month) {
        daysContainer.innerHTML = "";
        const monthName = new Date(year, month).toLocaleString("ru-RU", {
            month: "long",
        });
        monthYearLabel.textContent = `${monthName} ${year}`;

        let firstDay = new Date(year, month, 1).getDay();
        let adjustDay = firstDay === 0 ? 6 : firstDay - 1;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // 1. Дни ПРОШЛОГО месяца
        for (let i = 0; i < adjustDay; i++) {
            const span = document.createElement("span");
            span.textContent = daysInPrevMonth - adjustDay + i + 1;
            span.classList.add("prev-month");
            daysContainer.appendChild(span);
        }

        // 2. Дни ТЕКУЩЕГО месяца
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const span = document.createElement("span");
            span.textContent = i;
            const dateStr = `${year}-${String(month + 1).padStart(
                2,
                "0"
            )}-${String(i).padStart(2, "0")}`;

            if (
                i === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear()
            ) {
                span.classList.add("today");
            }

            // Проверка: есть ли эта дата в массиве, полученном с сервера
            if (events.includes(dateStr)) {
                span.classList.add("has-event");
            }

            span.addEventListener("click", () => {
                openModal(dateStr, i, monthName);
            });

            daysContainer.appendChild(span);
        }

        // 3. Дни СЛЕДУЮЩЕГО месяца
        const totalCells = adjustDay + daysInMonth;
        const rowsNeeded = totalCells > 35 ? 42 : 35;
        const remainingCells = rowsNeeded - totalCells;

        for (let i = 1; i <= remainingCells; i++) {
            const span = document.createElement("span");
            span.textContent = i;
            span.classList.add("next-month");
            daysContainer.appendChild(span);
        }
    }

    // === ЛОГИКА МОДАЛЬНОГО ОКНА ===
    function openModal(dateStr, dayNum, monthName) {
        selectedDateStr = dateStr;
        modalTitle.textContent = `Событие на ${dayNum} ${monthName}`;
        eventInput.value = "";
        modal.classList.add("active");
    }

    function closeModal() {
        modal.classList.remove("active");
        selectedDateStr = null;
    }

    async function saveEvent() {
        const title = eventInput.value.trim();

        if (selectedDateStr && title !== "") {
            const originalBtnText = saveBtn.textContent;
            saveBtn.textContent = "Сохранение...";
            saveBtn.disabled = true;

            try {
                const payload = {
                    title: title,
                    start: selectedDateStr + " 09:00:00",
                    end: selectedDateStr + " 10:00:00",
                    description: "Создано через календарь",
                    is_global: false,
                };

                const response = await fetch(`${API_URL}/events`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    console.log(
                        `Сохранено: ${title} на дату ${selectedDateStr}`
                    );
                    closeModal();
                    await loadEventsFromBackend();
                } else {
                    alert("Ошибка сохранения на сервере");
                }
            } catch (error) {
                console.error(error);
                alert("Ошибка соединения");
                // Для ДЕМО (если сервер упал): все равно добавляем точку локально
                if (!events.includes(selectedDateStr))
                    events.push(selectedDateStr);
                renderCalendar(activeYear, activeMonth);
                closeModal();
            } finally {
                saveBtn.textContent = originalBtnText;
                saveBtn.disabled = false;
            }
        }
    }

    // Event Listeners
    saveBtn.addEventListener("click", saveEvent);
    cancelBtn.addEventListener("click", closeModal);
    closeXBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    prevBtn.addEventListener("click", () => {
        activeMonth--;
        if (activeMonth < 0) {
            activeMonth = 11;
            activeYear--;
        }
        renderCalendar(activeYear, activeMonth);
    });

    nextBtn.addEventListener("click", () => {
        activeMonth++;
        if (activeMonth > 11) {
            activeMonth = 0;
            activeYear++;
        }
        renderCalendar(activeYear, activeMonth);
    });

    renderCalendar(activeYear, activeMonth);
    loadEventsFromBackend();
});

document.addEventListener("DOMContentLoaded", () => {
    const h_btn1 = document.getElementById("h_btn1");
    const popup = document.getElementById("notifPopup");

    // 1. Открытие/Закрытие по клику на колокольчик
    h_btn1.addEventListener("click", (e) => {
        e.stopPropagation();
        popup.classList.toggle("active");
    });

    // 2. Click Outside (Закрытие при клике вне)
    document.addEventListener("click", (e) => {
        if (!popup.contains(e.target) && popup.classList.contains("active")) {
            popup.classList.remove("active");
        }
    });

    popup.addEventListener("click", (e) => {
        e.stopPropagation();
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const h_btn2 = document.getElementById("h_btn2");
    const settingsPopup = document.getElementById("settingsPopup");

    // 1. Открытие/Закрытие
    if (h_btn2 && settingsPopup) {
        h_btn2.addEventListener("click", (e) => {
            e.stopPropagation();
            settingsPopup.classList.toggle("active");
        });
    }

    // 2. Закрытие при клике вовне (Click Outside)
    document.addEventListener("click", (e) => {
        if (settingsPopup && settingsPopup.classList.contains("active")) {
            if (!settingsPopup.contains(e.target) && e.target !== h_btn2) {
                settingsPopup.classList.remove("active");
            }
        }
    });
});
