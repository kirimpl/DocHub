document.addEventListener("DOMContentLoaded", async () => {
    const API_URL = "http://localhost:8000/api";
    const REVERB_HOST = "localhost";
    const REVERB_PORT = 8080;
    const REVERB_APP_KEY = "my_app_key";

    const token = localStorage.getItem("auth_token");

    if (!token) {
        window.location.href = "/";
        return;
    }

    const postsApi = {
        async uploadMedia(file) {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`${API_URL}/media`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
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

    let currentScope = "org";
    let selectedFile = null;

    window.setPostType = (element, type) => {
        document
            .querySelectorAll(".cp-tab")
            .forEach((el) => el.classList.remove("active"));
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
            loadFeed();
        } catch (error) {
            console.error("Ошибка:", error);
            alert("Не удалось опубликовать пост");
        }
    };

    const feedContainer = document.getElementById("newsFeed");
    const template = document.getElementById("postTemplate");
    const filterTabs = document.querySelectorAll(".filter-tab");

    async function loadFeed(filter = "all") {
        if (!feedContainer || !template) return;

        try {
            const response = await postsApi.getPosts();
            const posts = Array.isArray(response)
                ? response
                : response.data || [];
            renderFeed(posts, filter);
        } catch (e) {
            console.error(e);
        }
    }

    function renderFeed(posts, filter) {
        feedContainer.innerHTML = "";

        if (posts.length === 0) {
            feedContainer.innerHTML =
                '<p style="text-align:center; padding:20px; color:#999;">Новостей пока нет</p>';
            return;
        }

        posts.forEach((post) => {
            if (filter === "organization" && !post.is_global) return;
            if (filter === "department" && post.is_global) return;

            const clone = template.content.cloneNode(true);

            const authorId =
                post.user_id ||
                post.author_id ||
                (post.author ? post.author.id : null);
            const authorName = post.author
                ? post.author.name || "ID " + authorId
                : "Неизвестный";

            clone.querySelector(".post-author").textContent = authorName;

            const dateObj = new Date(post.created_at);
            clone.querySelector(".post-date").textContent =
                dateObj.toLocaleString("ru-RU");
            clone.querySelector(".post-text").textContent = post.content;

            if (currentUserId && authorId == currentUserId) {
                const deleteBtn = document.createElement("button");
                deleteBtn.innerHTML = "🗑️";
                deleteBtn.title = "Удалить пост";
                deleteBtn.style.cssText =
                    "border:none; background:none; cursor:pointer; font-size:16px; margin-left: 10px; color: #dc3545;";

                const headerMeta =
                    clone.querySelector(".post-meta") ||
                    clone.querySelector(".post-header");
                if (headerMeta) {
                    headerMeta.appendChild(deleteBtn);
                } else {
                    clone.querySelector(".post-author").appendChild(deleteBtn);
                }

                deleteBtn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    if (confirm("Вы действительно хотите удалить этот пост?")) {
                        try {
                            await postsApi.deletePost(post.id);
                            loadFeed(filter);
                        } catch (err) {
                            console.error(err);
                            alert("Ошибка удаления");
                        }
                    }
                });
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
                } catch (e) {
                    console.error(e);
                }
            });

            const commentCounter = clone.querySelector(".comments-count");
            const comments = post.comments || [];
            commentCounter.textContent = comments.length;

            feedContainer.appendChild(clone);
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
        badge.style.cssText =
            "position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; background: red; border-radius: 50%; display: none; border: 2px solid #fff;";
        notifBtn.appendChild(badge);
    }

    async function initUser() {
        try {
            const res = await fetch(`${API_URL}/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
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
        } catch (e) {
            console.error(e);
        }
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

        window.Echo.private(`App.Models.User.${currentUserId}`).notification(
            (notification) => {
                loadNotifications();
            }
        );
    }

    async function loadNotifications() {
        try {
            const response = await fetch(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                currentNotifications = Array.isArray(data)
                    ? data
                    : data.data || [];
                renderNotifications(currentNotifications);
            }
        } catch (error) {
            console.error(error);
        }
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

            item.innerHTML = `
                <div class="notify-content" style="padding: 10px; font-size: 13px;">
                    ${text}
                </div>
            `;

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
        } catch (error) {
            console.error(error);
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
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
    }

    if (notifBtn) {
        notifBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (settingsPopup) settingsPopup.classList.remove("active");
            notifPopup.classList.toggle("active");
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
        if (
            notifPopup &&
            notifPopup.classList.contains("active") &&
            !notifPopup.contains(e.target) &&
            e.target !== notifBtn
        ) {
            notifPopup.classList.remove("active");
        }
        if (
            settingsPopup &&
            settingsPopup.classList.contains("active") &&
            !settingsPopup.contains(e.target) &&
            e.target !== settingsBtn
        ) {
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
            const response = await fetch(`${API_URL}/events`, {
                headers: { Authorization: `Bearer ${token}` },
            });

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
        } catch (error) {
            console.error(error);
        }
    }

    function renderCalendar(year, month) {
        if (!daysContainer) return;

        daysContainer.innerHTML = "";
        const monthName = new Date(year, month).toLocaleString("ru-RU", {
            month: "long",
        });
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
    }

    function openAddModal(dateStr) {
        if (!addModal) return;
        const titleEl = document.getElementById("modalDateTitle");
        if (titleEl) titleEl.textContent = `Добавить на ${dateStr}`;
        eventInput.value = "";
        addModal.classList.add("active");
    }

    function closeAddModal() {
        if (addModal) addModal.classList.remove("active");
    }

    function openViewModal(dateStr, list) {
        if (!viewModal) return;
        const titleEl = document.getElementById("viewDateTitle");
        if (titleEl) titleEl.textContent = `События: ${dateStr}`;
        eventsListWrapper.innerHTML = "";

        list.forEach((ev) => {
            const card = document.createElement("div");
            Object.assign(card.style, {
                background: "#f8f9fa",
                borderLeft: "4px solid #0056A6",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "4px",
            });

            let timeStr =
                ev.starts_at && ev.starts_at.length > 15
                    ? ev.starts_at.substring(11, 16)
                    : "--:--";
            card.innerHTML = `
                <div style="font-size:12px; color:#0056A6; font-weight:bold;">${timeStr}</div>
                <h4 style="margin:0 0 5px; color:#333;">${
                    ev.title || "Без названия"
                }</h4>
                <p style="margin:0; font-size:13px; color:#666;">${
                    ev.description || ""
                }</p>
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
                saveBtn.textContent = "Сохранить";
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
        if (closeViewBtn)
            closeViewBtn.addEventListener("click", closeViewModal);
        if (closeViewXBtn)
            closeViewXBtn.addEventListener("click", closeViewModal);
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

    initUser();
    if (daysContainer) {
        renderCalendar(activeYear, activeMonth);
        loadEventsFromBackend();
    }
});
