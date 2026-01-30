document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "http://127.0.0.1:8000/api";
    const REVERB_HOST = "localhost";
    const REVERB_PORT = 8080;
    const REVERB_APP_KEY = "my_app_key";

    const token = localStorage.getItem("auth_token");

    if (!token) {
        window.location.href = "/";
        return;
    }

    // --- API Methods ---
    const postsApi = {
        async uploadMedia(file) {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`${API_URL}/media`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json"
                },
                body: formData,
            });
            if (!res.ok) throw new Error("Ошибка загрузки файла");
            return await res.json();
        },

        async createPost(data) {
            const res = await fetch(`${API_URL}/posts`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Ошибка создания поста");
            return await res.json();
        },

        async getPosts() {
            const res = await fetch(`${API_URL}/posts`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Ошибка получения постов");
            return await res.json();
        },

        async deletePost(id) {
            const res = await fetch(`${API_URL}/posts/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Ошибка удаления поста");
            return true;
        },

        async likePost(id) {
            return await fetch(`${API_URL}/posts/${id}/like`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        },

        async unlikePost(id) {
            return await fetch(`${API_URL}/posts/${id}/unlike`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        },

        // Новый метод для "Поделиться"
        async sharePost(id, targetId) {
            const res = await fetch(`${API_URL}/posts/${id}/share`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({
                    target_type: 'user', // Пока жестко user, можно доработать
                    target_id: targetId,
                    body: 'Shared post'
                })
            });
            if (!res.ok) throw new Error("Ошибка шаринга");
            return await res.json();
        },

        async getComments(postId) {
            const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return await res.json();
        },

        async addComment(postId, content) {
            return await fetch(`${API_URL}/posts/${postId}/comments`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content }),
            });
        },
    };

    // --- State & Handlers ---
    let currentScope = "org";
    let selectedFile = null;

    window.setPostType = (element, type) => {
        document.querySelectorAll(".cp-tab").forEach((el) => el.classList.remove("active"));
        element.classList.add("active");
        currentScope = type;
    };

    window.handleFileSelect = (input) => {
        if (input.files && input.files[0]) {
            selectedFile = input.files[0];
            const indicator = document.getElementById("file-indicator");
            if (indicator) indicator.style.display = "block";
            alert(`Файл "${selectedFile.name}" прикреплен!`);
        }
    };

    window.handlePublish = async () => {
        const textInput = document.getElementById("postText");
        const content = textInput.value;

        if (!content && !selectedFile) {
            alert("Введите текст или прикрепите фото");
            return;
        }

        const btn = document.querySelector('.cp-send-btn') || document.querySelector('button[onclick="handlePublish()"]');
        if (btn) btn.disabled = true;

        try {
            let imageUrl = null;

            if (selectedFile) {
                const uploadRes = await postsApi.uploadMedia(selectedFile);
                imageUrl = uploadRes.url || uploadRes.data?.url;
            }

            let isGlobal = false;
            let departmentTags = [];

            if (currentScope === "org") {
                isGlobal = true;
                departmentTags = ["Хирургия", "Терапия"];
            } else if (currentScope === "dept") {
                isGlobal = false;
                departmentTags = ["Хирургия"];
            } else {
                departmentTags = ["Общее"];
            }

            const postData = {
                content: content,
                image: imageUrl,
                is_global: isGlobal,
                is_public: true,
                department_tags: departmentTags,
            };

            await postsApi.createPost(postData);

            textInput.value = "";
            selectedFile = null;
            const hiddenInput = document.getElementById("hiddenFileInput");
            if (hiddenInput) hiddenInput.value = "";
            const indicator = document.getElementById("file-indicator");
            if (indicator) indicator.style.display = "none";

            alert("Пост опубликован!");

            const allTab = document.querySelector('.filter-tab[data-filter="all"]');
            if (allTab) allTab.click();
            else loadFeed("all");

        } catch (error) {
            console.error("Ошибка при публикации:", error);
            alert("Не удалось опубликовать пост");
        } finally {
            if (btn) btn.disabled = false;
        }
    };

    // --- Feed Logic ---
    const feedContainer = document.getElementById("newsFeed");
    const template = document.getElementById("postTemplate");
    const filterTabs = document.querySelectorAll(".filter-tab");

    async function loadFeed(filter = "all") {
        if (!feedContainer || !template) return;

        try {
            const response = await postsApi.getPosts();
            const posts = Array.isArray(response) ? response : response.data || [];
            renderFeed(posts, filter);
        } catch (e) {
            console.error(e);
        }
    }

    function renderFeed(posts, filter) {
        feedContainer.innerHTML = "";

        if (posts.length === 0) {
            feedContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">Новостей пока нет</p>';
            return;
        }

        posts.forEach((post) => {
            if (filter === "organization" && !post.is_global) return;
            if (filter === "department" && post.is_global) return;

            const clone = template.content.cloneNode(true);

            // Автор
            const authorId = post.user_id || post.author_id || (post.author ? post.author.id : null);
            const authorName = post.author ? (post.author.name || "ID " + authorId) : "Неизвестный";
            clone.querySelector(".post-author").textContent = authorName;

            // Дата и текст
            const dateObj = new Date(post.created_at);
            clone.querySelector(".post-date").textContent = dateObj.toLocaleString("ru-RU");
            clone.querySelector(".post-text").textContent = post.content;

            // ==========================================================
            // ЛОГИКА МЕНЮ "РЕДАКТИРОВАНИЕ/УДАЛЕНИЕ" (Ваш SVG для настроек)
            // ==========================================================
            if (currentUserId && authorId == currentUserId) {
                const header = clone.querySelector(".post-header");
                if (header) {
                    // Контейнер для меню
                    const menuContainer = document.createElement("div");
                    menuContainer.className = "post-options-container";

                    // Кнопка "Редактировать/Опции"
                    const editBtn = document.createElement("button");
                    editBtn.className = "btn-options";
                    editBtn.title = "Управление постом";

                    // ВСТАВЬТЕ ВАШ SVG ДЛЯ РЕДАКТИРОВАНИЯ/МЕНЮ НИЖЕ ВНУТРИ innerHTML
                    editBtn.innerHTML = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                        </svg>
                    `;

                    // Выпадающий список
                    const dropdown = document.createElement("div");
                    dropdown.className = "options-dropdown";

                    // Пункт 1: Редактировать (заглушка)
                    const editItem = document.createElement("button");
                    editItem.className = "dropdown-item";
                    editItem.innerHTML = "✏️ Редактировать";
                    editItem.onclick = (e) => {
                        e.stopPropagation();
                        alert("Функция редактирования в разработке");
                    };

                    const deleteItem = document.createElement("button");
                    deleteItem.className = "dropdown-item delete";
                    deleteItem.innerHTML = "🗑️ Удалить";
                    deleteItem.onclick = async (e) => {
                        e.stopPropagation();
                        if (confirm("Вы действительно хотите удалить этот пост?")) {
                            try {
                                await postsApi.deletePost(post.id);
                                loadFeed(filter);
                            } catch (err) {
                                alert("Ошибка удаления");
                            }
                        }
                    };

                    dropdown.appendChild(editItem);
                    dropdown.appendChild(deleteItem);
                    menuContainer.appendChild(editBtn);
                    menuContainer.appendChild(dropdown);
                    header.appendChild(menuContainer);

                    editBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        document.querySelectorAll('.options-dropdown').forEach(d => {
                            if (d !== dropdown) d.classList.remove('active');
                        });
                        dropdown.classList.toggle("active");
                    });
                }
            }

            const gallery = clone.querySelector(".post-gallery");
            if (post.image) {
                const imgDiv = document.createElement("div");
                imgDiv.classList.add("gallery-item");
                imgDiv.style.backgroundImage = `url('${post.image}')`;
                gallery.appendChild(imgDiv);
            } else {
                gallery.style.display = "none";
            }

            const likeBtn = clone.querySelector(".like-btn");
            const likeCounter = clone.querySelector(".likes-count");
            let likesCount = post.likes_count || 0;
            let isLiked = post.is_liked || false;

            likeCounter.textContent = likesCount;
            if (isLiked) likeBtn.classList.add("active");

            likeBtn.addEventListener("click", async () => {
                try {
                    if (isLiked) {
                        await postsApi.unlikePost(post.id);
                        likesCount--;
                        likeBtn.classList.remove("active");
                    } else {
                        await postsApi.likePost(post.id);
                        likesCount++;
                        likeBtn.classList.add("active");
                    }
                    isLiked = !isLiked;
                    likeCounter.textContent = likesCount;
                } catch (e) { console.error(e); }
            });

            const commentCounter = clone.querySelector(".comments-count");
            const comments = post.comments || [];
            commentCounter.textContent = comments.length;

            const actionsBlock = clone.querySelector(".post-footer .actions") || clone.querySelector(".post-footer");
            if (actionsBlock) {
                const shareBtn = document.createElement("button");
                shareBtn.className = "btn-share";

                shareBtn.innerHTML = `
                    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 20C14.1667 20 13.4583 19.7083 12.875 19.125C12.2917 18.5417 12 17.8333 12 17C12 16.9 12.025 16.6667 12.075 16.3L5.05 12.2C4.78333 12.45 4.475 12.646 4.125 12.788C3.775 12.93 3.4 13.0007 3 13C2.16667 13 1.45833 12.7083 0.875 12.125C0.291667 11.5417 0 10.8333 0 10C0 9.16667 0.291667 8.45833 0.875 7.875C1.45833 7.29167 2.16667 7 3 7C3.4 7 3.775 7.071 4.125 7.213C4.475 7.355 4.78333 7.55067 5.05 7.8L12.075 3.7C12.0417 3.58333 12.021 3.471 12.013 3.363C12.005 3.255 12.0007 3.134 12 3C12 2.16667 12.2917 1.45833 12.875 0.875C13.4583 0.291667 14.1667 0 15 0C15.8333 0 16.5417 0.291667 17.125 0.875C17.7083 1.45833 18 2.16667 18 3C18 3.83333 17.7083 4.54167 17.125 5.125C16.5417 5.70833 15.8333 6 15 6C14.6 6 14.225 5.929 13.875 5.787C13.525 5.645 13.2167 5.44933 12.95 5.2L5.925 9.3C5.95833 9.41667 5.97933 9.52933 5.988 9.638C5.99667 9.74667 6.00067 9.86733 6 10C5.99933 10.1327 5.99533 10.2537 5.988 10.363C5.98067 10.4723 5.95967 10.5847 5.925 10.7L12.95 14.8C13.2167 14.55 13.525 14.3543 13.875 14.213C14.225 14.0717 14.6 14.0007 15 14C15.8333 14 16.5417 14.2917 17.125 14.875C17.7083 15.4583 18 16.1667 18 17C18 17.8333 17.7083 18.5417 17.125 19.125C16.5417 19.7083 15.8333 20 15 20Z" fill="#0056A6"/>
</svg>

                    Поделиться
                `;

                shareBtn.onclick = async () => {
                    const targetId = prompt("Введите ID пользователя, которому отправить пост:", "");
                    if (targetId) {
                        try {
                            await postsApi.sharePost(post.id, targetId);
                            alert("Пост отправлен!");
                        } catch (e) {
                            alert("Ошибка отправки");
                        }
                    }
                };

                actionsBlock.appendChild(shareBtn);
            }

            feedContainer.appendChild(clone);
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.options-dropdown').forEach(d => d.classList.remove('active'));
        });
    }

    if (filterTabs.length > 0) {
        filterTabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                filterTabs.forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                loadFeed(tab.dataset.filter);
            });
        });
    }

    const notifBtn = document.getElementById("h_btn1");
    const notifPopup = document.getElementById("notifPopup");
    const notifList = document.getElementById("notifList");
    const settingsBtn = document.getElementById("h_btn2");
    const settingsPopup = document.getElementById("settingsPopup");
    const logoutBtn = document.querySelector(".text-danger");

    let currentNotifications = [];
    let currentUserId = null;
    let badge = notifBtn.querySelector("#notifBadge");

    if (!badge) {
        badge = document.createElement("span");
        badge.id = "notifBadge";
        badge.style.cssText = "position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; background: red; border-radius: 50%; display: none; border: 2px solid #fff;";
        notifBtn.appendChild(badge);
    }

    async function initUser() {
        try {
            const res = await fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const userData = data.data || data;
                currentUserId = userData.id;

                const nameEl = document.getElementById("profile-name");
                const avatarEl = document.getElementById("profile-avatar");
                if (nameEl) nameEl.textContent = userData.name;
                if (avatarEl && userData.avatar) avatarEl.src = userData.avatar;

                initRealtime();
                loadNotifications();
                loadFeed();
            }
        } catch (e) { console.error(e); }
    }

    function initRealtime() {
        if (!window.Echo) return;
        window.Echo = new Echo({
            broadcaster: "reverb",
            key: REVERB_APP_KEY,
            wsHost: REVERB_HOST,
            wsPort: REVERB_PORT,
            wssPort: REVERB_PORT,
            forceTLS: false,
            enabledTransports: ["ws", "wss"],
            authEndpoint: `${API_URL.replace("/api", "")}/broadcasting/auth`,
            auth: {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            },
        });
        window.Echo.private(`App.Models.User.${currentUserId}`).notification(() => loadNotifications());
    }

    async function loadNotifications() {
        try {
            const response = await fetch(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                currentNotifications = Array.isArray(data) ? data : data.data || [];
                renderNotifications(currentNotifications);
            }
        } catch (error) { console.error(error); }
    }

    function renderNotifications(data) {
        if (!notifList) return;
        notifList.innerHTML = "";
        if (data.length === 0) {
            notifList.innerHTML = `<div style="padding:15px; text-align:center; color:#999; font-size:13px;">Нет новых уведомлений</div>`;
            badge.style.display = "none";
            return;
        }
        const hasUnread = data.some((n) => !n.read_at);
        badge.style.display = hasUnread ? "block" : "none";
        data.forEach((n) => {
            const item = document.createElement("div");
            item.className = "notify-item";
            if (!n.read_at) {
                item.style.backgroundColor = "#f0f8ff";
                item.style.cursor = "pointer";
            }
            const payload = n.data || n;
            const text = payload.message || payload.body || "Новое уведомление";
            item.innerHTML = `<div class="notify-content" style="padding: 10px; font-size: 13px;">${text}</div>`;
            item.addEventListener("click", () => {
                if (!n.read_at) markAsRead(n.id, item);
            });
            notifList.appendChild(item);
        });
    }

    async function markAsRead(id, element) {
        element.style.backgroundColor = "transparent";
        element.style.cursor = "default";
        try {
            await fetch(`${API_URL}/notifications/${id}/read`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            loadNotifications();
        } catch (error) { console.error(error); }
    }

    if (logoutBtn) logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_URL}/security/logout-all`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } finally {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_info");
            window.location.href = "/";
        }
    });

    if (notifBtn) notifBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (settingsPopup) settingsPopup.classList.remove("active");
        notifPopup.classList.toggle("active");
    });

    if (settingsBtn) settingsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (notifPopup) notifPopup.classList.remove("active");
        settingsPopup.classList.toggle("active");
    });

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
    const eventInput = document.getElementById("eventInput");
    const saveBtn = document.getElementById("saveEventBtn");
    const cancelAddBtn = document.getElementById("cancelBtn");
    const closeAddBtn = document.getElementById("closeAddBtn");
    const viewModal = document.getElementById("viewEventModal");
    const eventsListWrapper = document.getElementById("eventsListWrapper");
    const closeViewBtn = document.getElementById("closeViewBtn");
    const closeViewXBtn = document.getElementById("closeViewXBtn");
    const addMoreBtn = document.getElementById("addMoreBtn");

    let currentDate = new Date();
    let activeMonth = currentDate.getMonth();
    let activeYear = currentDate.getFullYear();
    let eventsMap = {};
    let selectedDateStr = null;

    async function loadEventsFromBackend() {
        try {
            const response = await fetch(`${API_URL}/events`, { headers: { Authorization: `Bearer ${token}` } });
            if (response.ok) {
                const serverData = await response.json();
                eventsMap = {};
                serverData.forEach((event) => {
                    let rawDate = event.starts_at || event.created_at;
                    if (rawDate) {
                        const dateKey = rawDate.substring(0, 10);
                        if (!eventsMap[dateKey]) eventsMap[dateKey] = [];
                        eventsMap[dateKey].push(event);
                    }
                });
                renderCalendar(activeYear, activeMonth);
            }
        } catch (error) { console.error(error); }
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
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) span.classList.add("today");
            if (eventsMap[dateStr] && eventsMap[dateStr].length > 0) span.classList.add("has-event");
            span.addEventListener("click", () => {
                selectedDateStr = dateStr;
                if (eventsMap[dateStr] && eventsMap[dateStr].length > 0) openViewModal(dateStr, eventsMap[dateStr]);
                else openAddModal(dateStr);
            });
            daysContainer.appendChild(span);
        }
    }

    function openAddModal(dateStr) {
        if (!addModal) return;
        const titleEl = document.getElementById("modalDateTitle");
        if (titleEl) titleEl.textContent = `Добавить на ${dateStr}`;
        eventInput.value = "";
        addModal.classList.add("active");
    }
    function closeAddModal() { if (addModal) addModal.classList.remove("active"); }

    function openViewModal(dateStr, list) {
        if (!viewModal) return;
        const titleEl = document.getElementById("viewDateTitle");
        if (titleEl) titleEl.textContent = `События: ${dateStr}`;
        eventsListWrapper.innerHTML = "";
        list.forEach((ev) => {
            const card = document.createElement("div");
            Object.assign(card.style, { background: "#f8f9fa", borderLeft: "4px solid #0056A6", padding: "10px", marginBottom: "10px", borderRadius: "4px" });
            let timeStr = ev.starts_at && ev.starts_at.length > 15 ? ev.starts_at.substring(11, 16) : "--:--";
            card.innerHTML = `<div style="font-size:12px; color:#0056A6; font-weight:bold;">${timeStr}</div><h4 style="margin:0 0 5px; color:#333;">${ev.title || "Без названия"}</h4><p style="margin:0; font-size:13px; color:#666;">${ev.description || ""}</p>`;
            eventsListWrapper.appendChild(card);
        });
        viewModal.classList.add("active");
    }
    function closeViewModal() { if (viewModal) viewModal.classList.remove("active"); }

    async function saveEvent() {
        const title = eventInput.value.trim();
        if (selectedDateStr && title !== "") {
            saveBtn.textContent = "Сохранение...";
            saveBtn.disabled = true;
            try {
                const payload = { title: title, starts_at: selectedDateStr + " 11:00:00", ends_at: selectedDateStr + " 12:00:00", description: "Создано вручную", is_global: false };
                const response = await fetch(`${API_URL}/events`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (response.ok) { closeAddModal(); await loadEventsFromBackend(); }
                else { alert("Ошибка сохранения"); }
            } catch (error) { console.error(error); alert("Ошибка соединения"); }
            finally { saveBtn.textContent = "Сохранить"; saveBtn.disabled = false; }
        }
    }

    if (saveBtn) saveBtn.addEventListener("click", saveEvent);
    if (cancelAddBtn) cancelAddBtn.addEventListener("click", closeAddModal);
    if (closeAddBtn) closeAddBtn.addEventListener("click", closeAddModal);
    if (addModal) addModal.addEventListener("click", (e) => { if (e.target === addModal) closeAddModal(); });
    if (viewModal) {
        if (closeViewBtn) closeViewBtn.addEventListener("click", closeViewModal);
        if (closeViewXBtn) closeViewXBtn.addEventListener("click", closeViewModal);
        if (addMoreBtn) addMoreBtn.addEventListener("click", () => { closeViewModal(); openAddModal(selectedDateStr); });
        viewModal.addEventListener("click", (e) => { if (e.target === viewModal) closeViewModal(); });
    }
    if (prevBtn) prevBtn.addEventListener("click", () => {
        activeMonth--;
        if (activeMonth < 0) { activeMonth = 11; activeYear--; }
        renderCalendar(activeYear, activeMonth);
    });
    if (nextBtn) nextBtn.addEventListener("click", () => {
        activeMonth++;
        if (activeMonth > 11) { activeMonth = 0; activeYear++; }
        renderCalendar(activeYear, activeMonth);
    });

    const toggleBtn = document.querySelector(".btn-more");
    const card = document.querySelector(".lectures-card");
    if (toggleBtn && card) {
        toggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            card.classList.toggle("collapsed");
        });
    }

    initUser();
    if (daysContainer) {
        renderCalendar(activeYear, activeMonth);
        loadEventsFromBackend();
    }
});