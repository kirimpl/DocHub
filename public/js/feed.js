document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "http://localhost:8000/api";
    const token = localStorage.getItem("auth_token");

    if (!token) {
        window.location.href = "/";
        return;
    }

    const notifBtn = document.getElementById("h_btn1");
    const notifPopup = document.getElementById("notifPopup");
    const notifList = document.getElementById("notifList");
    const clearNotifsBtn = document.getElementById("clearNotifsBtn");
    const settingsBtn = document.getElementById("h_btn2");
    const settingsPopup = document.getElementById("settingsPopup");
    const logoutBtn = document.querySelector(".text-danger");
    
    let badge = notifBtn.querySelector("#notifBadge");
    if (!badge) {
        badge = document.createElement("span");
        badge.id = "notifBadge";
        badge.style.cssText = "position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; background: red; border-radius: 50%; display: none; border: 2px solid #fff;";
        notifBtn.appendChild(badge);
    }

    async function loadNotifications() {
        try {
            const response = await fetch(`${API_URL}/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                renderNotifications(data);
            }
        } catch (error) {
            console.error(error);
        }
    }

    function renderNotifications(data) {
        if (!notifList) return;
        notifList.innerHTML = "";

        const notifications = Array.isArray(data) ? data : (data.data || []);

        if (notifications.length === 0) {
            notifList.innerHTML = `<div style="padding:15px; text-align:center; color:#999; font-size:13px;">Нет новых уведомлений</div>`;
            badge.style.display = "none";
            return;
        }

        const hasUnread = notifications.some(n => !n.read_at);
        badge.style.display = hasUnread ? "block" : "none";

        notifications.forEach((n) => {
            const item = document.createElement("div");
            item.className = "notify-item";
            if (!n.read_at) {
                item.style.backgroundColor = "#f0f8ff";
            }

            const text = n.data.message || n.data.body || "Новое уведомление";
            const time = new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            item.innerHTML = `
                <div class="notify-avatar" style="background: #0056A6; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">!</div>
                <div class="notify-content" style="font-size: 13px; line-height: 1.3;">
                    <p class="notify-text" style="margin: 0;">${text}</p>
                    <span class="notify-time" style="font-size: 11px; color: #aaa; display: block; margin-top: 4px;">${time}</span>
                </div>
            `;

            item.addEventListener("click", () => markAsRead(n.id, item));
            notifList.appendChild(item);
        });
    }

    async function markAsRead(id, element) {
        try {
            await fetch(`${API_URL}/notifications/${id}/read`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            element.style.backgroundColor = "transparent";
        } catch (error) {
            console.error(error);
        }
    }

    if (clearNotifsBtn) {
        clearNotifsBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await fetch(`${API_URL}/notifications/read-all`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                loadNotifications();
            } catch (error) {
                console.error(error);
            }
        });
    }

    async function logout() {
        if (!confirm("Вы действительно хотите выйти?")) return;

        try {
            await fetch(`${API_URL}/security/logout-all`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });
        } catch (error) {
            console.warn(error);
        } finally {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_info");
            window.location.href = "/";
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    }

    if (notifBtn) {
        notifBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (settingsPopup) settingsPopup.classList.remove("active");
            notifPopup.classList.toggle("active");
            
            if (notifPopup.classList.contains("active")) {
                loadNotifications();
            }
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (notifPopup) notifPopup.classList.remove("active");
            settingsPopup.classList.toggle("active");
        });
    }

    document.addEventListener("click", (e) => {
        if (notifPopup && notifPopup.classList.contains("active") && !notifPopup.contains(e.target) && e.target !== notifBtn) {
            notifPopup.classList.remove("active");
        }
        if (settingsPopup && settingsPopup.classList.contains("active") && !settingsPopup.contains(e.target) && e.target !== settingsBtn) {
            settingsPopup.classList.remove("active");
        }
    });

    const daysContainer = document.getElementById("daysGrid");
    const monthYearLabel = document.getElementById("monthYearLabel");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    
    const addModal = document.getElementById("eventModal");
    const addModalTitle = document.getElementById("modalDateTitle");
    const eventInput = document.getElementById("eventInput");
    const saveBtn = document.getElementById("saveEventBtn");
    const cancelAddBtn = document.getElementById("cancelBtn");
    const closeAddBtn = document.getElementById("closeAddBtn");
    
    const viewModal = document.getElementById("viewEventModal");
    const viewDateTitle = document.getElementById("viewDateTitle");
    const eventsListWrapper = document.getElementById("eventsListWrapper");
    const closeViewBtn = document.getElementById("closeViewBtn");
    const addMoreBtn = document.getElementById("addMoreBtn");
    const closeViewXBtn = document.getElementById("closeViewXBtn");

    let currentDate = new Date();
    let activeMonth = currentDate.getMonth();
    let activeYear = currentDate.getFullYear();
    let eventsMap = {};
    let selectedDateStr = null;

    async function loadEventsFromBackend() {
        try {
            const response = await fetch(`${API_URL}/events`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const serverData = await response.json();
                eventsMap = {};

                serverData.forEach((event) => {
                    let rawDate = event.starts_at || event.created_at;
                    if (rawDate) {
                        const dateKey = rawDate.substring(0, 10);
                        if (!eventsMap[dateKey]) {
                            eventsMap[dateKey] = [];
                        }
                        eventsMap[dateKey].push(event);
                    }
                });
                renderCalendar(activeYear, activeMonth);
            }
        } catch (error) {
            console.error(error);
        }
    }

    function renderCalendar(year, month) {
        if (!daysContainer) return;

        daysContainer.innerHTML = "";
        const monthName = new Date(year, month).toLocaleString("ru-RU", { month: "long" });
        if (monthYearLabel) monthYearLabel.textContent = `${monthName} ${year}`;

        let firstDay = new Date(year, month, 1).getDay();
        let adjustDay = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        for (let i = 0; i < adjustDay; i++) {
            const span = document.createElement("span");
            span.textContent = daysInPrevMonth - adjustDay + i + 1;
            span.classList.add("prev-month");
            daysContainer.appendChild(span);
        }

        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const span = document.createElement("span");
            span.textContent = i;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                span.classList.add("today");
            }

            if (eventsMap[dateStr] && eventsMap[dateStr].length > 0) {
                span.classList.add("has-event");
            }

            span.addEventListener("click", () => {
                selectedDateStr = dateStr;
                if (eventsMap[dateStr] && eventsMap[dateStr].length > 0) {
                    openViewModal(dateStr, eventsMap[dateStr]);
                } else {
                    openAddModal(dateStr);
                }
            });

            daysContainer.appendChild(span);
        }

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

    function openAddModal(dateStr) {
        if (!addModal) return;
        addModalTitle.textContent = `Добавить на ${dateStr}`;
        eventInput.value = "";
        addModal.classList.add("active");
    }

    function closeAddModal() {
        if (addModal) addModal.classList.remove("active");
    }

    function openViewModal(dateStr, list) {
        if (!viewModal) return;
        viewDateTitle.textContent = `События: ${dateStr}`;
        eventsListWrapper.innerHTML = "";

        list.forEach((ev) => {
            const card = document.createElement("div");
            card.style.background = "#f8f9fa";
            card.style.borderLeft = "4px solid #0056A6";
            card.style.padding = "10px";
            card.style.marginBottom = "10px";
            card.style.borderRadius = "4px";

            let timeStr = "--:--";
            if (ev.starts_at && ev.starts_at.length > 15) {
                timeStr = ev.starts_at.substring(11, 16);
            }

            card.innerHTML = `
                <div style="font-size:12px; color:#0056A6; font-weight:bold;">${timeStr}</div>
                <h4 style="margin:0 0 5px; color:#333;">${ev.title || "Без названия"}</h4>
                <p style="margin:0; font-size:13px; color:#666;">${ev.description || ""}</p>
            `;
            eventsListWrapper.appendChild(card);
        });

        viewModal.classList.add("active");
    }

    function closeViewModal() {
        if (viewModal) viewModal.classList.remove("active");
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
                    starts_at: selectedDateStr + " 11:00:00",
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
                    closeAddModal();
                    await loadEventsFromBackend();
                } else {
                    alert("Ошибка сохранения");
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

    if (saveBtn) saveBtn.addEventListener("click", saveEvent);
    if (cancelAddBtn) cancelAddBtn.addEventListener("click", closeAddModal);
    if (closeAddBtn) closeAddBtn.addEventListener("click", closeAddModal);
    if (addModal) {
        addModal.addEventListener("click", (e) => {
            if (e.target === addModal) closeAddModal();
        });
    }

    if (viewModal) {
        if (closeViewBtn) closeViewBtn.addEventListener("click", closeViewModal);
        if (closeViewXBtn) closeViewXBtn.addEventListener("click", closeViewModal);
        if (addMoreBtn) {
            addMoreBtn.addEventListener("click", () => {
                closeViewModal();
                openAddModal(selectedDateStr);
            });
        }
        viewModal.addEventListener("click", (e) => {
            if (e.target === viewModal) closeViewModal();
        });
    }

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

    if (daysContainer) {
        renderCalendar(activeYear, activeMonth);
        loadEventsFromBackend();
    }

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
        if (!feedContainer || !template) return;
        feedContainer.innerHTML = "";

        postsData.forEach((post) => {
            if (filter !== "all" && post.category !== filter) return;

            const clone = template.content.cloneNode(true);
            clone.querySelector(".post-author").textContent = post.author;
            clone.querySelector(".post-date").textContent = post.date;
            clone.querySelector(".post-text").textContent = post.text;

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

            const commentBtn = clone.querySelector(".comment-btn");
            const commentCounter = clone.querySelector(".comments-count");
            const commentsSection = clone.querySelector(".comments-section");
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
                    commentsSection.style.display === "none" ? "block" : "none";
            });

            feedContainer.appendChild(clone);
        });
    }

    if (filterTabs.length > 0) {
        filterTabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                filterTabs.forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                renderFeed(tab.dataset.filter);
            });
        });
        renderFeed("all");
    }

    const toggleBtn = document.querySelector(".btn-more");
    const card = document.querySelector(".lectures-card");
    if (toggleBtn && card) {
        toggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            card.classList.toggle("collapsed");
        });
    }

    loadNotifications();
    setInterval(loadNotifications, 60000);
});