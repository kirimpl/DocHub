document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. АВТОРИЗАЦИЯ И ОБЩИЕ НАСТРОЙКИ
    // ==========================================

    const API_URL = "http://localhost:8000/api"; // Проверьте порт!
    const token = localStorage.getItem("auth_token");

    // Проверка токена
    if (!token) {
        window.location.href = "/"; // Если токена нет - на выход
        return;
    }
    console.log("Пользователь авторизован, грузим контент...");

    // Логика выхода (Logout)
    function logout() {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_info");
        window.location.href = "/";
    }

    const logoutBtn =
        document.querySelector(".icon-btn-logout") ||
        document.querySelector(".text-danger");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Сворачивание карточки лекций (если есть)
    const toggleBtn = document.querySelector(".btn-more");
    const card = document.querySelector(".lectures-card");
    if (toggleBtn && card) {
        toggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            card.classList.toggle("collapsed");
        });
    }

    // Попапы уведомлений и настроек
    setupPopups();

    // ==========================================
    // 2. КАЛЕНДАРЬ И СОБЫТИЯ (ОБНОВЛЕНО)
    // ==========================================

    // Элементы UI Календаря
    const daysContainer = document.getElementById("daysGrid");
    const monthYearLabel = document.getElementById("monthYearLabel");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    // Элементы Модального окна ДОБАВЛЕНИЯ (Существующее)
    const addModal = document.getElementById("eventModal");
    const addModalTitle = document.getElementById("modalDateTitle");
    const eventInput = document.getElementById("eventInput");
    const saveBtn = document.getElementById("saveEventBtn");
    const cancelAddBtn = document.getElementById("cancelBtn");
    const closeAddBtn = addModal
        ? addModal.querySelector(".close-modal-btn")
        : null;

    // Элементы Модального окна ПРОСМОТРА (Новое)
    const viewModal = document.getElementById("viewEventModal");
    const viewDateTitle = document.getElementById("viewDateTitle"); // H3 заголовок в новом окне
    const eventsListWrapper = document.getElementById("eventsListWrapper"); // Контейнер списка
    const closeViewBtn = document.getElementById("closeViewBtn"); // Кнопка "Закрыть" внизу
    const addMoreBtn = document.getElementById("addMoreBtn"); // Кнопка "Добавить еще"
    const closeViewXBtn = viewModal
        ? viewModal.querySelector("#closeViewXBtn")
        : null; // Крестик (если добавили id) или класс

    // Состояние календаря
    let currentDate = new Date();
    let activeMonth = currentDate.getMonth();
    let activeYear = currentDate.getFullYear();

    // ВАЖНО: Теперь храним события как объект: { "2026-01-28": [ {title: "...", ...} ] }
    let eventsMap = {};
    let selectedDateStr = null; // Выбранная дата (строка YYYY-MM-DD)

    // --- ФУНКЦИЯ: ЗАГРУЗКА С БЭКЕНДА ---
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

                // Очищаем карту перед заполнением
                eventsMap = {};

                serverData.forEach((event) => {
                    // Пытаемся найти дату в starts_at или created_at
                    let rawDate = event.starts_at || event.created_at;

                    if (rawDate) {
                        // Берем только YYYY-MM-DD (первые 10 символов)
                        const dateKey = rawDate.substring(0, 10);

                        // Если ключа нет, создаем массив
                        if (!eventsMap[dateKey]) {
                            eventsMap[dateKey] = [];
                        }
                        // Добавляем событие в массив
                        eventsMap[dateKey].push(event);
                    }
                });

                console.log("События обновлены (Map):", eventsMap);
                renderCalendar(activeYear, activeMonth);
            }
        } catch (error) {
            console.error("Ошибка загрузки событий:", error);
        }
    }

    // --- ФУНКЦИЯ: ОТРИСОВКА КАЛЕНДАРЯ ---
    function renderCalendar(year, month) {
        if (!daysContainer) return; // Защита если нет календаря на странице

        daysContainer.innerHTML = "";
        const monthName = new Date(year, month).toLocaleString("ru-RU", {
            month: "long",
        });
        monthYearLabel.textContent = `${monthName} ${year}`;

        let firstDay = new Date(year, month, 1).getDay();
        let adjustDay = firstDay === 0 ? 6 : firstDay - 1; // Коррекция для ПН-ВС

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

            // Формируем ключ даты: YYYY-MM-DD
            const dateStr = `${year}-${String(month + 1).padStart(
                2,
                "0"
            )}-${String(i).padStart(2, "0")}`;

            // Подсветка "Сегодня"
            if (
                i === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear()
            ) {
                span.classList.add("today");
            }

            // ПРОВЕРКА: Есть ли события в eventsMap для этой даты?
            if (eventsMap[dateStr] && eventsMap[dateStr].length > 0) {
                span.classList.add("has-event"); // Добавляем точку
            }

            // КЛИК ПО ДНЮ
            span.addEventListener("click", () => {
                selectedDateStr = dateStr; // Запоминаем дату

                if (eventsMap[dateStr] && eventsMap[dateStr].length > 0) {
                    // Сценарий 1: События есть -> Открываем ПРОСМОТР
                    openViewModal(dateStr, eventsMap[dateStr], i, monthName);
                } else {
                    // Сценарий 2: Событий нет -> Открываем ДОБАВЛЕНИЕ
                    openAddModal(dateStr, i, monthName);
                }
            });

            daysContainer.appendChild(span);
        }

        // 3. Дни СЛЕДУЮЩЕГО месяца (заполнение сетки)
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

    // --- ЛОГИКА ОКНА ДОБАВЛЕНИЯ ---
    function openAddModal(dateStr, dayNum, monthName) {
        addModalTitle.textContent = `Добавить на ${dateStr}`; // Или красивее с dayNum/monthName
        eventInput.value = "";
        addModal.classList.add("active");
    }

    function closeAddModal() {
        addModal.classList.remove("active");
    }

    // --- ЛОГИКА ОКНА ПРОСМОТРА ---
    function openViewModal(dateStr, list, dayNum, monthName) {
        if (!viewModal) return;

        viewDateTitle.textContent = `События: ${dateStr}`;
        eventsListWrapper.innerHTML = ""; // Очищаем старый список

        // Генерируем карточки событий
        list.forEach((ev) => {
            const card = document.createElement("div");
            card.classList.add("event-card"); // CSS класс из предыдущего шага

            // Время (обрезаем секунды)
            let timeStr = "--:--";
            if (ev.starts_at && ev.starts_at.length > 15) {
                timeStr = ev.starts_at.substring(11, 16);
            }

            card.innerHTML = `
                <span class="event-time">${timeStr}</span>
                <h4>${ev.title || "Без названия"}</h4>
                <p>${ev.description || ""}</p>
            `;
            eventsListWrapper.appendChild(card);
        });

        viewModal.classList.add("active");
    }

    function closeViewModal() {
        if (viewModal) viewModal.classList.remove("active");
    }

    // --- ФУНКЦИЯ: СОХРАНЕНИЕ СОБЫТИЯ ---
    async function saveEvent() {
        const title = eventInput.value.trim();

        if (selectedDateStr && title !== "") {
            const originalBtnText = saveBtn.textContent;
            saveBtn.textContent = "Сохранение...";
            saveBtn.disabled = true;

            try {
                const payload = {
                    title: title,
                    starts_at: selectedDateStr + " 11:00:00", // Ставим дефолтное время
                    ends_at: selectedDateStr + " 12:00:00",
                    description: "Создано вручную",
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
                    console.log(`Сохранено: ${title}`);
                    closeAddModal();
                    await loadEventsFromBackend(); // Перезагружаем календарь
                } else {
                    alert("Ошибка сохранения на сервере");
                }
            } catch (error) {
                console.error(error);
                alert("Ошибка соединения");
            } finally {
                saveBtn.textContent = originalBtnText;
                saveBtn.disabled = false;
            }
        }
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ (LISTENERS) ---

    // Окно добавления
    if (saveBtn) saveBtn.addEventListener("click", saveEvent);
    if (cancelAddBtn) cancelAddBtn.addEventListener("click", closeAddModal);
    if (closeAddBtn) closeAddBtn.addEventListener("click", closeAddModal);
    if (addModal) {
        addModal.addEventListener("click", (e) => {
            if (e.target === addModal) closeAddModal();
        });
    }

    // Окно просмотра (если HTML добавлен)
    if (viewModal) {
        if (closeViewBtn)
            closeViewBtn.addEventListener("click", closeViewModal);
        // Если у кнопки крестика есть ID или класс
        const closeX =
            viewModal.querySelector(".close-modal-btn") ||
            document.getElementById("closeViewXBtn");
        if (closeX) closeX.addEventListener("click", closeViewModal);

        viewModal.addEventListener("click", (e) => {
            if (e.target === viewModal) closeViewModal();
        });

        // Кнопка "Добавить еще"
        if (addMoreBtn) {
            addMoreBtn.addEventListener("click", () => {
                closeViewModal();
                // Открываем окно добавления для той же даты
                openAddModal(selectedDateStr, null, null);
            });
        }
    }

    // Переключение месяцев
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            activeMonth--;
            if (activeMonth < 0) {
                activeMonth = 11;
                activeYear--;
            }
            renderCalendar(activeYear, activeMonth);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            activeMonth++;
            if (activeMonth > 11) {
                activeMonth = 0;
                activeYear++;
            }
            renderCalendar(activeYear, activeMonth);
        });
    }

    // Запуск календаря
    if (daysContainer) {
        renderCalendar(activeYear, activeMonth);
        loadEventsFromBackend();
    }

    // ==========================================
    // 3. НОВОСТНАЯ ЛЕНТА (Оставлено как было)
    // ==========================================

    // ... Код новостной ленты с лайками и комментариями ...
    // (Для сокращения кода я не дублирую массив postsData целиком,
    // но он должен быть здесь, как в вашем старом коде)

    initNewsFeed(); // Вынес в отдельную функцию для чистоты

    function initNewsFeed() {
        const postsData = [
            {
                id: 1,
                author: "КГП на ПХВ «Городская поликлиника №3»",
                date: "Понедельник, 10:14",
                text: "Уважаемые сотрудники, в среду планируется обход кабинетов.",
                images: ["images/hospital.png", "images/hospital2.png"],
                category: "organization",
                likes: 42,
                isLiked: false,
                comments: [
                    { user: "Иванова А.А.", text: "Принято." },
                    { user: "Петров В.В.", text: "Во сколько точно?" },
                ],
            },
            // ... остальные посты ...
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

        if (!feedContainer || !template) return; // Если на странице нет ленты

        function renderFeed(filter = "all") {
            feedContainer.innerHTML = "";
            postsData.forEach((post) => {
                if (filter !== "all" && post.category !== filter) return;

                const clone = template.content.cloneNode(true);
                clone.querySelector(".post-author").textContent = post.author;
                clone.querySelector(".post-date").textContent = post.date;
                clone.querySelector(".post-text").textContent = post.text;

                // Галерея
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

                // Лайки
                const likeBtn = clone.querySelector(".like-btn");
                const likeCounter = clone.querySelector(".likes-count");
                likeCounter.textContent = post.likes;
                if (post.isLiked) likeBtn.classList.add("active");

                likeBtn.addEventListener("click", () => {
                    post.isLiked = !post.isLiked;
                    if (post.isLiked) {
                        likeBtn.classList.add("active");
                        post.likes++;
                    } else {
                        likeBtn.classList.remove("active");
                        post.likes--;
                    }
                    likeCounter.textContent = post.likes;
                });

                // Комментарии
                const commentBtn = clone.querySelector(".comment-btn");
                const commentCounter = clone.querySelector(".comments-count");
                const commentsSection =
                    clone.querySelector(".comments-section");
                const commentsList = clone.querySelector(".comments-list");

                commentCounter.textContent = post.comments.length;
                post.comments.forEach((comment) => {
                    const p = document.createElement("p");
                    p.classList.add("comment-row");
                    p.innerHTML = `<span class="comment-author">${comment.user}:</span> ${comment.text}`;
                    commentsList.appendChild(p);
                });

                commentBtn.addEventListener("click", () => {
                    commentsSection.style.display =
                        commentsSection.style.display === "none"
                            ? "block"
                            : "none";
                });

                feedContainer.appendChild(clone);
            });
        }

        filterTabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                filterTabs.forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                renderFeed(tab.dataset.filter);
            });
        });

        renderFeed("all");
    }

    // ==========================================
    // 4. ВСПОМОГАТЕЛЬНЫЕ ПОПАПЫ (Колокольчик/Настройки)
    // ==========================================
    function setupPopups() {
        const h_btn1 = document.getElementById("h_btn1");
        const notifPopup = document.getElementById("notifPopup");
        const h_btn2 = document.getElementById("h_btn2");
        const settingsPopup = document.getElementById("settingsPopup");

        // Уведомления
        if (h_btn1 && notifPopup) {
            h_btn1.addEventListener("click", (e) => {
                e.stopPropagation();
                notifPopup.classList.toggle("active");
                if (settingsPopup) settingsPopup.classList.remove("active");
            });
        }

        // Настройки
        if (h_btn2 && settingsPopup) {
            h_btn2.addEventListener("click", (e) => {
                e.stopPropagation();
                settingsPopup.classList.toggle("active");
                if (notifPopup) notifPopup.classList.remove("active");
            });
        }

        // Клик вне
        document.addEventListener("click", (e) => {
            if (
                notifPopup &&
                notifPopup.classList.contains("active") &&
                !notifPopup.contains(e.target)
            ) {
                notifPopup.classList.remove("active");
            }
            if (
                settingsPopup &&
                settingsPopup.classList.contains("active") &&
                !settingsPopup.contains(e.target)
            ) {
                settingsPopup.classList.remove("active");
            }
        });

        // Предотвращение закрытия при клике внутри
        if (notifPopup)
            notifPopup.addEventListener("click", (e) => e.stopPropagation());
        if (settingsPopup)
            settingsPopup.addEventListener("click", (e) => e.stopPropagation());
    }
});
