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

    const postsApi = {
        async uploadMedia(file) {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch(`${API_URL}/media`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
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
            const res = await fetch(`${API_URL}/posts?t=${new Date().getTime()}`, {
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

        async sharePost(id, targetId) {
            const res = await fetch(`${API_URL}/posts/${id}/share`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({ target_type: 'user', target_id: targetId, body: 'Shared post' })
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
            const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({ body: content }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Ошибка отправки");
            }
            return await res.json();
        },
    };

    let currentScope = "org";
    let selectedFile = null;
    let lastFeedData = "";
    let currentFilter = "all";

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

            lastFeedData = "";
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

    const feedContainer = document.getElementById("newsFeed");
    const template = document.getElementById("postTemplate");
    const filterTabs = document.querySelectorAll(".filter-tab");

    async function loadFeed(filter = "all") {
        if (!feedContainer || !template) return;
        currentFilter = filter;

        try {
            const response = await postsApi.getPosts();
            const posts = Array.isArray(response) ? response : response.data || [];

            const filteredPosts = posts.filter(post => {
                if (filter === "organization" && !post.is_global) return false;
                if (filter === "department" && post.is_global) return false;
                return true;
            });

            const newFeedData = JSON.stringify(filteredPosts);
            if (newFeedData === lastFeedData) return;

            lastFeedData = newFeedData;
            renderFeed(filteredPosts);

        } catch (e) {
            console.error(e);
        }
    }

    function renderFeed(posts) {
        feedContainer.innerHTML = "";

        if (posts.length === 0) {
            feedContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">Новостей пока нет</p>';
            return;
        }

        posts.forEach((post) => {
            try {
                const clone = template.content.cloneNode(true);

                const authorId = post.user_id || post.author_id || (post.author ? post.author.id : null);
                const authorName = post.author ? (post.author.name || "ID " + authorId) : "Неизвестный";
                const avatarSrc = post.author && post.author.avatar ? post.author.avatar : null;
                const isAuthor = (currentUserId && authorId == currentUserId);

                const headerEl = clone.querySelector(".post-header");
                if (headerEl) {
                    headerEl.innerHTML = `
                        <div style="display:flex; align-items:center; width:100%;">
                            <div style="width:50px; height:50px; border-radius:50%; background: #ccc url('${avatarSrc || ''}') center/cover no-repeat; box-shadow: 0 4px 10px rgba(0,0,0,0.05);"></div>
                            
                            <div class="post-author-info" style="flex-grow:1;">
                                <h4 class="post-author">${authorName}</h4>
                                <span class="post-date">${new Date(post.created_at).toLocaleString("ru-RU", { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            
                            <div class="header-actions">
                                ${isAuthor ? `
                                <div class="post-options-container">
                                    <button class="btn-header-action btn-edit-menu" title="Редактировать">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <div class="options-dropdown">
                                        <button class="dropdown-item delete">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            Удалить пост
                                        </button>
                                    </div>
                                </div>
                                ` : ''}

                                <button class="btn-header-action btn-share-header" title="Поделиться">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                </button>
                            </div>
                        </div>
                    `;

                    const shareBtn = headerEl.querySelector(".btn-share-header");
                    if (shareBtn) {
                        shareBtn.addEventListener("click", async (e) => {
                            e.stopPropagation();
                            const targetId = prompt("Введите ID получателя:", "");
                            if (targetId) {
                                try { await postsApi.sharePost(post.id, targetId); alert("Отправлено!"); } catch (err) { alert("Ошибка"); }
                            }
                        });
                    }

                    if (isAuthor) {
                        const editBtn = headerEl.querySelector(".btn-edit-menu");
                        const dropdown = headerEl.querySelector(".options-dropdown");
                        const deleteBtn = headerEl.querySelector(".delete");

                        if (editBtn && dropdown) {
                            editBtn.addEventListener("click", (e) => {
                                e.stopPropagation();
                                document.querySelectorAll('.options-dropdown').forEach(d => {
                                    if (d !== dropdown) d.classList.remove('active');
                                });
                                dropdown.classList.toggle('active');
                            });
                        }

                        if (deleteBtn) {
                            deleteBtn.addEventListener("click", async (e) => {
                                e.stopPropagation();
                                if (confirm("Удалить этот пост?")) {
                                    try {
                                        await postsApi.deletePost(post.id);
                                        lastFeedData = "";
                                        loadFeed(currentFilter);
                                    } catch (err) { alert("Ошибка удаления"); }
                                }
                            });
                        }
                    }
                } else {
                    const authorEl = clone.querySelector(".post-author");
                    if (authorEl) authorEl.textContent = authorName;
                }

                const textEl = clone.querySelector(".post-text");
                if (textEl) textEl.textContent = post.body || post.content || "";

                const gallery = clone.querySelector(".post-gallery");
                if (gallery) {
                    if (post.image) {
                        const imgDiv = document.createElement("div");
                        imgDiv.classList.add("gallery-item");
                        imgDiv.style.backgroundImage = `url('${post.image}')`;
                        gallery.appendChild(imgDiv);
                    } else {
                        gallery.style.display = "none";
                    }
                }

                const likeBtn = clone.querySelector(".like-btn");
                const likeCounter = clone.querySelector(".likes-count");
                let likesCount = post.likes_count || 0;
                let isLiked = post.is_liked || false;

                if (likeCounter) likeCounter.textContent = likesCount;
                if (likeBtn && isLiked) likeBtn.classList.add("active");

                if (likeBtn) {
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
                            if (likeCounter) likeCounter.textContent = likesCount;
                        } catch (e) { console.error(e); }
                    });
                }

                const commentBtn = clone.querySelector(".comment-btn");
                const commentsSection = clone.querySelector(".comments-section");
                const commentsList = clone.querySelector(".comments-list");
                const commentCounter = clone.querySelector(".comments-count");
                const commentInput = clone.querySelector(".comment-input");
                const sendCommentBtn = clone.querySelector(".send-comment-btn");

                const initialCount = post.comments_count !== undefined ? post.comments_count : (post.comments ? post.comments.length : 0);
                if (commentCounter) commentCounter.textContent = initialCount;
                if (commentsSection) commentsSection.style.display = "none";

                if (commentBtn && commentsSection) {
                    commentBtn.addEventListener("click", async () => {
                        if (commentsSection.style.display === "none") {
                            commentsSection.style.display = "block";
                            try {
                                const res = await postsApi.getComments(post.id);
                                const commentsData = Array.isArray(res) ? res : (res.data || []);
                                if (commentsList) {
                                    commentsList.innerHTML = "";
                                    if (commentsData.length === 0) commentsList.innerHTML = "<p style='color:#999;font-size:13px;'>Нет комментариев</p>";
                                    else {
                                        commentsData.forEach(c => {
                                            const p = document.createElement("p");
                                            p.className = "comment-row";
                                            const cName = c.user ? c.user.name : "User";
                                            const cText = c.body || c.content || "";
                                            p.innerHTML = `<span class="comment-author">${cName}:</span> ${cText}`;
                                            commentsList.appendChild(p);
                                        });
                                    }
                                }
                            } catch (e) { console.error(e); }
                        } else {
                            commentsSection.style.display = "none";
                        }
                    });
                }

                if (sendCommentBtn && commentInput) {
                    sendCommentBtn.addEventListener("click", async () => {
                        const text = commentInput.value.trim();
                        if (!text) return;
                        try {
                            await postsApi.addComment(post.id, text);
                            if (commentsList) {
                                if (commentsList.innerHTML.includes("Нет комментариев")) commentsList.innerHTML = "";
                                const p = document.createElement("p");
                                p.className = "comment-row";
                                const myName = document.getElementById("profile-name")?.textContent || "Вы";
                                p.innerHTML = `<span class="comment-author">${myName}:</span> ${text}`;
                                commentsList.appendChild(p);
                            }
                            if (commentCounter) commentCounter.textContent = parseInt(commentCounter.textContent || 0) + 1;
                            commentInput.value = "";
                        } catch (e) { alert("Ошибка: " + e.message); }
                    });
                }

                feedContainer.appendChild(clone);

            } catch (postError) {
                console.error("Ошибка при отрисовке поста:", post, postError);
            }
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
                lastFeedData = "";
                loadFeed(tab.dataset.filter);
            });
        });
    }

    let currentUserId = null;
    let currentUser = null;
    let currentNotifications = [];
    const notifBtn = document.getElementById("h_btn1");
    const notifPopup = document.getElementById("notifPopup");
    const notifList = document.getElementById("notifList");
    const settingsBtn = document.getElementById("h_btn2");
    const settingsPopup = document.getElementById("settingsPopup");
    const logoutBtn = document.querySelector(".text-danger");
    let badge = notifBtn.querySelector("#notifBadge");

    if (!badge) {
        badge = document.createElement("span");
        badge.id = "notifBadge";
        badge.style.cssText = "position:absolute;top:-2px;right:-2px;width:10px;height:10px;background:red;border-radius:50%;display:none;border:2px solid #fff;";
        notifBtn.appendChild(badge);
    }

    async function initUser() {
        try {
            const res = await fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const userData = data.data || data;
                currentUserId = userData.id;
                currentUser = userData;

                const nameEl = document.getElementById("profile-name");
                const avatarEl = document.getElementById("profile-avatar");
                if (nameEl) nameEl.textContent = userData.name;
                if (avatarEl && userData.avatar) avatarEl.src = userData.avatar;

                initMeetingControls(userData);
                initRealtime();
                loadNotifications();
            }
        } catch (e) { console.error(e); }
    }

    const createMeetingBtn = document.getElementById("createMeetingBtn");
    const meetingModal = document.getElementById("meetingModal");
    const closeMeetingBtn = document.getElementById("closeMeetingBtn");
    const cancelMeetingBtn = document.getElementById("cancelMeetingBtn");
    const saveMeetingBtn = document.getElementById("saveMeetingBtn");
    const meetingTitleInput = document.getElementById("meetingTitle");
    const meetingDescInput = document.getElementById("meetingDescription");
    const meetingStartsInput = document.getElementById("meetingStartsAt");
    const meetingEndsInput = document.getElementById("meetingEndsAt");
    const meetingAdminFields = document.getElementById("meetingAdminFields");
    const meetingOrgSelect = document.getElementById("meetingOrgSelect");
    const meetingDeptSelect = document.getElementById("meetingDeptSelect");

    let canCreateMeeting = false;
    let isMeetingAdmin = false;
    let meetingDirectoriesLoaded = false;

    function resolveCanCreateMeeting(user) {
        if (!user) return false;
        if (user.global_role === "admin") return true;
        if (user.department_role === "head") return true;
        if (user.organization_role === "chief" || user.organization_role === "deputy") return true;
        return false;
    }

    function normalizeDateTime(value) {
        if (!value) return null;
        const normalized = value.replace("T", " ");
        return normalized.length === 16 ? `${normalized}:00` : normalized;
    }

    async function loadMeetingDirectories() {
        if (meetingDirectoriesLoaded || !meetingOrgSelect || !meetingDeptSelect) return;
        meetingDirectoriesLoaded = true;

        try {
            const orgRes = await fetch(`${API_URL}/directory/organizations`, { headers: { Authorization: `Bearer ${token}` } });
            if (orgRes.ok) {
                const orgData = await orgRes.json();
                const orgs = Array.isArray(orgData) ? orgData : orgData.data || [];
                meetingOrgSelect.innerHTML = "<option value=\"\">Выберите организацию</option>";
                orgs.forEach((org) => {
                    const opt = document.createElement("option");
                    opt.value = org.name || org.title || org;
                    opt.textContent = org.name || org.title || org;
                    meetingOrgSelect.appendChild(opt);
                });
            }
        } catch (e) { console.error(e); }

        try {
            const deptRes = await fetch(`${API_URL}/directory/departments`, { headers: { Authorization: `Bearer ${token}` } });
            if (deptRes.ok) {
                const deptData = await deptRes.json();
                const depts = Array.isArray(deptData) ? deptData : deptData.data || [];
                meetingDeptSelect.innerHTML = "<option value=\"\">Выберите отделение</option>";
                depts.forEach((dept) => {
                    const opt = document.createElement("option");
                    opt.value = dept.name || dept.title || dept;
                    opt.textContent = dept.name || dept.title || dept;
                    meetingDeptSelect.appendChild(opt);
                });
            }
        } catch (e) { console.error(e); }
    }

    function openMeetingModal() {
        if (!meetingModal) return;
        meetingModal.classList.add("active");
        if (meetingTitleInput) meetingTitleInput.value = "";
        if (meetingDescInput) meetingDescInput.value = "";
        if (meetingStartsInput) meetingStartsInput.value = "";
        if (meetingEndsInput) meetingEndsInput.value = "";

        if (isMeetingAdmin) {
            if (meetingAdminFields) meetingAdminFields.style.display = "block";
            loadMeetingDirectories();
        } else {
            if (meetingAdminFields) meetingAdminFields.style.display = "none";
        }
    }

    function closeMeetingModal() {
        if (meetingModal) meetingModal.classList.remove("active");
    }

    async function saveMeeting() {
        if (!meetingTitleInput || !meetingStartsInput) return;
        const title = meetingTitleInput.value.trim();
        const startsAt = normalizeDateTime(meetingStartsInput.value);
        const endsAt = normalizeDateTime(meetingEndsInput ? meetingEndsInput.value : "");
        const description = meetingDescInput ? meetingDescInput.value.trim() : "";

        if (!title) {
            alert("Введите тему собрания");
            return;
        }
        if (!startsAt) {
            alert("Укажите время начала");
            return;
        }

        let organizationName = null;
        let departmentName = null;

        if (isMeetingAdmin) {
            organizationName = meetingOrgSelect ? meetingOrgSelect.value : null;
            departmentName = meetingDeptSelect ? meetingDeptSelect.value : null;
        } else if (currentUser) {
            organizationName = currentUser.work_place || currentUser.organization_name || null;
            departmentName = currentUser.speciality || currentUser.department_name || null;
        }

        const payload = {
            title,
            description,
            type: "meeting",
            status: "scheduled",
            is_online: true,
            starts_at: startsAt,
            ends_at: endsAt || null,
        };

        if (organizationName) payload.organization_name = organizationName;
        if (departmentName) payload.department_name = departmentName;

        saveMeetingBtn.disabled = true;
        saveMeetingBtn.textContent = "Создание...";
        try {
            const res = await fetch(`${API_URL}/events`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Ошибка создания собрания");
            }
            closeMeetingModal();
            await loadEventsFromBackend();
        } catch (e) {
            console.error(e);
            alert(e.message || "Ошибка создания собрания");
        } finally {
            saveMeetingBtn.disabled = false;
            saveMeetingBtn.textContent = "Создать";
        }
    }

    function initMeetingControls(user) {
        if (!createMeetingBtn) return;
        canCreateMeeting = resolveCanCreateMeeting(user);
        isMeetingAdmin = user && user.global_role === "admin";

        if (!canCreateMeeting) {
            createMeetingBtn.style.display = "none";
            return;
        }

        createMeetingBtn.style.display = "inline-flex";
        createMeetingBtn.addEventListener("click", openMeetingModal);
        if (closeMeetingBtn) closeMeetingBtn.addEventListener("click", closeMeetingModal);
        if (cancelMeetingBtn) cancelMeetingBtn.addEventListener("click", closeMeetingModal);
        if (saveMeetingBtn) saveMeetingBtn.addEventListener("click", saveMeeting);

        if (meetingModal) {
            meetingModal.addEventListener("click", (e) => {
                if (e.target === meetingModal) closeMeetingModal();
            });
        }
    }

    function initRealtime() {
        if (!window.Echo) return;
        window.Echo = new Echo({
            broadcaster: "reverb", key: REVERB_APP_KEY, wsHost: REVERB_HOST, wsPort: REVERB_PORT, wssPort: REVERB_PORT, forceTLS: false, enabledTransports: ["ws", "wss"],
            authEndpoint: `${API_URL.replace("/api", "")}/broadcasting/auth`,
            auth: { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
        });
        window.Echo.private(`App.Models.User.${currentUserId}`).notification(() => loadNotifications());
    }

    async function loadNotifications() {
        try {
            const response = await fetch(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
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
            if (!n.read_at) { item.style.backgroundColor = "#f0f8ff"; item.style.cursor = "pointer"; }
            const payload = n.data || n;
            const text = payload.message || payload.body || "Новое уведомление";
            item.innerHTML = `<div class="notify-content" style="padding: 10px; font-size: 13px;">${text}</div>`;
            item.addEventListener("click", () => { if (!n.read_at) markAsRead(n.id, item); });
            notifList.appendChild(item);
        });
    }

    async function markAsRead(id, element) {
        element.style.backgroundColor = "transparent";
        element.style.cursor = "default";
        try { await fetch(`${API_URL}/notifications/${id}/read`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); loadNotifications(); } catch (error) { console.error(error); }
    }

    if (logoutBtn) logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try { await fetch(`${API_URL}/security/logout-all`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); }
        finally { localStorage.removeItem("auth_token"); localStorage.removeItem("user_info"); window.location.href = "/"; }
    });

    if (notifBtn) notifBtn.addEventListener("click", (e) => { e.stopPropagation(); if (settingsPopup) settingsPopup.classList.remove("active"); notifPopup.classList.toggle("active"); });
    if (settingsBtn) settingsBtn.addEventListener("click", (e) => { e.stopPropagation(); if (notifPopup) notifPopup.classList.remove("active"); settingsPopup.classList.toggle("active"); });
    document.addEventListener("click", (e) => {
        if (notifPopup && notifPopup.classList.contains("active") && !notifPopup.contains(e.target) && e.target !== notifBtn) notifPopup.classList.remove("active");
        if (settingsPopup && settingsPopup.classList.contains("active") && !settingsPopup.contains(e.target) && e.target !== settingsBtn) settingsPopup.classList.remove("active");
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

    function openAddModal(dateStr) { if (!addModal) return; document.getElementById("modalDateTitle").textContent = `Добавить на ${dateStr}`; eventInput.value = ""; addModal.classList.add("active"); }
    function closeAddModal() { if (addModal) addModal.classList.remove("active"); }
    function openViewModal(dateStr, list) {
        if (!viewModal) return;
        document.getElementById("viewDateTitle").textContent = `События: ${dateStr}`;
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
            saveBtn.textContent = "Сохранение..."; saveBtn.disabled = true;
            try {
                const payload = { title: title, starts_at: selectedDateStr + " 11:00:00", ends_at: selectedDateStr + " 12:00:00", description: "Создано вручную", is_global: false };
                const response = await fetch(`${API_URL}/events`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                if (response.ok) { closeAddModal(); await loadEventsFromBackend(); } else { alert("Ошибка сохранения"); }
            } catch (error) { console.error(error); alert("Ошибка соединения"); } finally { saveBtn.textContent = "Сохранить"; saveBtn.disabled = false; }
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
    if (prevBtn) prevBtn.addEventListener("click", () => { activeMonth--; if (activeMonth < 0) { activeMonth = 11; activeYear--; } renderCalendar(activeYear, activeMonth); });
    if (nextBtn) nextBtn.addEventListener("click", () => { activeMonth++; if (activeMonth > 11) { activeMonth = 0; activeYear++; } renderCalendar(activeYear, activeMonth); });

    const toggleBtn = document.querySelector(".btn-more");
    const card = document.querySelector(".lectures-card");
    if (toggleBtn && card) {
        toggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            card.classList.toggle("collapsed");
        });
    }

    initUser();
    loadFeed("all");

    if (daysContainer) {
        renderCalendar(activeYear, activeMonth);
        loadEventsFromBackend();
    }

    setInterval(() => {
        loadFeed(currentFilter);
    }, 5000);
});
