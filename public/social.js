let currentUser = null;
        let currentConversation = null;
        let currentConversationName = null;
        let currentChatType = 'direct';
        let currentGroupChat = null;
        let currentGroupChatName = null;
        let currentPage = 'home';
        let token = localStorage.getItem('token');

        // API helper
        async function api(endpoint, method = 'GET', body = null, isFormData = false) {
            const headers = { 'Accept': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            if (body && !isFormData && typeof body === 'object') {
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify(body);
            }
            const response = await fetch(`/api${endpoint}`, { method, headers, body });
            if (!response.ok) {
                if (response.status === 401) {
                    token = null;
                    localStorage.removeItem('token');
                    currentUser = null;
                    updateAuthButton();
                    showAuthModal();
                }
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }
            return response.json();
        }

        function getDisplayName(user) {
            if (!user) return '';
            const first = user.name || '';
            const last = user.last_name || '';
            return `${first}${last ? ' ' + last : ''}`.trim();
        }

        function getInitials(name) {
            return name
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .map(word => word[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
        }

        function getInitialsAvatarUrl(user) {
            const name = getDisplayName(user) || '?';
            const initials = getInitials(name) || '?';
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
<rect width="120" height="120" rx="60" fill="#CBD5E1"/>
<text x="50%" y="52%" font-family="Arial, sans-serif" font-size="48" fill="#1F2937" text-anchor="middle" dominant-baseline="middle">${initials}</text>
</svg>`;
            return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
        }

        function getAvatarUrl(user) {
            if (user && user.avatar) return `/storage/${user.avatar}`;
            return getInitialsAvatarUrl(user);
        }

        function getAvatarHtml(user, size = 'md') {
            const name = getDisplayName(user);
            const initials = getInitials(name);
            const avatar = user && user.avatar ? `/storage/${user.avatar}` : '';
            const sizeClass = `avatar-${size}`;
            const hasImageClass = avatar ? 'avatar-has-image' : '';
            const style = avatar ? ` style="background-image:url('${avatar}')"` : '';
            return `<div class="avatar ${sizeClass} ${hasImageClass}"${style} aria-label="${name}">${initials || '?'}</div>`;
        }

        let currentCommentPostId = null;
        let currentReplyToCommentId = null;

        // Page navigation
        function showPage(page, userId = null) {
            if (!token) {
                showAuthModal();
                return;
            }
            document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
            document.getElementById(page + 'Page').classList.remove('hidden');
            document.querySelectorAll('.tab-button').forEach(b => {
                b.classList.remove('bg-blue-500', 'text-white');
                b.classList.add('bg-gray-200', 'text-gray-700');
            });
            currentPage = page;
            updateNavHighlight();

            switch(page) {
                case 'home':
                    loadFeed();
                    loadSuggestions();
                    break;
                case 'profile':
                    loadProfile(userId);
                    break;
                case 'messages':
                    setChatTab('direct');
                    break;
                case 'friends':
                    showFriendsTab('friends');
                    break;
                case 'notifications':
                    loadNotifications();
                    break;
            }
        }

        function updateNavHighlight() {
            document.querySelectorAll('[id^="nav"]').forEach(btn => btn.classList.remove('text-blue-600'));
            document.getElementById('nav' + currentPage.charAt(0).toUpperCase() + currentPage.slice(1)).classList.add('text-blue-600');
        }

        // Auth
        function showAuthModal() {
            document.getElementById('authModal').classList.add('show');
        }

        function closeModal(id) {
            document.getElementById(id).classList.remove('show');
            if (id === 'forwardModal') {
                pendingForwardMessage = null;
            }
        }

        function openModal(id) {
            document.getElementById(id).classList.add('show');
            if (id === 'notificationsModal') {
                loadNotifications();
            }
        }

        document.getElementById('btnLogin').onclick = async () => {
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            try {
                const result = await api('/login', 'POST', { email, password });
                if (result.token) {
                    token = result.token;
                    localStorage.setItem('token', token);
                    closeModal('authModal');
                    updateAuthButton();
                    loadUserData();
                    initEcho();
                    showPage('home');
                } else {
                    alert('Ошибка входа: ' + (result.message || 'Неизвестная ошибка'));
                }
            } catch (error) {
                alert('Ошибка входа: ' + error.message);
            }
        };

        document.getElementById('btnRegister').onclick = async () => {
            const name = document.getElementById('authName').value;
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            try {
                const result = await api('/register', 'POST', { name, email, password });
                if (result.token) {
                    token = result.token;
                    localStorage.setItem('token', token);
                    closeModal('authModal');
                    updateAuthButton();
                    loadUserData();
                    initEcho();
                    showPage('home');
                } else {
                    alert('Ошибка регистрации: ' + (result.message || 'Неизвестная ошибка'));
                }
            } catch (error) {
                alert('Ошибка регистрации: ' + error.message);
            }
        };

        function updateAuthButton() {
            const btn = document.getElementById('btnLogout');
            if (token) {
                btn.textContent = 'Выйти';
                btn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                btn.classList.add('bg-red-500', 'hover:bg-red-600');
                btn.onclick = async () => {
                    try { await api('/logout', 'POST'); } catch {}
                    token = null;
                    localStorage.removeItem('token');
                    currentUser = null;
                    updateAuthButton();
                    showAuthModal();
                };
            } else {
                btn.textContent = 'Войти';
                btn.classList.remove('bg-red-500', 'hover:bg-red-600');
                btn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                btn.onclick = () => showAuthModal();
            }
        }

        // Load user data
        async function loadUserData() {
            if (!token) return showAuthModal();
            const user = await api('/me');
            currentUser = user;
            document.getElementById('userName').textContent = getDisplayName(user);
            document.getElementById('userAvatar').src = getAvatarUrl(user);
            document.getElementById('userStatus').textContent = user.status_text || '';
            loadStats();
            if (window.notificationsInterval) clearInterval(window.notificationsInterval);
            setTimeout(updateNotificationBadge, 2000);
            window.notificationsInterval = setInterval(updateNotificationBadge, 20000);
        }

        async function loadStats() {
            const followers = await api('/followers');
            const following = await api('/following');
            document.getElementById('userStats').textContent = `Подписчиков: ${followers.length} | Подписок: ${following.length}`;
        }

        const btnProfileSettings = document.getElementById('btnProfileSettings');
        if (btnProfileSettings) {
            btnProfileSettings.onclick = async () => {
                if (!currentUser) {
                    showAuthModal();
                    return;
                }
                await loadProfileSettings();
                openModal('profileSettingsModal');
            };
        }

        // Home page
        async function loadFeed() {
            const posts = await api('/feed');
            const feed = document.getElementById('feed');
            feed.innerHTML = '';
            posts.forEach(post => {
                const postEl = createPostElement(post);
                feed.appendChild(postEl);
            });
        }

        function createPostElement(post) {
            const liked = post.likes && post.likes.length > 0;
            const el = document.createElement('div');
            el.className = 'bg-white rounded-lg shadow p-6 post-card';
            el.setAttribute('data-post-id', post.id);
            el.innerHTML = `
                <div class="flex items-center mb-4">
                    <div class="post-author user-link" onclick="showPage('profile', ${post.user.id})">
                        ${getAvatarHtml(post.user, 'sm')}
                        <div>
                            <p class="font-medium">${getDisplayName(post.user)}</p>
                            <p class="text-sm text-gray-500">${new Date(post.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <p class="mb-4">${post.content}</p>
                ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image mb-4">` : ''}
                <div class="flex items-center space-x-4">
                    <button class="btn-action ${liked ? 'btn-liked' : 'btn-default'}" onclick="toggleLike(${post.id})"><span class="heart-icon">${liked ? '♥' : '♡'}</span> ${post.likes_count || 0}</button>
                    <button class="btn-action btn-default btn-comment" onclick="commentPost(${post.id})">
                        <img class="comment-icon" src="/storage/docs/comment_120216.svg" alt="">
                        ${post.comments_count || 0}
                    </button>
                    ${currentUser && currentUser.id === post.user.id ? `<button class="btn-action btn-default" onclick="openEditPost(${post.id})">Редактировать</button>` : ''}
                    ${currentUser && currentUser.id === post.user.id ? `<button class="btn-action btn-default" onclick="showLikes(${post.id})"> Лайки</button>` : ''}
                    ${currentUser && currentUser.id === post.user.id ? `<button class="btn-action btn-delete" onclick="deletePost(${post.id})">Удалить</button>` : ''}
                </div>
            `;
            return el;
        }

        async function toggleLike(postId) {
            try {
                console.log('Toggling like for post', postId);
                await api(`/posts/${postId}/like`, 'POST');
                console.log('Like toggled');
                loadFeed();
            } catch (e) {
                console.error('Error toggling like:', e);
                alert('Ошибка: ' + e.message);
            }
        }

        async function showLikes(postId) {
            const likes = await api(`/posts/${postId}/likes`);
            alert('Лайкнули: ' + likes.map(u => u.name).join(', '));
        }

        let currentEditPostId = null;
        let currentEditPostImage = null;

        async function openEditPost(postId) {
            try {
                const post = await api(`/posts/${postId}`);
                currentEditPostId = post.id;
                currentEditPostImage = post.image || null;
                document.getElementById('editPostContent').value = post.content || '';
                document.getElementById('editPostImageFile').value = '';
                document.getElementById('editPostRemoveImage').checked = false;

                const previewWrap = document.getElementById('editPostImagePreview');
                const previewImg = document.getElementById('editPostImage');
                if (currentEditPostImage) {
                    previewImg.src = post.image;
                    previewWrap.classList.remove('hidden');
                } else {
                    previewImg.src = '';
                    previewWrap.classList.add('hidden');
                }

                openModal('editPostModal');
            } catch (e) {
                alert('Ошибка загрузки поста: ' + e.message);
            }
        }

        function bindEditPostSave() {
            const btnSavePostEdit = document.getElementById('btnSavePostEdit');
            if (!btnSavePostEdit) return;
            btnSavePostEdit.onclick = async () => {
                if (!currentEditPostId) return;
                const content = document.getElementById('editPostContent').value;
                const removeImage = document.getElementById('editPostRemoveImage').checked;
                const imageFile = document.getElementById('editPostImageFile').files[0];

                let imageUrl;
                if (imageFile) {
                    const formData = new FormData();
                    formData.append('file', imageFile);
                    const uploadResult = await fetch('/api/media', {
                        method: 'POST',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                        body: formData
                    });
                    const uploadData = await uploadResult.json();
                    imageUrl = uploadData.url;
                }

                const payload = { content };
                if (removeImage) {
                    payload.image = null;
                } else if (typeof imageUrl !== 'undefined') {
                    payload.image = imageUrl;
                }

                try {
                    await api(`/posts/${currentEditPostId}`, 'PATCH', payload);
                    closeModal('editPostModal');
                    currentEditPostId = null;
                    currentEditPostImage = null;
                    loadFeed();
                    if (currentPage === 'profile' && currentUser) {
                        loadProfile(currentUser.id);
                    }
                } catch (e) {
                    alert('Ошибка сохранения: ' + e.message);
                }
            };
        }

        if (document.readyState !== 'loading') {
            bindEditPostSave();
        } else {
            document.addEventListener('DOMContentLoaded', bindEditPostSave);
        }

        async function deletePost(postId) {
            if (confirm('Вы уверены, что хотите удалить этот пост?')) {
                await api(`/posts/${postId}`, 'DELETE');
                loadFeed();
            }
        }

        async function commentPost(postId) {
            currentCommentPostId = postId;
            await loadComments(postId);
            document.getElementById('commentsModal').classList.add('show');
        }

        async function loadComments(postId) {
            const comments = await api(`/posts/${postId}/comments`);
            const post = await api(`/posts/${postId}`);
            const postUserId = post.user.id;
            const list = document.getElementById('commentsList');
            list.innerHTML = '';
          
            const byId = {};
            comments.forEach(c => byId[c.id] = Object.assign({}, c, { children: [] }));
            const roots = [];
            comments.forEach(c => {
                if (c.parent_id && byId[c.parent_id]) {
                    byId[c.parent_id].children.push(byId[c.id]);
                } else {
                    roots.push(byId[c.id]);
                }
            });

            function renderComment(c, indent = 0, postUserId) {
                const liked = c.likes && c.likes.length > 0;
                const el = document.createElement('div');
                el.className = 'comment-item';
                el.style.marginLeft = (indent * 16) + 'px';
                el.innerHTML = `
                    <div class="flex items-center mb-2">
                        <img class="w-8 h-8 bg-gray-300 rounded-full mr-3" src="${getAvatarUrl(c.user)}" alt="Avatar">
                        <div>
                            <p class="font-medium">${getDisplayName(c.user)}</p>
                            <p class="text-sm text-gray-500">${new Date(c.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                    <p>${c.body}</p>
                    <div class="mt-2 flex items-center space-x-2 comment-actions">
                        <button class="comment-action comment-like ${liked ? 'btn-liked' : 'btn-default'}" onclick="toggleCommentLike(${c.id})"><span class="heart-icon">${liked ? '♥' : '♡'}</span></button>
                        <button class="comment-action" onclick="replyToComment(${c.id}, '${getDisplayName(c.user).replace("'", "\\'")}')">Ответить</button>
                        ${currentUser && (currentUser.id === c.user.id || currentUser.id === postUserId) ? `<button class="comment-action comment-action-danger" onclick="deleteComment(${c.id})">Удалить</button>` : ''}
                    </div>
                `;
                list.appendChild(el);
                if (c.children && c.children.length) {
                    c.children.forEach(child => renderComment(child, indent + 1, postUserId));
                }
            }

            roots.forEach(r => renderComment(r, 0, postUserId));
        }

        function replyToComment(commentId, userName) {
            currentReplyToCommentId = commentId;
            const ta = document.getElementById('commentText');
            ta.value = `@${userName} `;
            ta.focus();
        }

        async function toggleCommentLike(commentId) {
            try {
                await api(`/comments/${commentId}/like`, 'POST');
         
                await loadComments(currentCommentPostId);
            } catch (e) {
                alert('Ошибка: ' + e.message);
            }
        }

        async function deleteComment(commentId) {
            console.log('Deleting comment', commentId);
            if (confirm('Вы уверены, что хотите удалить этот комментарий?')) {
                try {
                    await api(`/comments/${commentId}`, 'DELETE');
                    await loadComments(currentCommentPostId);
                } catch (e) {
                    alert('Ошибка удаления: ' + e.message);
                }
            }
        }

        document.getElementById('btnCreatePost').onclick = async () => {
            const content = document.getElementById('postContent').value;
            const imageFile = document.getElementById('postImage').files[0];
            let imageUrl = null;

            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);
                const uploadResult = await fetch('/api/media', {
                    method: 'POST',
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    body: formData
                });
                const uploadData = await uploadResult.json();
                imageUrl = uploadData.url;
            }

            await api('/posts', 'POST', { content, image: imageUrl });
            document.getElementById('postContent').value = '';
            document.getElementById('postImage').value = '';
            loadFeed();
        };

        async function loadSuggestions() {
            const suggestions = document.getElementById('suggestions');
            suggestions.innerHTML = '';

            const [users, friends, following] = await Promise.all([
                api('/users'),
                api('/friends'),
                api('/following')
            ]);

            const friendIds = new Set(friends.map(f => f.id));
            const followingIds = new Set(following.map(f => f.id));
            const filtered = users.filter(user => {
                if (!currentUser || user.id === currentUser.id) return false;
                if (friendIds.has(user.id)) return false;
                if (followingIds.has(user.id)) return false;
                return true;
            }).slice(0, 5);

            if (!filtered.length) {
                suggestions.innerHTML = `<div class="text-sm text-gray-500">Нет новых рекомендаций</div>`;
                return;
            }

            filtered.forEach(user => {
                const el = document.createElement('div');
                el.className = 'suggestion-item suggestion-clickable';
                el.innerHTML = `
                    <div class="suggestion-user">
                        ${getAvatarHtml(user, 'sm')}
                        <span class="suggestion-name">${getDisplayName(user)}</span>
                    </div>
                    <button class="btn-follow" onclick="event.stopPropagation(); toggleFollow(${user.id}, this)">Подписаться</button>
                `;
                el.addEventListener('click', () => showPage('profile', user.id));
                suggestions.appendChild(el);
            });
        }

        async function toggleFollow(userId, btn) {
            const status = await api(`/follow/${userId}/status`);
            if (status.is_following) {
                await api(`/unfollow/${userId}`, 'POST');
                btn.textContent = 'Подписаться';
            } else {
                await api(`/follow/${userId}`, 'POST');
                btn.textContent = 'Отписаться';
            }
            loadStats();
            loadSuggestions();
        }

        // Profile page
        async function loadProfile(userId = null) {
            if (!userId && !currentUser) {
                showAuthModal();
                return;
            }
            let data;
            try {
                if (userId) {
                    data = await api('/profile/' + userId);
                } else {
                    const profileData = await api('/profile/' + currentUser.id);
                    const user = profileData.user;
                    const followers = await api('/followers');
                    const following = await api('/following');
                    data = {
                        user: user,
                        posts: profileData.posts,
                        followers_count: followers.length,
                        following_count: following.length,
                        total_likes: profileData.total_likes
                    };
                }
            } catch (e) {
                alert(e.message);
                return;
            }

            const user = data.user;
            const isSelf = currentUser && user && currentUser.id === user.id;
            document.getElementById('profileName').textContent = getDisplayName(user);
            document.getElementById('profileEmail').textContent = user.email ? user.email : 'Почта скрыта';
            document.getElementById('profileStatus').textContent = user.status_text || '';
            const settingsBtn = document.getElementById('btnProfileSettings');
            if (settingsBtn) {
                settingsBtn.style.display = isSelf ? 'inline-flex' : 'none';
            }
            document.getElementById('profileAvatar').src = getAvatarUrl(user);
            const cover = document.getElementById('profileCover');
            if (cover) {
                if (user.cover_image) {
                    cover.style.backgroundImage = `url('/storage/${user.cover_image}')`;
                    cover.classList.add('has-image');
                } else {
                    cover.style.backgroundImage = '';
                    cover.classList.remove('has-image');
                }
            }

            const followersEl = document.getElementById('profileFollowers');
            const followingEl = document.getElementById('profileFollowing');
            if (!isSelf && user.show_followers === false) {
                followersEl.textContent = 'Подписчиков: скрыто';
                followersEl.onclick = null;
            } else {
                followersEl.textContent = `Подписчиков: ${data.followers_count}`;
                followersEl.onclick = () => openFollowersModal(userId || currentUser.id, 'followers');
            }
            if (!isSelf && user.show_following === false) {
                followingEl.textContent = 'Подписок: скрыто';
                followingEl.onclick = null;
            } else {
                followingEl.textContent = `Подписок: ${data.following_count}`;
                followingEl.onclick = () => openFollowersModal(userId || currentUser.id, 'following');
            }
            document.getElementById('profilePosts').textContent = `Постов: ${data.posts.length}`;
            document.getElementById('profileLikes').textContent = `Лайков: ${data.total_likes || 0}`;

            if (isSelf) {
                document.getElementById('profilePrivate').checked = user.is_private || false;
                document.getElementById('profileShowStatus').checked = user.show_status ?? true;
                document.getElementById('profileShowLastSeen').checked = user.show_last_seen ?? true;
                document.getElementById('profileShowFollowers').checked = user.show_followers ?? true;
                document.getElementById('profileShowFollowing').checked = user.show_following ?? true;
                document.getElementById('profilePostsVisibility').value = user.posts_visibility || 'everyone';
                document.getElementById('profileCommentsVisibility').value = user.comments_visibility || 'everyone';
                document.getElementById('profileMessagesVisibility').value = user.messages_visibility || 'everyone';
                document.getElementById('profileEmailVisibility').value = user.email_visibility || 'everyone';
            }

            const blockBtn = document.getElementById('btnBlockUser');
            if (!isSelf && user && user.id) {
                blockBtn.classList.remove('hidden');
                const blockedByMe = data.blocked_by_me === true;
                blockBtn.textContent = blockedByMe ? 'Разблокировать' : 'Заблокировать';
                blockBtn.onclick = async () => {
                    try {
                        if (blockedByMe) {
                            await api(`/blocks/${user.id}`, 'DELETE');
                        } else {
                            await api('/blocks', 'POST', { blocked_id: user.id });
                        }
                        loadProfile(user.id);
                    } catch (e) {
                        alert('Ошибка: ' + e.message);
                    }
                };
            } else {
                blockBtn.classList.add('hidden');
            }

            const pinnedPostBox = document.getElementById('profilePinnedPost');
            const pinnedPostContent = document.getElementById('pinnedPostContent');
            if (data.pinned_post) {
                pinnedPostBox.classList.remove('hidden');
                pinnedPostContent.innerHTML = `
                    <p>${data.pinned_post.content || ''}</p>
                    ${data.pinned_post.image ? `<img src="${data.pinned_post.image}" alt="Post image" class="post-image mt-2">` : ''}
                    ${isSelf ? `<button class="mt-3 btn-action btn-default" onclick="pinProfilePost(null)">Снять закреп</button>` : ''}
                `;
            } else {
                pinnedPostBox.classList.add('hidden');
                pinnedPostContent.innerHTML = '';
            }

            const userPosts = document.getElementById('userPosts');
            userPosts.innerHTML = '';

            if (data.message) {
                userPosts.innerHTML = `<div class="text-center text-gray-500">${data.message}</div>`;
            } else if (data.blocked_by_me) {
                userPosts.innerHTML = `<div class="text-center text-gray-500">Вы заблокировали этого пользователя.</div>`;
            } else {
                data.posts.filter(post => !data.pinned_post || post.id !== data.pinned_post.id).forEach(post => {
                    const postEl = document.createElement('div');
                    postEl.className = 'profile-post-card';
                    postEl.innerHTML = `
                        <div class="profile-post-text">${post.content || ''}</div>
                        <div class="profile-post-media">
                            ${post.image ? `<img src="${post.image}" alt="Post image" class="profile-post-image">` : `<div class="profile-post-placeholder">Нет изображения</div>`}
                        </div>
                        <div class="profile-post-actions">
                            ${currentUser && currentUser.id === user.id ? `<button class="btn-action btn-default" onclick="openEditPost(${post.id})">Редактировать</button>` : ''}
                            ${currentUser && currentUser.id === user.id ? `<button class="btn-action btn-default" onclick="pinProfilePost(${post.id})">Закрепить</button>` : ''}
                        </div>
                    `;
                    userPosts.appendChild(postEl);
                });
            }
        }

        async function loadProfileSettings() {
            if (!currentUser) return;
            try {
                const profileData = await api('/profile/' + currentUser.id);
                const user = profileData.user || currentUser;
                document.getElementById('profilePrivate').checked = user.is_private || false;
                document.getElementById('profileShowStatus').checked = user.show_status ?? true;
                document.getElementById('profileShowLastSeen').checked = user.show_last_seen ?? true;
                document.getElementById('profileShowFollowers').checked = user.show_followers ?? true;
                document.getElementById('profileShowFollowing').checked = user.show_following ?? true;
                document.getElementById('profilePostsVisibility').value = user.posts_visibility || 'everyone';
                document.getElementById('profileCommentsVisibility').value = user.comments_visibility || 'everyone';
                document.getElementById('profileMessagesVisibility').value = user.messages_visibility || 'everyone';
                document.getElementById('profileEmailVisibility').value = user.email_visibility || 'everyone';
            } catch (e) {
                
            }
        }

        const btnOpenProfileEdit = document.getElementById('btnOpenProfileEdit');
        if (btnOpenProfileEdit) {
            btnOpenProfileEdit.onclick = () => {
                document.getElementById('editName').value = currentUser.name || '';
                document.getElementById('editLastName').value = currentUser.last_name || '';
                document.getElementById('editEmail').value = currentUser.email || '';
                document.getElementById('editStatus').value = currentUser.status_text || '';
                document.getElementById('editPrivate').checked = currentUser.is_private || false;
                document.getElementById('editCover').value = '';
                document.getElementById('removeAvatar').checked = false;
                document.getElementById('removeCover').checked = false;
                closeModal('profileSettingsModal');
                document.getElementById('profileEditModal').classList.add('show');
            };
        }

        document.getElementById('btnSaveProfile').onclick = async () => {
            const name = document.getElementById('editName').value;
            const lastName = document.getElementById('editLastName').value;
            const email = document.getElementById('editEmail').value;
            const status_text = document.getElementById('editStatus').value;
            const is_private = document.getElementById('editPrivate').checked;
            const avatar = document.getElementById('editAvatar').files[0];
            const cover = document.getElementById('editCover').files[0];
            const removeAvatar = document.getElementById('removeAvatar').checked;
            const removeCover = document.getElementById('removeCover').checked;

            const formData = new FormData();
            if (name && name.trim() && name.trim() !== (currentUser.name || '')) {
                formData.append('name', name.trim());
            }
            if (lastName && lastName.trim() && lastName.trim() !== (currentUser.last_name || '')) {
                formData.append('last_name', lastName.trim());
            }
            if (email && email.trim() && email.trim() !== (currentUser.email || '')) {
                formData.append('email', email.trim());
            }
            formData.append('status_text', status_text);
            formData.append('is_private', is_private);
            if (avatar) {
                formData.append('avatar', avatar);
            }
            if (cover) {
                formData.append('cover_image', cover);
            }
            if (removeAvatar) {
                formData.append('remove_avatar', '1');
            }
            if (removeCover) {
                formData.append('remove_cover_image', '1');
            }

            try {
                const result = await api('/profile', 'POST', formData, true); 
                if (result.user) {
                    alert('Профиль обновлен');
                    closeModal('profileEditModal');
                    currentUser = result.user;
                    loadProfile();
                } else {
                    const errorMsg = result.errors ? Object.values(result.errors).flat().join(', ') : (result.message || 'Неизвестная ошибка');
                    alert('Ошибка обновления: ' + errorMsg);
                }
            } catch (error) {
                alert('Ошибка обновления: ' + error.message);
            }
        };

        async function pinProfilePost(postId) {
            try {
                await api('/profile/pin-post', 'POST', { post_id: postId });
                loadProfile();
            } catch (e) {
                alert('Ошибка закрепления: ' + e.message);
            }
        }

        const btnUpdatePrivacy = document.getElementById('btnUpdatePrivacy');
        if (btnUpdatePrivacy) {
            btnUpdatePrivacy.onclick = async () => {
                const payload = {
                    is_private: document.getElementById('profilePrivate').checked,
                    show_status: document.getElementById('profileShowStatus').checked,
                    show_last_seen: document.getElementById('profileShowLastSeen').checked,
                    show_followers: document.getElementById('profileShowFollowers').checked,
                    show_following: document.getElementById('profileShowFollowing').checked,
                    posts_visibility: document.getElementById('profilePostsVisibility').value,
                    comments_visibility: document.getElementById('profileCommentsVisibility').value,
                    messages_visibility: document.getElementById('profileMessagesVisibility').value,
                    email_visibility: document.getElementById('profileEmailVisibility').value,
                };
                try {
                    await api('/privacy', 'POST', payload);
                    currentUser = await api('/me');
                    loadProfile();
                } catch (e) {
                    alert('Ошибка приватности: ' + e.message);
                }
            };
        }

        const btnChangePassword = document.getElementById('btnChangePassword');
        if (btnChangePassword) {
            btnChangePassword.onclick = async () => {
                const current_password = document.getElementById('currentPassword').value;
                const password = document.getElementById('newPassword').value;
                const password_confirmation = document.getElementById('confirmPassword').value;
                try {
                    await api('/security/password', 'POST', { current_password, password, password_confirmation });
                    alert('Пароль обновлен. Войдите снова.');
                    token = null;
                    localStorage.removeItem('token');
                    updateAuthButton();
                    showAuthModal();
                } catch (e) {
                    alert('Ошибка смены пароля: ' + e.message);
                }
            };
        }

        const btnLogoutAll = document.getElementById('btnLogoutAll');
        if (btnLogoutAll) {
            btnLogoutAll.onclick = async () => {
                if (!confirm('Выйти со всех устройств?')) return;
                try {
                    await api('/security/logout-all', 'POST');
                    token = null;
                    localStorage.removeItem('token');
                    updateAuthButton();
                    showAuthModal();
                } catch (e) {
                    alert('Ошибка: ' + e.message);
                }
            };
        }

        // Messages page
        function setChatTab(tab) {
            const directTab = document.getElementById('tabDirectChats');
            const groupTab = document.getElementById('tabGroupChats');
            const groupPanel = document.getElementById('groupChatsPanel');
            const directList = document.getElementById('conversationsList');
            const btnChatMenu = document.getElementById('btnChatMenu');
            const btnInviteGroup = document.getElementById('btnInviteGroup');
            const pinnedPanel = document.getElementById('pinnedPanel');

            if (tab === 'group') {
                currentChatType = 'group';
                currentConversation = null;
                directTab.classList.remove('chat-tab-active');
                groupTab.classList.add('chat-tab-active');
                directList.classList.add('hidden');
                groupPanel.classList.remove('hidden');
                document.getElementById('chatTitle').innerHTML = 'Выберите группу';
                btnChatMenu.classList.remove('hidden');
                btnInviteGroup.classList.add('hidden');
                document.getElementById('btnDeleteConversation').classList.add('hidden');
                document.getElementById('btnLeaveGroup').classList.add('hidden');
                document.getElementById('btnDeleteGroup').classList.add('hidden');
                if (pinnedPanel) pinnedPanel.classList.add('hidden');
                closeChatMenu();
                loadGroupChats();
            } else {
                currentChatType = 'direct';
                currentGroupChat = null;
                groupTab.classList.remove('chat-tab-active');
                directTab.classList.add('chat-tab-active');
                groupPanel.classList.add('hidden');
                directList.classList.remove('hidden');
                document.getElementById('chatTitle').innerHTML = 'Выберите диалог';
                btnChatMenu.classList.add('hidden');
                btnInviteGroup.classList.add('hidden');
                if (pinnedPanel) pinnedPanel.classList.add('hidden');
                closeChatMenu();
                loadConversations();
            }
        }

        const tabDirectChats = document.getElementById('tabDirectChats');
        if (tabDirectChats) tabDirectChats.addEventListener('click', () => setChatTab('direct'));
        const tabGroupChats = document.getElementById('tabGroupChats');
        if (tabGroupChats) tabGroupChats.addEventListener('click', () => setChatTab('group'));

        async function loadConversations() {
            const friends = await api('/friends');
            const conversations = document.getElementById('conversationsList');
            conversations.innerHTML = '';
            friends.forEach(friend => {
                const el = document.createElement('div');
                el.className = 'conversation-item';
                el.innerHTML = `
                    ${getAvatarHtml(friend, 'sm')}
                    <div>
                        <p class="font-medium">${getDisplayName(friend)}</p>
                    </div>
                `;
                el.onclick = () => openConversation(friend.id, getDisplayName(friend), friend.avatar || null);
                conversations.appendChild(el);
            });
        }

        async function loadGroupChats() {
            const groups = await api('/group-chats');
            const list = document.getElementById('groupChatsList');
            list.innerHTML = '';
            groups.forEach(group => {
                const el = document.createElement('div');
                el.className = 'conversation-item';
                el.innerHTML = `
                    ${getAvatarHtml({ name: group.name }, 'sm')}
                    <div>
                        <p class="font-medium">${group.name}</p>
                        <p class="text-sm text-gray-500">Участников: ${group.members_count || 0}</p>
                    </div>
                `;
                el.onclick = () => openGroupChat(group.id, group.name);
                list.appendChild(el);
            });
        }

        async function openCreateGroupModal() {
            const list = document.getElementById('groupCreateMembersList');
            list.innerHTML = '';
            const friends = await api('/friends');
            friends.forEach(friend => {
                const row = document.createElement('label');
                row.className = 'group-member-row';
                row.innerHTML = `
                    <input type="checkbox" value="${friend.id}">
                    ${getAvatarHtml(friend, 'sm')}
                    <span>${getDisplayName(friend)}</span>
                `;
                list.appendChild(row);
            });
            document.getElementById('groupName').value = '';
            openModal('createGroupModal');
        }

        function bindGroupChatHandlers() {
            const btnCreateGroup = document.getElementById('btnCreateGroup');
            if (btnCreateGroup) {
                btnCreateGroup.addEventListener('click', openCreateGroupModal);
            }

            const btnCreateGroupSubmit = document.getElementById('btnCreateGroupSubmit');
            if (btnCreateGroupSubmit) {
                btnCreateGroupSubmit.addEventListener('click', async () => {
                    const name = document.getElementById('groupName').value.trim();
                    if (!name) {
                        alert('Введите название группы');
                        return;
                    }
                    const list = document.getElementById('groupCreateMembersList');
                    const memberIds = Array.from(list ? list.querySelectorAll('input[type="checkbox"]:checked') : [])
                        .map(input => Number(input.value))
                        .filter(Boolean);
                    try {
                        const group = await api('/group-chats', 'POST', { name, member_ids: memberIds });
                        closeModal('createGroupModal');
                        await loadGroupChats();
                        openGroupChat(group.id, group.name);
                    } catch (e) {
                        alert('Ошибка создания группы: ' + e.message);
                    }
                });
            }

            const btnInviteGroup = document.getElementById('btnInviteGroup');
            if (btnInviteGroup) {
                btnInviteGroup.addEventListener('click', openInviteGroupModal);
            }

            const btnGroupMembers = document.getElementById('btnGroupMembers');
            if (btnGroupMembers) {
                btnGroupMembers.addEventListener('click', openGroupMembersModal);
            }

            const btnInviteGroupSubmit = document.getElementById('btnInviteGroupSubmit');
            if (btnInviteGroupSubmit) {
                btnInviteGroupSubmit.addEventListener('click', async () => {
                    if (!currentGroupChat) return;
                    const list = document.getElementById('inviteMembersList');
                    const memberIds = Array.from(list.querySelectorAll('input[type="checkbox"]:checked'))
                        .map(input => Number(input.value))
                        .filter(Boolean);
                    if (!memberIds.length) {
                        closeModal('inviteGroupModal');
                        return;
                    }
                    try {
                        await api(`/group-chats/${currentGroupChat}/members`, 'POST', { member_ids: memberIds });
                        closeModal('inviteGroupModal');
                        loadGroupChats();
                    } catch (e) {
                        alert('Ошибка приглашения: ' + e.message);
                    }
                });
            }
        }

        async function openInviteGroupModal() {
            if (!currentGroupChat) return;
            const list = document.getElementById('inviteMembersList');
            list.innerHTML = '';
            const [group, friends] = await Promise.all([
                api(`/group-chats/${currentGroupChat}`),
                api('/friends')
            ]);
            const memberIds = new Set((group.members || []).map(m => m.id));
            const candidates = friends.filter(f => !memberIds.has(f.id));
            if (!candidates.length) {
                list.innerHTML = `<div class="text-sm text-gray-500">Нет друзей для приглашения</div>`;
            } else {
                candidates.forEach(friend => {
                    const row = document.createElement('label');
                    row.className = 'group-member-row';
                    row.innerHTML = `
                        <input type="checkbox" value="${friend.id}">
                        ${getAvatarHtml(friend, 'sm')}
                        <span>${getDisplayName(friend)}</span>
                    `;
                    list.appendChild(row);
                });
            }
            openModal('inviteGroupModal');
        }

        async function openGroupMembersModal() {
            if (!currentGroupChat) return;
            const list = document.getElementById('groupMembersModalList');
            const title = document.getElementById('groupMembersTitle');
            list.innerHTML = '';
            title.textContent = currentGroupChatName || 'Участники группы';
            try {
                const group = await api(`/group-chats/${currentGroupChat}`);
                const isOwner = group.owner_id === currentUser.id;
                (group.members || []).forEach(member => {
                    const el = document.createElement('div');
                    el.className = 'follow-item';
                    el.innerHTML = `
                        ${getAvatarHtml(member, 'sm')}
                        <span>${getDisplayName(member)}</span>
                        ${isOwner && member.id !== currentUser.id ? `<button class="remove-member-btn" data-member-id="${member.id}">Удалить</button>` : ''}
                    `;
                    list.appendChild(el);
                });
                if (isOwner) {
                    list.querySelectorAll('.remove-member-btn').forEach(btn => {
                        btn.addEventListener('click', async (event) => {
                            event.stopPropagation();
                            const memberId = Number(btn.getAttribute('data-member-id'));
                            if (!memberId) return;
                            if (!confirm('Удалить участника из группы?')) return;
                            try {
                                await api(`/group-chats/${currentGroupChat}/members/${memberId}`, 'DELETE');
                                openGroupMembersModal();
                            } catch (e) {
                                alert('Ошибка: ' + e.message);
                            }
                        });
                    });
                }
                openModal('groupMembersModal');
            } catch (e) {
                list.innerHTML = `<div class="text-sm text-red-500">Ошибка загрузки</div>`;
                openModal('groupMembersModal');
            }
        }

        if (document.readyState !== 'loading') {
            bindGroupChatHandlers();
        } else {
            document.addEventListener('DOMContentLoaded', bindGroupChatHandlers);
        }

        async function openGroupChat(groupId, groupName) {
            currentChatType = 'group';
            currentGroupChat = groupId;
            currentGroupChatName = groupName;
            currentConversation = null;
            clearReply();
            clearForward();
            conversationJustOpened = true;
            document.getElementById('chatTitle').innerHTML = `
                <div class="chat-title">
                    ${getAvatarHtml({ name: groupName }, 'sm')}
                    <span>${groupName}</span>
                </div>
            `;
            document.getElementById('btnChatMenu').classList.remove('hidden');
            document.getElementById('btnDeleteConversation').classList.add('hidden');
            document.getElementById('btnDeleteConversationAll').classList.add('hidden');
            document.getElementById('btnInviteGroup').classList.remove('hidden');
            document.getElementById('btnGroupMembers').classList.remove('hidden');
            document.getElementById('btnLeaveGroup').classList.remove('hidden');
            document.getElementById('btnDeleteGroup').classList.add('hidden');
            try {
                const group = await api(`/group-chats/${groupId}`);
                if (group.owner_id === currentUser.id) {
                    document.getElementById('btnDeleteGroup').classList.remove('hidden');
                    document.getElementById('btnLeaveGroup').classList.add('hidden');
                }
            } catch {}
            closeChatMenu();
            const chatSearchInput = document.getElementById('chatSearchInput');
            if (chatSearchInput) chatSearchInput.value = '';
            await loadGroupConversation();

            if (window.conversationInterval) clearInterval(window.conversationInterval);
            window.conversationInterval = setInterval(loadGroupConversation, 5000);
        }

        async function openConversation(userId, userName, avatar = null) {
            currentChatType = 'direct';
            currentConversation = userId;
            currentConversationName = userName;
            currentGroupChat = null;
            currentGroupChatName = null;
            currentConversationAvatar = avatar;
            clearReply();
            clearForward();
            conversationJustOpened = true;
            document.getElementById('chatTitle').innerHTML = `
                <div class="chat-title">
                    ${getAvatarHtml({ name: userName, avatar: currentConversationAvatar }, 'sm')}
                    <span>${userName}</span>
                </div>
            `;
            document.getElementById('btnChatMenu').classList.remove('hidden');
            document.getElementById('btnDeleteConversation').classList.remove('hidden');
            document.getElementById('btnDeleteConversationAll').classList.remove('hidden');
            document.getElementById('btnLeaveGroup').classList.add('hidden');
            document.getElementById('btnDeleteGroup').classList.add('hidden');
            document.getElementById('btnInviteGroup').classList.add('hidden');
            document.getElementById('btnGroupMembers').classList.add('hidden');
            closeChatMenu();
            const chatSearchInput = document.getElementById('chatSearchInput');
            if (chatSearchInput) chatSearchInput.value = '';
            await loadConversation();
           
            if (window.conversationInterval) clearInterval(window.conversationInterval);
            window.conversationInterval = setInterval(loadConversation, 5000);
        }

        let conversationJustOpened = false;
        let currentConversationAvatar = null;

        function isNearBottom(container, threshold = 80) {
            return (container.scrollHeight - container.scrollTop - container.clientHeight) <= threshold;
        }
        async function loadConversation() {
            if (!currentConversation) return;
            if (isAnyAudioPlaying()) return;
            hideMessageMenu();
            let messages = [];
            try {
                messages = await api(`/messages/conversation/${currentConversation}`);
            } catch (e) {
                let message = 'Нет доступа к этому диалогу.';
                try {
                    const parsed = JSON.parse(e.message);
                    if (parsed && parsed.message) message = parsed.message;
                } catch {
                    
                }
                setChatInputDisabled(true, message);
                const pinnedPanel = document.getElementById('pinnedPanel');
                if (pinnedPanel) pinnedPanel.classList.add('hidden');
                const cached = conversationCache.get(`direct:${currentConversation}`);
                if (cached && cached.length) {
                    renderConversationMessages(cached);
                }
                return;
            }
            setChatInputDisabled(false);
            conversationCache.set(`direct:${currentConversation}`, messages);
            renderConversationMessages(messages);
            conversationJustOpened = false;
            loadPinnedMessages();
            const chatSearchInput = document.getElementById('chatSearchInput');
            if (chatSearchInput && chatSearchInput.value.trim()) {
                filterChatMessages(chatSearchInput.value);
            }
        }

        async function loadGroupConversation() {
            if (!currentGroupChat) return;
            if (isAnyAudioPlaying()) return;
            hideMessageMenu();
            let messages = [];
            try {
                messages = await api(`/group-chats/${currentGroupChat}/messages`);
            } catch (e) {
                let message = 'Нет доступа к этой группе.';
                try {
                    const parsed = JSON.parse(e.message);
                    if (parsed && parsed.message) message = parsed.message;
                } catch {
                    
                }
                setChatInputDisabled(true, message);
                const pinnedPanel = document.getElementById('pinnedPanel');
                if (pinnedPanel) pinnedPanel.classList.add('hidden');
                const cached = conversationCache.get(`group:${currentGroupChat}`);
                if (cached && cached.length) {
                    renderGroupConversationMessages(cached);
                }
                return;
            }
            setChatInputDisabled(false);
            conversationCache.set(`group:${currentGroupChat}`, messages);
            renderGroupConversationMessages(messages);
            conversationJustOpened = false;
            loadPinnedMessages();
            const chatSearchInput = document.getElementById('chatSearchInput');
            if (chatSearchInput && chatSearchInput.value.trim()) {
                filterChatMessages(chatSearchInput.value);
            }
        }
        async function loadPinnedMessages() {
            const panel = document.getElementById('pinnedPanel');
            if (!panel) return;

            let endpoint = null;
            if (currentChatType === 'direct' && currentConversation) {
                endpoint = `/messages/conversation/${currentConversation}/pinned`;
            } else if (currentChatType === 'group' && currentGroupChat) {
                endpoint = `/group-chats/${currentGroupChat}/pinned`;
            } else {
                panel.classList.add('hidden');
                return;
            }

            let nextPinned = [];
            try {
                nextPinned = await api(endpoint);
            } catch (e) {
                return;
            }

            nextPinned = (nextPinned || []).filter(msg => msg.is_pinned === true || msg.is_pinned === 1 || msg.is_pinned === '1');
            const nextKey = JSON.stringify(nextPinned.map(m => `${m.id}:${m.updated_at || m.created_at || ''}`));
            const currentKey = JSON.stringify(pinnedMessages.map(m => `${m.id}:${m.updated_at || m.created_at || ''}`));
            if (nextKey === currentKey) return;
            pinnedMessages = nextPinned;
            renderPinnedMessages();
        }

        function renderPinnedMessages() {
            const panel = document.getElementById('pinnedPanel');
            const single = document.getElementById('pinnedSingle');
            const allBtn = document.getElementById('btnPinnedAll');
            if (!panel || !single || !allBtn) return;

            if (!pinnedMessages.length) {
                panel.classList.add('hidden');
                return;
            }

            panel.classList.remove('hidden');
            const latest = pinnedMessages[0];
            single.innerHTML = buildPinnedPreviewHtml(latest, true);
            single.onclick = () => scrollToMessage(latest.id);
            initAudioPlayers(panel);
        }

        function openPinnedModal() {
            const list = document.getElementById('pinnedModalList');
            if (!list) return;
            list.innerHTML = '';
            if (!pinnedMessages.length) {
                list.innerHTML = '<div class="text-sm text-gray-500">Пока пусто</div>';
            } else {
                pinnedMessages.forEach(msg => {
                    const item = document.createElement('div');
                    item.className = 'pinned-item pinned-item-row';

                    const preview = document.createElement('div');
                    preview.className = 'pinned-item-link';
                    preview.innerHTML = buildPinnedPreviewHtml(msg, false);
                    preview.addEventListener('click', (event) => {
                        if (event.target.closest('button') || event.target.closest('audio') || event.target.closest('.audio-player')) {
                            return;
                        }
                        closeModal('pinnedModal');
                        scrollToMessage(msg.id);
                    });

                    const unpinBtn = document.createElement('button');
                    unpinBtn.type = 'button';
                    unpinBtn.className = 'pinned-unpin';
                    unpinBtn.textContent = '×';
                    unpinBtn.setAttribute('aria-label', 'Открепить');
                    unpinBtn.onclick = async (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        await unpinPinnedMessage(msg.id);
                    };

                    item.appendChild(preview);
                    item.appendChild(unpinBtn);
                    list.appendChild(item);
                });
            }
            initAudioPlayers(list);
            openModal('pinnedModal');
        }

        function buildPinnedPreviewHtml(msg, compact = false) {
            const sender = getMessageSenderName(msg);
            const text = getPlainMessageText(msg.body || '');
            const parts = [];
            const rootClass = compact ? 'pinned-preview is-compact' : 'pinned-preview';
            parts.push(`<div class="pinned-sender">От: ${escapeHtml(sender)}</div>`);
            if (text) {
                parts.push(`<div class="pinned-text">${escapeHtml(text)}</div>`);
            }
            if (msg.image_url) {
                parts.push(`<img class="pinned-preview-image" src="${msg.image_url}" alt="Pinned image">`);
            }
            if (msg.audio_url) {
                const timeLabel = msg.created_at
                    ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                    : '';
                parts.push(`<div class="pinned-preview-audio">${buildAudioPlayerHtml(msg.audio_url, timeLabel)}</div>`);
            }
            if (!text && !msg.image_url && !msg.audio_url) {
                parts.push('<div class="pinned-text">Сообщение</div>');
            }
            return `<div class="${rootClass}">${parts.join('')}</div>`;
        }

        async function unpinPinnedMessage(messageId) {
            if (!messageId) return;
            try {
                if (currentChatType === 'group' && currentGroupChat) {
                    await api(`/group-chats/${currentGroupChat}/messages/${messageId}/pin`, 'DELETE');
                    await loadGroupConversation();
                } else if (currentConversation) {
                    await api(`/messages/${messageId}/pin`, 'DELETE');
                    await loadConversation();
                }
                await loadPinnedMessages();
                openPinnedModal();
            } catch (e) {
                alert('Ошибка открепления: ' + e.message);
            }
        }

        function scrollToMessage(messageId) {
            const target = document.querySelector(`[data-msg-id="${messageId}"]`);
            if (!target) {
                alert('Сообщение не загружено.');
                return;
            }
            target.scrollIntoView({ block: 'center', behavior: 'smooth' });
            target.classList.add('message-search-focus');
            setTimeout(() => target.classList.remove('message-search-focus'), 600);
        }

        async function togglePinMessage() {
            if (!currentMessage) return;
            try {
                const isPinned = isMessagePinned(currentMessage);
                if (currentChatType === 'group' && currentGroupChat) {
                    const method = isPinned ? 'DELETE' : 'POST';
                    const result = await api(`/group-chats/${currentGroupChat}/messages/${currentMessage.id}/pin`, method);
                    currentMessage.is_pinned = result.is_pinned;
                    await loadGroupConversation();
                } else {
                    const method = isPinned ? 'DELETE' : 'POST';
                    const result = await api(`/messages/${currentMessage.id}/pin`, method);
                    currentMessage.is_pinned = result.is_pinned;
                    await loadConversation();
                }
                hideMessageMenu();
            } catch (e) {
                alert('Ошибка закрепления: ' + e.message);
            }
        }

        async function leaveGroupChat() {
            if (!currentGroupChat) return;
            if (!confirm('Покинуть группу?')) return;
            try {
                await api(`/group-chats/${currentGroupChat}/leave`, 'POST');
                currentGroupChat = null;
                currentGroupChatName = null;
                setChatTab('group');
            } catch (e) {
                alert('Ошибка: ' + e.message);
            }
        }

        async function deleteGroupChat() {
            if (!currentGroupChat) return;
            if (!confirm('Удалить группу для всех?')) return;
            try {
                await api(`/group-chats/${currentGroupChat}`, 'DELETE');
                currentGroupChat = null;
                currentGroupChatName = null;
                setChatTab('group');
            } catch (e) {
                alert('Ошибка: ' + e.message);
            }
        }

        async function deleteConversation() {
            if (!currentConversation) return;
            if (!confirm('Удалить диалог только у вас?')) return;
            try {
                await api(`/messages/conversation/${currentConversation}`, 'PATCH');
                currentConversation = null;
                currentConversationName = null;
                setChatTab('direct');
            } catch (e) {
                alert('Ошибка удаления: ' + e.message);
            }
        }

        async function deleteConversationForAll() {
            if (!currentConversation) return;
            if (!confirm('Удалить диалог у всех?')) return;
            try {
                await api(`/messages/conversation/${currentConversation}`, 'DELETE');
                currentConversation = null;
                currentConversationName = null;
                setChatTab('direct');
            } catch (e) {
                alert('Ошибка удаления: ' + e.message);
            }
        }

        function escapeRegExp(value) {
            return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function escapeHtml(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function highlightHtml(text, query) {
            if (!query) return escapeHtml(text);
            const safeQuery = escapeRegExp(query);
            const re = new RegExp(safeQuery, 'gi');
            return escapeHtml(text).replace(re, (match) => `<mark class="message-mark">${match}</mark>`);
        }

        function closeChatMenu() {
            const panel = document.getElementById('chatMenu');
            if (panel) panel.classList.add('hidden');
        }

        function toggleChatMenu() {
            const panel = document.getElementById('chatMenu');
            if (!panel) return;
            panel.classList.toggle('hidden');
        }

        let chatSearchMatches = [];
        let chatSearchIndex = -1;

        function focusChatMatch(index) {
            if (!chatSearchMatches.length) return;
            chatSearchIndex = ((index % chatSearchMatches.length) + chatSearchMatches.length) % chatSearchMatches.length;
            const target = chatSearchMatches[chatSearchIndex];
            target.scrollIntoView({ block: 'center', behavior: 'smooth' });
            target.classList.add('message-search-focus');
            setTimeout(() => target.classList.remove('message-search-focus'), 600);
        }

        function filterChatMessages(query) {
            const chatMessages = document.getElementById('chatMessages');
            if (!chatMessages) return;
            const rawQuery = (query || '').trim();
            const text = rawQuery.toLowerCase();
            const bubbles = chatMessages.querySelectorAll('.message-bubble');
            chatSearchMatches = [];
            chatSearchIndex = -1;
            bubbles.forEach(bubble => {
                const haystack = (bubble.getAttribute('data-message-text') || '').toLowerCase();
                const match = !text || haystack.includes(text);
                bubble.classList.toggle('message-hidden', !match);
                bubble.classList.toggle('message-highlight', match && text);
                const textEl = bubble.querySelector('.message-text');
                if (textEl) {
                    const rawText = textEl.dataset.raw || '';
                    textEl.innerHTML = match && text ? highlightHtml(rawText, rawQuery) : escapeHtml(rawText);
                }
                if (match && text) chatSearchMatches.push(bubble);
            });
            if (chatSearchMatches.length) focusChatMatch(0);
        }

        let currentMessage = null;
        let menuHideTimer = null;
        let menuHovering = false;
        let replyTargetMessage = null;
        let forwardTargetMessage = null;
        let pendingForwardMessage = null;
        let pinnedMessages = [];
        const conversationCache = new Map();
        const audioState = new Map();

        function isMessagePinned(msg) {
            if (!msg) return false;
            if (msg.is_pinned === true || msg.is_pinned === 1 || msg.is_pinned === '1') return true;
            return pinnedMessages.some(pinned => pinned.id === msg.id);
        }

        function showMessageMenu(el, msg) {
            currentMessage = msg;
            const menu = document.getElementById('messageMenu');
            const picker = document.getElementById('reactionPicker');
            const chatArea = document.getElementById('chatMessages');
            const chatColumn = document.querySelector('.chat-column');
            const bubble = el.querySelector('.message-content') || el;
            const msgRect = bubble.getBoundingClientRect();
            const areaRect = chatArea.getBoundingClientRect();
            const colRect = chatColumn.getBoundingClientRect();
            const isOwn = msg.sender_id === currentUser.id;
            const pinBtn = document.getElementById('btnPinMessage');
            if (pinBtn) {
                pinBtn.textContent = isMessagePinned(msg) ? 'Открепить' : 'Закрепить';
            }

            clearTimeout(menuHideTimer);
            menu.classList.remove('hidden');
            picker.classList.add('hidden');
            menu.style.visibility = 'hidden';
            menu.style.left = '0px';
            menu.style.top = '0px';

            const menuRect = menu.getBoundingClientRect();
            const offset = 6;
            let left = isOwn ? msgRect.left - menuRect.width - offset : msgRect.right + offset;
            let top = msgRect.top + (msgRect.height / 2) - (menuRect.height / 2);

            const viewportLeft = 8;
            const viewportTop = 8;
            const viewportRight = window.innerWidth - 8;
            const viewportBottom = window.innerHeight - 8;

            left = Math.min(Math.max(left, viewportLeft), viewportRight - menuRect.width);
            top = Math.min(Math.max(top, viewportTop), viewportBottom - menuRect.height);

            const clampedLeft = Math.min(Math.max(left, areaRect.left + 6), areaRect.right - menuRect.width - 6);
            const clampedTop = Math.min(Math.max(top, areaRect.top + 6), areaRect.bottom - menuRect.height - 6);

            menu.style.left = (clampedLeft - colRect.left) + 'px';
            menu.style.top = (clampedTop - colRect.top) + 'px';
            menu.style.visibility = 'visible';
        }

        function hideMessageMenu() {
            const menu = document.getElementById('messageMenu');
            menu.classList.add('hidden');
            menu.style.visibility = 'hidden';
            hideReactionPicker();
            currentMessage = null;
        }

        function scheduleHideMessageMenu() {
            clearTimeout(menuHideTimer);
            menuHideTimer = setTimeout(() => {
                if (!menuHovering) hideMessageMenu();
            }, 120);
        }

        const messageMenu = document.getElementById('messageMenu');
        if (messageMenu) {
            messageMenu.addEventListener('mouseenter', () => {
                menuHovering = true;
                clearTimeout(menuHideTimer);
            });
            messageMenu.addEventListener('mouseleave', () => {
                menuHovering = false;
                scheduleHideMessageMenu();
            });
        }

        const reactionPicker = document.getElementById('reactionPicker');
        if (reactionPicker) {
            reactionPicker.addEventListener('mouseenter', () => {
                menuHovering = true;
                clearTimeout(menuHideTimer);
            });
            reactionPicker.addEventListener('mouseleave', () => {
                menuHovering = false;
                scheduleHideMessageMenu();
            });
        }

        document.addEventListener('click', (event) => {
            const menu = document.getElementById('messageMenu');
            if (menu.classList.contains('hidden')) return;
            if (menu.contains(event.target)) return;
            if (event.target.closest('.message-bubble')) return;
            hideMessageMenu();
        });

        document.addEventListener('click', (event) => {
            const picker = document.getElementById('reactionPicker');
            if (picker.classList.contains('hidden')) return;
            if (picker.contains(event.target)) return;
            if (event.target.closest('#messageMenu')) return;
            hideReactionPicker();
        });

        const btnChatMenu = document.getElementById('btnChatMenu');
        if (btnChatMenu) {
            btnChatMenu.addEventListener('click', (event) => {
                event.stopPropagation();
                toggleChatMenu();
            });
        }

        const btnPinnedAll = document.getElementById('btnPinnedAll');
        if (btnPinnedAll) {
            btnPinnedAll.addEventListener('click', () => {
                openPinnedModal();
            });
        }

        const chatSearchInput = document.getElementById('chatSearchInput');
        if (chatSearchInput) {
            chatSearchInput.addEventListener('input', (event) => {
                filterChatMessages(event.target.value);
            });
        }

        const btnSearchPrev = document.getElementById('btnSearchPrev');
        if (btnSearchPrev) {
            btnSearchPrev.addEventListener('click', () => {
                if (!chatSearchMatches.length) return;
                focusChatMatch(chatSearchIndex - 1);
            });
        }

        const btnSearchNext = document.getElementById('btnSearchNext');
        if (btnSearchNext) {
            btnSearchNext.addEventListener('click', () => {
                if (!chatSearchMatches.length) return;
                focusChatMatch(chatSearchIndex + 1);
            });
        }

        document.addEventListener('click', (event) => {
            const panel = document.getElementById('chatMenu');
            if (!panel || panel.classList.contains('hidden')) return;
            if (panel.contains(event.target)) return;
            if (event.target.closest('#btnChatMenu')) return;
            closeChatMenu();
        });

        async function deleteMessage() {
            if (!currentMessage) return;
            if (currentMessage.sender_id !== currentUser.id) {
                alert('Вы можете удалять только свои сообщения.');
                return;
            }
            if (!confirm('Удалить сообщение?')) return;
            try {
                if (currentChatType === 'group' && currentGroupChat) {
                    await api(`/group-chats/${currentGroupChat}/messages/${currentMessage.id}`, 'DELETE');
                    hideMessageMenu();
                    loadGroupConversation();
                    return;
                }
                await api(`/messages/${currentMessage.id}`, 'DELETE');
                hideMessageMenu();
                loadConversation();
            } catch (e) {
                alert('Ошибка: ' + e.message);
            }
        }

        function replyToMessage() {
            if (!currentMessage) return;
            clearForward();
            replyTargetMessage = currentMessage;
            const preview = document.getElementById('replyPreview');
            const previewText = document.getElementById('replyPreviewText');
            previewText.textContent = getPlainMessageText(currentMessage.body);
            preview.classList.remove('hidden');
            document.getElementById('messageInput').focus();
            hideMessageMenu();
        }

        function forwardMessage() {
            if (!currentMessage) return;
            pendingForwardMessage = currentMessage;
            openModal('forwardModal');
            loadForwardFriends();
            hideMessageMenu();
        }

        function reactToMessage() {
            if (!currentMessage) return;
            showReactionPicker();
        }

        function showReactionPicker() {
            const picker = document.getElementById('reactionPicker');
            const menu = document.getElementById('messageMenu');
            const chatColumn = document.querySelector('.chat-column');
            const menuRect = menu.getBoundingClientRect();
            const colRect = chatColumn.getBoundingClientRect();

            picker.classList.remove('hidden');
            picker.style.visibility = 'hidden';
            picker.style.left = '0px';
            picker.style.top = '0px';

            const pickerRect = picker.getBoundingClientRect();
            const offset = 8;
            let left = menuRect.right + offset;
            let top = menuRect.top + (menuRect.height / 2) - (pickerRect.height / 2);

            const viewportLeft = 8;
            const viewportTop = 8;
            const viewportRight = window.innerWidth - 8;
            const viewportBottom = window.innerHeight - 8;

            left = Math.min(Math.max(left, viewportLeft), viewportRight - pickerRect.width);
            top = Math.min(Math.max(top, viewportTop), viewportBottom - pickerRect.height);

            picker.style.left = (left - colRect.left) + 'px';
            picker.style.top = (top - colRect.top) + 'px';
            picker.style.visibility = 'visible';
        }

        function hideReactionPicker() {
            const picker = document.getElementById('reactionPicker');
            picker.classList.add('hidden');
            picker.style.visibility = 'hidden';
        }

        function selectReaction(emoji) {
            if (!currentMessage || !currentUser) return;
            toggleReaction(currentMessage.id, emoji, true);
        }

        async function toggleReaction(messageId, emoji, closePicker = false) {
            try {
                const endpoint = (currentChatType === 'group' && currentGroupChat)
                    ? `/group-chats/${currentGroupChat}/messages/${messageId}/reactions`
                    : `/messages/${messageId}/reactions`;
                const result = await api(endpoint, 'POST', { emoji });
                renderReactions(messageId, result.reactions || []);
            } catch (e) {
                alert('Ошибка реакции: ' + e.message);
            } finally {
                if (closePicker) hideReactionPicker();
            }
        }

        function toggleReactionFromChip(messageId, emoji) {
            toggleReaction(messageId, emoji, false);
        }

        function clearReply() {
            replyTargetMessage = null;
            document.getElementById('replyPreview').classList.add('hidden');
            document.getElementById('replyPreviewText').textContent = '';
        }

        function clearForward() {
            forwardTargetMessage = null;
            pendingForwardMessage = null;
            document.getElementById('forwardPreview').classList.add('hidden');
            document.getElementById('forwardPreviewText').textContent = '';
            document.getElementById('forwardPreviewTitle').textContent = 'Переслано от пользователя';
        }

        function getMessageSenderName(msg) {
            if (msg && msg.sender) return getDisplayName(msg.sender);
            if (msg && msg.sender_name) return msg.sender_name;
            return 'пользователя';
        }

        function setForwardTarget(msg) {
            forwardTargetMessage = msg;
            const preview = document.getElementById('forwardPreview');
            const previewTitle = document.getElementById('forwardPreviewTitle');
            const previewText = document.getElementById('forwardPreviewText');
            const senderName = getMessageSenderName(msg);
            previewTitle.textContent = `Переслано от ${senderName}`;
            previewText.textContent = getPlainMessageText(msg.body || '');
            preview.classList.remove('hidden');
            document.getElementById('messageInput').focus();
        }

        function renderReactions(messageId, reactions) {
            const container = document.querySelector(`[data-reaction-for="${messageId}"]`);
            if (!container) return;

            const grouped = {};
            (reactions || []).forEach(reaction => {
                const emoji = reaction.emoji;
                if (!grouped[emoji]) grouped[emoji] = [];
                if (reaction.user) grouped[emoji].push(getDisplayName(reaction.user));
            });

            const emojis = Object.keys(grouped);
            if (!emojis.length) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = emojis.map(emoji => {
                const names = grouped[emoji] || [];
                const label = names.length ? names.join(', ') : '';
                return `
                    <button class="reaction-chip" onclick="toggleReactionFromChip(${messageId}, '${emoji}')">
                        <span class="reaction-emoji">${emoji}</span>
                        <span class="reaction-count">${names.length}</span>
                        ${label ? `<div class="reaction-tooltip">${label}</div>` : ''}
                    </button>
                `;
            }).join('');
        }

        async function loadForwardFriends() {
            const list = document.getElementById('forwardList');
            const empty = document.getElementById('forwardEmpty');
            list.innerHTML = '';
            empty.classList.add('hidden');
            try {
                const friends = await api('/friends');
                if (!friends.length) {
                    empty.classList.remove('hidden');
                    return;
                }
                friends.forEach(friend => {
                    const el = document.createElement('button');
                    el.type = 'button';
                    el.className = 'forward-item';
                    el.textContent = getDisplayName(friend);
                    el.onclick = () => selectForwardTarget(friend.id, getDisplayName(friend));
                    list.appendChild(el);
                });
            } catch (e) {
                empty.textContent = 'Ошибка загрузки друзей';
                empty.classList.remove('hidden');
            }
        }

        async function selectForwardTarget(userId, userName) {
            if (!pendingForwardMessage) return;
            const message = pendingForwardMessage;
            closeModal('forwardModal');
            await openConversation(userId, userName);
            clearReply();
            setForwardTarget(message);
            pendingForwardMessage = null;
        }

        function parseMessageBody(body) {
            let rest = body || '';
            let forwardFrom = '';
            let forwardText = '';
            let replyText = '';
            let systemText = '';

            const systemMatch = rest.match(/^\[\[system\]\]([\s\S]*?)\[\[\/system\]\]\s*$/);
            if (systemMatch) {
                systemText = systemMatch[1] || '';
                return { text: '', replyText: '', forwardText: '', forwardFrom: '', systemText };
            }

            const forwardMatch = rest.match(/^\[\[forward:([^\]]+)\]\]([\s\S]*?)\[\[\/forward\]\]\n?([\s\S]*)$/);
            if (forwardMatch) {
                forwardFrom = forwardMatch[1] || '';
                forwardText = forwardMatch[2] || '';
                rest = forwardMatch[3] || '';
            }

            const replyMatch = rest.match(/^\[\[reply:(\d+)\]\]([\s\S]*?)\[\[\/reply\]\]\n?([\s\S]*)$/);
            if (replyMatch) {
                replyText = replyMatch[2] || '';
                rest = replyMatch[3] || '';
            }

            return { text: rest, replyText, forwardText, forwardFrom, systemText };
        }

        function getPlainMessageText(body) {
            const parsed = parseMessageBody(body || '');
            if (parsed.systemText) return parsed.systemText;
            if (parsed.text) return parsed.text;
            if (parsed.forwardText) {
                const nested = parseMessageBody(parsed.forwardText || '');
                return nested.text || nested.forwardText || parsed.forwardText;
            }
            if (parsed.replyText) return parsed.replyText;
            return body || '';
        }

        function buildReplyBody(text, replyMessage) {
            return text;
        }

        function buildForwardBody(text, forwardMessage) {
            if (!forwardMessage) return text;
            const senderName = getMessageSenderName(forwardMessage);
            const forwardText = getPlainMessageText(forwardMessage.body || '');
            const base = `[[forward:${senderName}]]${forwardText}[[/forward]]`;
            if (text) return `${base}\n${text}`;
            return base;
        }

        function showChatError(message) {
            const el = document.getElementById('chatError');
            if (!el) return;
            el.textContent = message;
            el.classList.remove('hidden');
        }

        function clearChatError() {
            const el = document.getElementById('chatError');
            if (!el) return;
            el.textContent = '';
            el.classList.add('hidden');
        }

        function setChatInputDisabled(disabled, message = '') {
            const input = document.getElementById('messageInput');
            const sendBtn = document.getElementById('btnSendMessage');
            const voiceBtn = document.getElementById('btnVoiceMessage');
            const imageBtn = document.getElementById('btnImageMessage');
            const emojiBtn = document.getElementById('btnEmojiPicker');
            const inputArea = document.getElementById('chatInputArea');
            if (input) input.disabled = disabled;
            if (sendBtn) sendBtn.disabled = disabled;
            if (voiceBtn) voiceBtn.disabled = disabled;
            if (imageBtn) imageBtn.disabled = disabled;
            if (emojiBtn) emojiBtn.disabled = disabled;
            if (inputArea) inputArea.classList.toggle('chat-input-disabled', disabled);
            if (disabled && message) showChatError(message);
            if (!disabled) clearChatError();
        }

        function insertAtCursor(el, text) {
            const start = el.selectionStart ?? el.value.length;
            const end = el.selectionEnd ?? el.value.length;
            const before = el.value.slice(0, start);
            const after = el.value.slice(end);
            el.value = before + text + after;
            const newPos = start + text.length;
            el.setSelectionRange(newPos, newPos);
            el.focus();
        }

        function buildAudioPlayerHtml(audioUrl, messageTime) {
            const safeUrl = String(audioUrl || '');
            const safeTime = messageTime ? String(messageTime) : '';
            return `
                <div class="audio-player" data-audio-src="${safeUrl}" data-message-time="${safeTime}">
                    <button class="audio-play" type="button" aria-label="Play">
                        <span class="audio-icon" aria-hidden="true"></span>
                    </button>
                    <div class="audio-body">
                        <div class="audio-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100">
                            <div class="audio-line-base" aria-hidden="true"></div>
                            <div class="audio-line-fill" aria-hidden="true"></div>
                        </div>
                        <div class="audio-meta">
                            <span class="audio-meta-left">0:00</span>
                            <span class="audio-meta-right">${safeTime}</span>
                        </div>
                    </div>
                    <button class="audio-speed" type="button" aria-label="Скорость воспроизведения">1x</button>
                    <audio preload="metadata" src="${safeUrl}"></audio>
                </div>
            `;
        }

        function formatAudioTime(seconds) {
            if (!isFinite(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${String(secs).padStart(2, '0')}`;
        }

        function stopOtherAudio(currentAudio) {
            document.querySelectorAll('.audio-player audio').forEach((audio) => {
                if (audio === currentAudio) return;
                if (!audio.paused) audio.pause();
                const player = audio.closest('.audio-player');
                if (player) player.classList.remove('is-playing');
            });
        }

        let activeAudio = null;
        let stickyTickerId = null;

        function startStickyTicker() {
            if (stickyTickerId) return;
            const tick = () => {
                if (!activeAudio || !activeAudio.audio || activeAudio.audio.paused || activeAudio.audio.ended) {
                    stickyTickerId = null;
                    return;
                }
                syncStickyAudio();
                stickyTickerId = requestAnimationFrame(tick);
            };
            stickyTickerId = requestAnimationFrame(tick);
        }

        function stopStickyTicker() {
            if (stickyTickerId) {
                cancelAnimationFrame(stickyTickerId);
                stickyTickerId = null;
            }
        }

        function isPlayerVisible(player) {
            const chatMessages = document.getElementById('chatMessages');
            if (!chatMessages || !player) return true;
            const playerRect = player.getBoundingClientRect();
            const containerRect = chatMessages.getBoundingClientRect();
            return playerRect.bottom > containerRect.top && playerRect.top < containerRect.bottom;
        }

        function syncStickyAudio() {
            const sticky = document.getElementById('stickyAudioBar');
            const stickyPlay = document.getElementById('stickyAudioPlay');
            const stickyLeft = document.getElementById('stickyAudioMetaLeft');
            const stickyRight = document.getElementById('stickyAudioMetaRight');
            const stickyProgress = document.getElementById('stickyAudioProgress');
            const stickyBar = document.getElementById('stickyAudioBarLine');
            const stickySpeed = document.getElementById('stickyAudioSpeed');
            if (!sticky || !stickyPlay || !stickyLeft || !stickyRight || !stickyProgress || !stickyBar) return;

            if (!activeAudio || !activeAudio.audio) {
                sticky.classList.add('hidden');
                return;
            }

            const { audio, player } = activeAudio;
            const metaLeft = player.querySelector('.audio-meta-left');
            const metaRight = player.querySelector('.audio-meta-right');
            if (metaLeft) stickyLeft.textContent = metaLeft.textContent;
            if (metaRight) stickyRight.textContent = metaRight.textContent;
            const duration = audio.duration || 0;
            const percent = duration ? (audio.currentTime / duration) * 100 : 0;
            stickyProgress.style.width = `${percent}%`;
            stickyBar.setAttribute('aria-valuenow', String(Math.round(percent)));
            if (stickySpeed) stickySpeed.textContent = `${audio.playbackRate || 1}x`;

            if (!isPlayerVisible(player)) {
                sticky.classList.remove('hidden');
                stickyPlay.parentElement.classList.toggle('is-playing', !audio.paused);
            } else {
                sticky.classList.add('hidden');
                stickyPlay.parentElement.classList.remove('is-playing');
            }
        }

        function captureAudioState(container = document) {
            container.querySelectorAll('.audio-player').forEach((player) => {
                const audio = player.querySelector('audio');
                if (!audio) return;
                const src = audio.currentSrc || audio.src;
                if (!src) return;
                const existing = audioState.get(src) || {};
                const duration = audio.duration || existing.duration || 0;
                const size = player.dataset.audioSize || existing.size || '';
                audioState.set(src, {
                    time: audio.currentTime || existing.time || 0,
                    duration,
                    size,
                    pendingPct: existing.pendingPct,
                    rate: audio.playbackRate || existing.rate || 1
                });
            });
        }

        function isAnyAudioPlaying() {
            const audios = document.querySelectorAll('.audio-player audio');
            return Array.from(audios).some(audio => !audio.paused && !audio.ended);
        }

        function initAudioPlayers(container = document) {
            const players = container.querySelectorAll('.audio-player:not([data-init])');
            players.forEach((player) => {
                player.dataset.init = '1';
                const audio = player.querySelector('audio');
                const playBtn = player.querySelector('.audio-play');
                const bar = player.querySelector('.audio-bar');
                const progress = player.querySelector('.audio-line-fill');
                const metaLeft = player.querySelector('.audio-meta-left');
                const metaRight = player.querySelector('.audio-meta-right');
                const speedBtn = player.querySelector('.audio-speed');
                if (!audio || !playBtn || !bar || !progress || !metaLeft || !metaRight) return;
                if (audio.readyState === 0) {
                    audio.preload = 'metadata';
                    audio.load();
                }
                const speedOptions = [1, 1.2, 1.5, 1.75, 2];

                const applySpeed = (rate) => {
                    const nextRate = rate && isFinite(rate) ? rate : 1;
                    audio.playbackRate = nextRate;
                    if (speedBtn) speedBtn.textContent = `${nextRate}x`;
                    const src = audio.currentSrc || audio.src;
                    if (src) {
                        const cached = audioState.get(src) || {};
                        audioState.set(src, { ...cached, rate: nextRate });
                    }
                    if (activeAudio && activeAudio.audio === audio) {
                        const stickySpeed = document.getElementById('stickyAudioSpeed');
                        if (stickySpeed) stickySpeed.textContent = `${nextRate}x`;
                    }
                };

                const updateMetaLeft = () => {
                    const src = audio.currentSrc || audio.src;
                    const cached = src ? audioState.get(src) : null;
                    const duration = audio.duration || (cached ? cached.duration : 0) || 0;
                    const current = isFinite(audio.currentTime) && audio.currentTime > 0
                        ? audio.currentTime
                        : (cached && cached.time ? cached.time : 0);
                    const size = player.dataset.audioSize || (cached ? cached.size : '');
                    const currentText = formatAudioTime(current);
                    const durationText = formatAudioTime(duration);
                    const baseText = `${currentText} / ${durationText}`;
                    metaLeft.textContent = size ? `${baseText}, ${size}` : baseText;
                };

                const updateTime = () => {
                    const duration = audio.duration || 0;
                    const current = audio.currentTime || 0;
                    const percent = duration ? (current / duration) * 100 : 0;
                    progress.style.width = `${percent}%`;
                    bar.setAttribute('aria-valuenow', String(Math.round(percent)));
                    const src = audio.currentSrc || audio.src;
                    if (src) {
                        const cached = audioState.get(src) || {};
                        audioState.set(src, {
                            time: current,
                            duration: audio.duration || cached.duration || 0,
                            size: cached.size || player.dataset.audioSize || ''
                        });
                    }
                    updateMetaLeft();
                };

                const applyPendingSeek = () => {
                    const src = audio.currentSrc || audio.src;
                    const cached = src ? audioState.get(src) : null;
                    const rawPct = player.dataset.seekPct ?? (cached ? cached.pendingPct : undefined);
                    if (rawPct === undefined) return;
                    const pct = parseFloat(rawPct);
                    if (!isFinite(pct)) {
                        delete player.dataset.seekPct;
                        if (cached && cached.pendingPct !== undefined) {
                            audioState.set(src, { ...cached, pendingPct: undefined });
                        }
                        return;
                    }
                    const rawDuration = audio.duration;
                    const seekableEnd = audio.seekable && audio.seekable.length
                        ? audio.seekable.end(audio.seekable.length - 1)
                        : 0;
                    const duration = (isFinite(rawDuration) && rawDuration > 0)
                        ? rawDuration
                        : (isFinite(seekableEnd) && seekableEnd > 0 ? seekableEnd : 0);
                    if (duration) {
                        const target = pct * duration;
                        if (audio.fastSeek) {
                            audio.fastSeek(target);
                        } else {
                            audio.currentTime = target;
                        }
                        delete player.dataset.seekPct;
                        if (cached) {
                            audioState.set(src, { ...cached, pendingPct: undefined });
                        }
                    }
                };

                const initialMessageTime = player.dataset.messageTime;
                if (initialMessageTime) metaRight.textContent = initialMessageTime;
                updateMetaLeft();

                audio.addEventListener('loadedmetadata', () => {
                    const messageTime = player.dataset.messageTime;
                    if (messageTime) metaRight.textContent = messageTime;
                    updateMetaLeft();
                    const saved = audioState.get(audio.currentSrc || audio.src);
                    if (saved && typeof saved.time === 'number' && isFinite(saved.time)) {
                        audio.currentTime = Math.min(saved.time, audio.duration || saved.time);
                    }
                    if (saved && saved.rate) {
                        applySpeed(saved.rate);
                    } else {
                        applySpeed(1);
                    }
                    applyPendingSeek();
                    updateTime();
                    if (activeAudio && activeAudio.audio === audio) {
                        syncStickyAudio();
                    }
                });
                audio.addEventListener('canplay', applyPendingSeek);
                audio.addEventListener('timeupdate', () => {
                    updateTime();
                    if (activeAudio && activeAudio.audio === audio) {
                        syncStickyAudio();
                    }
                });
                audio.addEventListener('ended', () => {
                    player.classList.remove('is-playing');
                    audio.currentTime = 0;
                    updateTime();
                    if (activeAudio && activeAudio.audio === audio) {
                        activeAudio = null;
                        syncStickyAudio();
                    }
                    stopStickyTicker();
                });

                playBtn.addEventListener('click', () => {
                    if (audio.paused) {
                        stopOtherAudio(audio);
                        audio.play();
                        player.classList.add('is-playing');
                        activeAudio = { audio, player };
                        syncStickyAudio();
                        startStickyTicker();
                    } else {
                        audio.pause();
                        player.classList.remove('is-playing');
                        syncStickyAudio();
                        stopStickyTicker();
                    }
                });

                if (speedBtn) {
                    speedBtn.addEventListener('click', () => {
                        const current = audio.playbackRate || 1;
                        const index = speedOptions.indexOf(current);
                        const next = speedOptions[(index + 1) % speedOptions.length];
                        applySpeed(next);
                    });
                }

                const audioUrl = audio.currentSrc || audio.src;
                if (audioUrl) {
                    fetch(audioUrl, { method: 'HEAD' })
                        .then((res) => {
                            const size = res.headers.get('content-length');
                            if (!size) return;
                            const kb = Math.round(parseInt(size, 10) / 1024);
                            player.dataset.audioSize = `${kb} KB`;
                            const cached = audioState.get(audioUrl) || {};
                            audioState.set(audioUrl, {
                                time: cached.time || 0,
                                duration: cached.duration || audio.duration || 0,
                                size: `${kb} KB`
                            });
                            updateMetaLeft();
                        })
                        .catch(() => {});
                }
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            const chatMessages = document.getElementById('chatMessages');
            const stickyPlay = document.getElementById('stickyAudioPlay');
            const stickyBar = document.getElementById('stickyAudioBarLine');
            const stickyClose = document.getElementById('stickyAudioClose');
            const stickySpeed = document.getElementById('stickyAudioSpeed');
            if (chatMessages) {
                chatMessages.addEventListener('scroll', syncStickyAudio);
            }
            if (stickyPlay) {
                stickyPlay.addEventListener('click', () => {
                    if (!activeAudio || !activeAudio.audio) return;
                    const audio = activeAudio.audio;
                    if (audio.paused) {
                        stopOtherAudio(audio);
                        audio.play();
                        startStickyTicker();
                    } else {
                        audio.pause();
                        stopStickyTicker();
                    }
                    syncStickyAudio();
                });
            }
            if (stickySpeed) {
                stickySpeed.addEventListener('click', () => {
                    if (!activeAudio || !activeAudio.audio) return;
                    const audio = activeAudio.audio;
                    const speedOptions = [1, 1.2, 1.5, 1.75, 2];
                    const current = audio.playbackRate || 1;
                    const index = speedOptions.indexOf(current);
                    const next = speedOptions[(index + 1) % speedOptions.length];
                    audio.playbackRate = next;
                    stickySpeed.textContent = `${next}x`;
                    const src = audio.currentSrc || audio.src;
                    if (src) {
                        const cached = audioState.get(src) || {};
                        audioState.set(src, { ...cached, rate: next });
                    }
                    const playerSpeed = activeAudio.player
                        ? activeAudio.player.querySelector('.audio-speed')
                        : null;
                    if (playerSpeed) playerSpeed.textContent = `${next}x`;
                });
            }
            if (stickyClose) {
                stickyClose.addEventListener('click', () => {
                    if (activeAudio && activeAudio.audio) {
                        activeAudio.audio.pause();
                        if (activeAudio.player) {
                            activeAudio.player.classList.remove('is-playing');
                        }
                    }
                    activeAudio = null;
                    stopStickyTicker();
                    syncStickyAudio();
                });
            }
            if (stickyBar) {
                stickyBar.setAttribute('aria-disabled', 'true');
            }
            window.addEventListener('resize', syncStickyAudio);
        });

        async function initEmojiPicker() {
            const input = document.getElementById('messageInput');
            const btn = document.getElementById('btnEmojiPicker');
            const panel = document.getElementById('emojiPickerPanel');
            const root = document.getElementById('emojiPickerRoot');
            if (!input || !btn || !panel || !root) return;

            if (!window.picmo || !window.picmo.createPicker) {
                btn.disabled = true;
                btn.title = 'Эмодзи недоступны';
                return;
            }

            let ruMessages;
            try {
                const res = await fetch('https://cdn.jsdelivr.net/npm/emojibase-data@latest/ru/messages.json');
                if (res.ok) ruMessages = await res.json();
            } catch {}

            const picker = picmo.createPicker({
                rootElement: root,
                locale: 'ru',
                messages: ruMessages
            });
            const applyPickerTheme = () => {
                const pickerEl = root.querySelector('.picmo__picker');
                if (!pickerEl) return;
                pickerEl.classList.remove('picmo__light', 'picmo__dark');
            };
            setTimeout(applyPickerTheme, 0);

            picker.addEventListener('emoji:select', (event) => {
                insertAtCursor(input, event.emoji);
                panel.classList.add('hidden');
            });

            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                panel.classList.toggle('hidden');
                if (!panel.classList.contains('hidden')) {
                    applyPickerTheme();
                    positionEmojiPanel(panel, btn);
                }
            });

            document.addEventListener('click', (event) => {
                const clickedInside = panel.contains(event.target) || btn.contains(event.target);
                if (!clickedInside) panel.classList.add('hidden');
            });

            window.addEventListener('resize', () => {
                if (!panel.classList.contains('hidden')) {
                    positionEmojiPanel(panel, btn);
                }
            });
            window.addEventListener('themechange', applyPickerTheme);
        }

        function positionEmojiPanel(panel, btn) {
            const panelRect = panel.getBoundingClientRect();
            const btnRect = btn.getBoundingClientRect();
            const padding = 8;
            let left = btnRect.right - panelRect.width;
            let top = btnRect.top - panelRect.height - 10;

            if (left < padding) left = padding;
            if (left + panelRect.width > window.innerWidth - padding) {
                left = window.innerWidth - panelRect.width - padding;
            }

            if (top < padding) {
                top = btnRect.bottom + 10;
            }

            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
        }

        function renderConversationMessages(messages) {
            const chatMessages = document.getElementById('chatMessages');
            const shouldScroll = conversationJustOpened || isNearBottom(chatMessages);
            captureAudioState(chatMessages);
            chatMessages.innerHTML = '';
            messages.forEach(msg => {
                const el = document.createElement('div');
                el.setAttribute('data-msg-id', msg.id);
                const parsed = parseMessageBody(msg.body);
                if (parsed.systemText) {
                    el.className = 'message-bubble message-system';
                    el.setAttribute('data-message-text', parsed.systemText);
                    el.innerHTML = `
                        <div class="message-content">
                            <p class="message-text">${escapeHtml(parsed.systemText)}</p>
                        </div>
                    `;
                    chatMessages.appendChild(el);
                    return;
                }
                el.className = `message-bubble ${msg.sender_id === currentUser.id ? 'message-own' : 'message-other'}`;
                const forwardDisplayText = parsed.forwardText ? getPlainMessageText(parsed.forwardText) : '';
                const replyDisplayText = msg.reply_to
                    ? getPlainMessageText(msg.reply_to.body || '')
                    : (parsed.replyText ? getPlainMessageText(parsed.replyText) : '');
                const messageText = parsed.text || '';
                el.setAttribute('data-message-text', messageText);
                const status = msg.sender_id === currentUser.id ? (msg.read_at ? '✓✓' : '✓') : '';
                el.innerHTML = `
                    <div class="message-content">
                        ${forwardDisplayText ? `<div class="forward-snippet"><div class="forward-title">Переслано от ${parsed.forwardFrom || 'пользователя'}</div><div class="forward-text">${forwardDisplayText}</div></div>` : ''}
                        ${replyDisplayText ? `<div class="reply-snippet">${replyDisplayText}</div>` : ''}
                        ${messageText ? `<p class="message-text">${escapeHtml(messageText)}</p>` : ''}
                        ${msg.image_url ? `<img class="message-image" src="${msg.image_url}" alt="Message image">` : ''}
                        ${msg.audio_url ? buildAudioPlayerHtml(msg.audio_url, new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})) : ''}
                        ${msg.audio_url ? '' : `<span class="message-time">${new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ${status}</span>`}
                        <div class="reaction-bar" data-reaction-for="${msg.id}"></div>
                    </div>
                `;
                const hoverTarget = el.querySelector('.message-content') || el;
                hoverTarget.addEventListener('contextmenu', (event) => {
                    event.preventDefault();
                    showMessageMenu(el, msg);
                });
                chatMessages.appendChild(el);
                renderReactions(msg.id, msg.reactions || []);
                const textEl = el.querySelector('.message-text');
                if (textEl) textEl.dataset.raw = messageText;
            });
            if (shouldScroll) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            initAudioPlayers(chatMessages);
        }

        function renderGroupConversationMessages(messages) {
            const chatMessages = document.getElementById('chatMessages');
            const shouldScroll = conversationJustOpened || isNearBottom(chatMessages);
            captureAudioState(chatMessages);
            chatMessages.innerHTML = '';
            messages.forEach(msg => {
                const el = document.createElement('div');
                const isOwn = msg.sender_id === currentUser.id;
                if (msg.is_system) {
                    el.className = 'message-bubble message-system';
                } else {
                    el.className = `message-bubble ${isOwn ? 'message-own' : 'message-other'} group-message`;
                }
                el.setAttribute('data-msg-id', msg.id);
                const parsed = parseMessageBody(msg.body);
                const forwardDisplayText = parsed.forwardText ? getPlainMessageText(parsed.forwardText) : '';
                const replyDisplayText = msg.reply_to
                    ? getPlainMessageText(msg.reply_to.body || '')
                    : (parsed.replyText ? getPlainMessageText(parsed.replyText) : '');
                const messageText = parsed.text || '';
                el.setAttribute('data-message-text', messageText);
                el.innerHTML = `
                    <div class="message-content">
                        ${msg.is_system ? '' : `
                        <div class="group-message-author">
                            ${getAvatarHtml(msg.sender, 'sm')}
                            <span class="group-author-name">${getDisplayName(msg.sender)}</span>
                        </div>
                        `}
                        ${forwardDisplayText ? `<div class="forward-snippet"><div class="forward-title">Переслано от ${parsed.forwardFrom || 'пользователя'}</div><div class="forward-text">${forwardDisplayText}</div></div>` : ''}
                        ${replyDisplayText ? `<div class="reply-snippet">${replyDisplayText}</div>` : ''}
                        ${messageText ? `<p class="message-text">${escapeHtml(messageText)}</p>` : ''}
                        ${msg.image_url ? `<img class="message-image" src="${msg.image_url}" alt="Message image">` : ''}
                        ${msg.audio_url ? buildAudioPlayerHtml(msg.audio_url, new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})) : ''}
                        ${msg.audio_url ? '' : `<span class="message-time">${new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>`}
                        <div class="reaction-bar" data-reaction-for="${msg.id}"></div>
                    </div>
                `;
                if (!msg.is_system) {
                    const hoverTarget = el.querySelector('.message-content') || el;
                    hoverTarget.addEventListener('contextmenu', (event) => {
                        event.preventDefault();
                        showMessageMenu(el, msg);
                    });
                }
                chatMessages.appendChild(el);
                if (!msg.is_system) renderReactions(msg.id, msg.reactions || []);
                const textEl = el.querySelector('.message-text');
                if (textEl) textEl.dataset.raw = messageText;
            });
            if (shouldScroll) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            initAudioPlayers(chatMessages);
        }

        async function sendMessage() {
            if (!currentConversation && !currentGroupChat) return;
            const input = document.getElementById('messageInput');
            const body = input.value.trim();
            if (!body && !forwardTargetMessage) return;
            try {
                clearChatError();
                const payloadBody = forwardTargetMessage
                    ? buildForwardBody(body, forwardTargetMessage)
                    : buildReplyBody(body, replyTargetMessage);
                const payload = {
                    body: payloadBody,
                    reply_to_message_id: replyTargetMessage ? replyTargetMessage.id : null
                };
                if (currentChatType === 'group' && currentGroupChat) {
                    await api(`/group-chats/${currentGroupChat}/messages`, 'POST', payload);
                } else {
                    payload.recipient_id = currentConversation;
                    await api('/messages/send', 'POST', payload);
                }
                input.value = '';
                clearReply();
                clearForward();
                if (currentChatType === 'group') {
                    loadGroupConversation();
                } else {
                    loadConversation();
                }
            } catch (e) {
                let message = 'Не удалось отправить сообщение.';
                try {
                    const parsed = JSON.parse(e.message);
                    if (parsed && parsed.message) message = parsed.message;
                } catch {
                    
                }
                if (message.toLowerCase().includes('does not accept messages')) {
                    setChatInputDisabled(true, message);
                } else {
                    showChatError(message);
                }
            }
        }

        const btnSendMessage = document.getElementById('btnSendMessage');
        if (btnSendMessage) btnSendMessage.onclick = sendMessage;

        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                }
            });
            messageInput.addEventListener('input', clearChatError);
        }

        let mediaRecorder = null;
        let mediaChunks = [];
        let isRecording = false;
        let recordTimerId = null;
        let recordStart = null;

        async function toggleVoiceRecording() {
            const btn = document.getElementById('btnVoiceMessage');
            const indicator = document.getElementById('voiceIndicator');
            const timer = document.getElementById('voiceTimer');
            if (!btn) return;
            if (isRecording) {
                mediaRecorder.stop();
                btn.innerHTML = "<img class=\"chat-tool-icon\" src=\"/storage/docs/microphone.svg\" alt=\"\">";
                btn.classList.remove('is-recording');
                indicator.classList.add('hidden');
                clearInterval(recordTimerId);
                recordTimerId = null;
                isRecording = false;
                return;
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaChunks = [];
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) mediaChunks.push(e.data);
                };
                mediaRecorder.onstop = async () => {
                    const blob = new Blob(mediaChunks, { type: 'audio/webm' });
                    const formData = new FormData();
                    formData.append('file', blob, `voice-${Date.now()}.webm`);
                    try {
                        const uploadResult = await fetch('/api/media', {
                            method: 'POST',
                            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                            body: formData
                        });
                        const uploadData = await uploadResult.json();
                        await sendAudioMessage(uploadData.url);
                    } catch (e) {
                        alert('Ошибка отправки аудио: ' + e.message);
                    }
                };
                mediaRecorder.start();
                btn.innerHTML = '<span class="record-stop" aria-hidden="true"></span>';
                btn.classList.add('is-recording');
                indicator.classList.remove('hidden');
                recordStart = Date.now();
                timer.textContent = '0:00';
                recordTimerId = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - recordStart) / 1000);
                    const minutes = Math.floor(elapsed / 60);
                    const seconds = String(elapsed % 60).padStart(2, '0');
                    timer.textContent = `${minutes}:${seconds}`;
                }, 1000);
                isRecording = true;
            } catch (e) {
                alert('Нет доступа к микрофону');
            }
        }

        async function sendAudioMessage(audioUrl) {
            if (!audioUrl) return;
            if (!currentConversation && !currentGroupChat) return;
            const payload = {
                body: '',
                audio_url: audioUrl,
                reply_to_message_id: replyTargetMessage ? replyTargetMessage.id : null
            };
            try {
                if (currentChatType === 'group' && currentGroupChat) {
                    await api(`/group-chats/${currentGroupChat}/messages`, 'POST', payload);
                    loadGroupConversation();
                } else {
                    payload.recipient_id = currentConversation;
                    await api('/messages/send', 'POST', payload);
                    loadConversation();
                }
                clearReply();
                clearForward();
            } catch (e) {
                alert('Ошибка отправки аудио: ' + e.message);
            }
        }

        async function sendImageMessage(imageUrl) {
            if (!imageUrl) return;
            if (!currentConversation && !currentGroupChat) return;
            const payload = {
                body: '',
                image_url: imageUrl,
                reply_to_message_id: replyTargetMessage ? replyTargetMessage.id : null
            };
            try {
                if (currentChatType === 'group' && currentGroupChat) {
                    await api(`/group-chats/${currentGroupChat}/messages`, 'POST', payload);
                    loadGroupConversation();
                } else {
                    payload.recipient_id = currentConversation;
                    await api('/messages/send', 'POST', payload);
                    loadConversation();
                }
                clearReply();
                clearForward();
            } catch (e) {
                alert('Ошибка отправки фото: ' + e.message);
            }
        }

        const btnVoiceMessage = document.getElementById('btnVoiceMessage');
        if (btnVoiceMessage) {
            btnVoiceMessage.addEventListener('click', toggleVoiceRecording);
        }

        const btnImageMessage = document.getElementById('btnImageMessage');
        const imageMessageInput = document.getElementById('imageMessageInput');
        if (btnImageMessage && imageMessageInput) {
            btnImageMessage.addEventListener('click', () => imageMessageInput.click());
            imageMessageInput.addEventListener('change', async () => {
                const file = imageMessageInput.files[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                    alert('Можно отправлять только фото');
                    imageMessageInput.value = '';
                    return;
                }
                const formData = new FormData();
                formData.append('file', file);
                try {
                    const uploadResult = await fetch('/api/media', {
                        method: 'POST',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                        body: formData
                    });
                    const uploadData = await uploadResult.json();
                    await sendImageMessage(uploadData.url);
                } catch (e) {
                    alert('Ошибка отправки фото: ' + e.message);
                } finally {
                    imageMessageInput.value = '';
                }
            });
        }

        // Friends page
        function showFriendsTab(tab) {
            document.querySelectorAll('.tab-button').forEach(b => {
                b.classList.remove('bg-blue-500', 'text-white');
                b.classList.add('bg-gray-200', 'text-gray-700');
            });
            const activeTab = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
            if (activeTab) {
                activeTab.classList.add('bg-blue-500', 'text-white');
                activeTab.classList.remove('bg-gray-200', 'text-gray-700');
            }
            loadFriendsContent(tab);
        }

        document.getElementById('tabFriends').onclick = () => showFriendsTab('friends');
        document.getElementById('tabIncoming').onclick = () => showFriendsTab('incoming');
        document.getElementById('tabOutgoing').onclick = () => showFriendsTab('outgoing');
        document.getElementById('tabAllUsers').onclick = () => showFriendsTab('allUsers');
        document.getElementById('tabOnline').onclick = () => showFriendsTab('online');
        document.getElementById('tabBlocked').onclick = () => showFriendsTab('blocked');

        document.getElementById('btnSearchUsers').onclick = () => {
            const query = document.getElementById('searchUsers').value;
            if (query) {
                searchUsers(query);
            } else {
                showFriendsTab('allUsers');
            }
        };

        async function loadFriendsContent(tab) {
            const content = document.getElementById('friendsContent');
            content.innerHTML = '';

            if (tab === 'friends') {
                const friends = await api('/friends');
                friends.forEach(friend => {
                    const el = document.createElement('div');
                    el.className = 'bg-gray-100 rounded-lg p-4 text-center friend-card user-card-clickable';
                    const avatar = getAvatarHtml(friend, 'lg');
                    el.innerHTML = `
                        ${avatar}
                        <p class="font-medium">${getDisplayName(friend)}</p>
                        <p class="text-sm text-gray-600">${friend.is_online ? 'Онлайн' : 'Оффлайн'}</p>
                        <div class="user-card-actions">
                            <button class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" onclick="event.stopPropagation(); removeFriend(${friend.id})">Удалить</button>
                        </div>
                    `;
                    el.addEventListener('click', () => showPage('profile', friend.id));
                    content.appendChild(el);
                });
            } else if (tab === 'incoming') {
                const requests = await api('/friends/requests');
                requests.forEach(req => {
                    const el = document.createElement('div');
                    el.className = 'bg-gray-100 rounded-lg p-4 text-center friend-card user-card-clickable';
                    const avatar = getAvatarHtml(req.requester, 'lg');
                    el.innerHTML = `
                        ${avatar}
                        <p class="font-medium">${getDisplayName(req.requester)}</p>
                        <div class="user-card-actions">
                            <button class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600" onclick="event.stopPropagation(); acceptFriend(${req.id})">Принять</button>
                            <button class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" onclick="event.stopPropagation(); declineFriend(${req.id})">Отклонить</button>
                        </div>
                    `;
                    el.addEventListener('click', () => showPage('profile', req.requester.id));
                    content.appendChild(el);
                });
            } else if (tab === 'outgoing') {
                const sentRequests = await api('/friends/requests/sent');
                sentRequests.forEach(req => {
                    const el = document.createElement('div');
                    el.className = 'bg-gray-100 rounded-lg p-4 text-center friend-card user-card-clickable';
                    const avatar = getAvatarHtml(req.recipient, 'lg');
                    el.innerHTML = `
                        ${avatar}
                        <p class="font-medium">${getDisplayName(req.recipient)}</p>
                        <div class="user-card-actions">
                            <button class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" onclick="event.stopPropagation(); cancelFriendRequest(${req.id})">Отменить</button>
                        </div>
                    `;
                    el.addEventListener('click', () => showPage('profile', req.recipient.id));
                    content.appendChild(el);
                });
            } else if (tab === 'allUsers') {
                const [users, friends] = await Promise.all([api('/users'), api('/friends')]);
                const friendIds = new Set(friends.map(friend => friend.id));
                const filtered = users.filter(user => user.id !== currentUser.id);
                const statusPromises = filtered.map(user => api(`/follow/${user.id}/status`));
                const statuses = await Promise.all(statusPromises);
                filtered.forEach((user, index) => {
                    const status = statuses[index];
                    const buttonText = status.is_following ? 'Отписаться' : 'Подписаться';
                    const el = document.createElement('div');
                    el.className = 'bg-gray-100 rounded-lg p-4 text-center friend-card user-card-clickable';
                    const avatar = getAvatarHtml(user, 'lg');
                    const isFriend = friendIds.has(user.id);
                    el.innerHTML = `
                        ${avatar}
                        <p class="font-medium">${getDisplayName(user)}</p>
                        <p class="text-sm text-gray-600">${user.is_online ? 'Онлайн' : 'Оффлайн'}</p>
                        <div class="user-card-actions">
                            <button class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600" onclick="event.stopPropagation(); toggleFollow(${user.id}, this)">${buttonText}</button>
                            ${isFriend ? '' : `<button class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600" onclick="event.stopPropagation(); sendFriendRequest(${user.id})">Добавить в друзья</button>`}
                        </div>
                    `;
                    el.addEventListener('click', () => showPage('profile', user.id));
                    content.appendChild(el);
                });
            } else if (tab === 'online') {
                const [users, friends] = await Promise.all([api('/users/online'), api('/friends')]);
                const friendIds = new Set(friends.map(friend => friend.id));
                const filtered = users.filter(user => user.id !== currentUser.id);
                const statusPromises = filtered.map(user => api(`/follow/${user.id}/status`));
                const statuses = await Promise.all(statusPromises);
                filtered.forEach((user, index) => {
                    const status = statuses[index];
                    const buttonText = status.is_following ? 'Отписаться' : 'Подписаться';
                    const el = document.createElement('div');
                    el.className = 'bg-gray-100 rounded-lg p-4 text-center friend-card user-card-clickable';
                    const avatar = getAvatarHtml(user, 'lg');
                    const isFriend = friendIds.has(user.id);
                    el.innerHTML = `
                        ${avatar}
                        <p class="font-medium">${getDisplayName(user)}</p>
                        <p class="text-sm text-green-600">Онлайн</p>
                        <div class="user-card-actions">
                            <button class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600" onclick="event.stopPropagation(); toggleFollow(${user.id}, this)">${buttonText}</button>
                            ${isFriend ? '' : `<button class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600" onclick="event.stopPropagation(); sendFriendRequest(${user.id})">Добавить в друзья</button>`}
                        </div>
                    `;
                    el.addEventListener('click', () => showPage('profile', user.id));
                    content.appendChild(el);
                });
            } else if (tab === 'blocked') {
                const blocked = await api('/blocks');
                if (!blocked.length) {
                    content.innerHTML = `<div class="text-center text-gray-500">Заблокированных нет</div>`;
                    return;
                }
                blocked.forEach(user => {
                    const el = document.createElement('div');
                    el.className = 'bg-gray-100 rounded-lg p-4 text-center friend-card user-card-clickable';
                    const avatar = getAvatarHtml(user, 'lg');
                    el.innerHTML = `
                        ${avatar}
                        <p class="font-medium">${getDisplayName(user)}</p>
                        <div class="user-card-actions">
                            <button class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" onclick="event.stopPropagation(); unblockUser(${user.id})">Разблокировать</button>
                        </div>
                    `;
                    el.addEventListener('click', () => showPage('profile', user.id));
                    content.appendChild(el);
                });
            }
        }

        async function openFollowersModal(userId, type) {
            const title = document.getElementById('followersModalTitle');
            const list = document.getElementById('followersModalList');
            list.innerHTML = '';
            title.textContent = type === 'following' ? 'Подписки' : 'Подписчики';
            openModal('followersModal');

            try {
                const data = await api(`/${type}/${userId}`);
                if (!data.length) {
                    list.innerHTML = `<div class="text-sm text-gray-500">Пока пусто</div>`;
                    return;
                }
                data.forEach(user => {
                    const el = document.createElement('div');
                    el.className = 'follow-item';
                    el.innerHTML = `
                        ${getAvatarHtml(user, 'sm')}
                        <span>${getDisplayName(user)}</span>
                    `;
                    el.onclick = () => {
                        closeModal('followersModal');
                        showPage('profile', user.id);
                    };
                    list.appendChild(el);
                });
            } catch (e) {
                list.innerHTML = `<div class="text-sm text-red-500">Ошибка загрузки</div>`;
            }
        }

        async function searchUsers() {
            const query = document.getElementById('searchUsers').value;
            if (!query) return;
            try {
                const [data, friends] = await Promise.all([
                    api('/search?q=' + encodeURIComponent(query)),
                    api('/friends')
                ]);
                const users = data.users || [];
                const content = document.getElementById('friendsContent');
                content.innerHTML = '';
                const filtered = users.filter(user => user.id !== currentUser.id);
                const friendIds = new Set(friends.map(friend => friend.id));
                const statusPromises = filtered.map(user => api(`/follow/${user.id}/status`));
                const statuses = await Promise.all(statusPromises);
                filtered.forEach((user, index) => {
                    const status = statuses[index];
                    const buttonText = status.is_following ? 'Отписаться' : 'Подписаться';
                    const el = document.createElement('div');
                    el.className = 'bg-gray-100 rounded-lg p-4 text-center user-card-clickable';
                    const avatar = getAvatarHtml(user, 'lg');
                    const isFriend = friendIds.has(user.id);
                    el.innerHTML = `
                        ${avatar}
                        <p class="font-medium">${getDisplayName(user)}</p>
                        <p class="text-sm text-gray-600">${user.is_online ? 'Онлайн' : 'Оффлайн'}</p>
                        <div class="user-card-actions">
                            <button class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600" onclick="event.stopPropagation(); toggleFollow(${user.id}, this)">${buttonText}</button>
                            ${isFriend ? '' : `<button class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600" onclick="event.stopPropagation(); sendFriendRequest(${user.id})">Добавить в друзья</button>`}
                        </div>
                    `;
                    el.addEventListener('click', () => showPage('profile', user.id));
                    content.appendChild(el);
                });
            } catch (e) {
                alert('Ошибка поиска: ' + e.message);
            }
        }

        async function sendFriendRequest(userId) {
            if (!userId || isNaN(userId)) {
                alert('Неверный ID пользователя');
                return;
            }
            try {
                await api('/friends/request', 'POST', { recipient_id: userId });
                alert('Заявка отправлена');
                showFriendsTab('allUsers');
            } catch (e) {
                try {
                    const data = JSON.parse(e.message);
                    alert('Ошибка: ' + (data.message || 'Неизвестная ошибка'));
                } catch {
                    alert('Ошибка: ' + e.message);
                }
            }
        }

        async function acceptFriend(id) {
            try {
                await api(`/friends/requests/${id}/accept`, 'POST');
                showFriendsTab('incoming');
            } catch (e) {
                try {
                    const data = JSON.parse(e.message);
                    alert('Ошибка принятия: ' + (data.message || 'Неизвестная ошибка'));
                } catch {
                    alert('Ошибка принятия: ' + e.message);
                }
            }
        }

        async function declineFriend(id) {
            try {
                await api(`/friends/requests/${id}/decline`, 'POST');
                showFriendsTab('incoming');
            } catch (e) {
                try {
                    const data = JSON.parse(e.message);
                    alert('Ошибка отклонения: ' + (data.message || 'Неизвестная ошибка'));
                } catch {
                    alert('Ошибка отклонения: ' + e.message);
                }
            }
        }

        async function removeFriend(id) {
            try {
                await api(`/friends/${id}`, 'DELETE');
                showFriendsTab('friends');
            } catch (e) {
                try {
                    const data = JSON.parse(e.message);
                    alert('Ошибка удаления друга: ' + (data.message || 'Неизвестная ошибка'));
                } catch {
                    alert('Ошибка удаления друга: ' + e.message);
                }
            }
        }

        async function cancelFriendRequest(id) {
            try {
                await api(`/friends/requests/${id}/cancel`, 'POST');
                showFriendsTab('outgoing');
            } catch (e) {
                try {
                    const data = JSON.parse(e.message);
                    alert('Ошибка отмены: ' + (data.message || 'Неизвестная ошибка'));
                } catch {
                    alert('Ошибка отмены: ' + e.message);
                }
            }
        }

        async function unblockUser(userId) {
            try {
                await api(`/blocks/${userId}`, 'DELETE');
                showFriendsTab('blocked');
            } catch (e) {
                alert('Ошибка разблокировки: ' + e.message);
            }
        }

        // Notifications page
        async function loadNotifications() {
            try {
                const data = await api('/notifications');
                const notifications = data.notifications || [];
                renderNotificationsList(document.getElementById('modalNotificationsList'), notifications);
                renderNotificationsList(document.getElementById('notificationsList'), notifications);
                updateNotificationBadge();
            } catch (e) {
                
            }
        }

        function renderNotificationsList(container, notifications) {
            if (!container) return;
            container.innerHTML = '';
            if (!notifications.length) {
                container.innerHTML = `<div class="text-sm text-gray-500">Уведомлений нет</div>`;
                return;
            }
            notifications.forEach(notif => {
                const el = document.createElement('div');
                el.className = 'notification-item';
                el.innerHTML = `<p>${notif.data.message || 'Новое уведомление'}</p>`;
                el.onclick = () => handleNotificationClick(notif);
                container.appendChild(el);
            });
        }

        async function handleNotificationClick(notif) {
            const data = notif.data || {};
            try {
                await api(`/notifications/${notif.id}/read`, 'POST');
            } catch (e) {
                
            }

            if (data.friend_request_id || data.follow_request_id) {
                showPage('friends');
                showFriendsTab('incoming');
            } else if (data.message_id && data.sender_id) {
                await openMessageFromNotification(data.sender_id);
            } else if (data.post_id) {
                await openPostFromNotification(data.post_id);
            } else if (data.follower_id) {
                showPage('profile', data.follower_id);
            } else if (data.recipient_id && data.requester_id) {
                const targetId = data.requester_id === (currentUser && currentUser.id) ? data.recipient_id : data.requester_id;
                if (targetId) showPage('profile', targetId);
            }

            loadNotifications();
        }

        async function openMessageFromNotification(userId) {
            showPage('messages');
            try {
                const profile = await api('/profile/' + userId);
                const user = profile.user || {};
                const avatar = user.avatar || null;
                openConversation(userId, getDisplayName(user) || 'Пользователь', avatar);
            } catch (e) {
                openConversation(userId, 'Пользователь');
            }
        }

        async function openPostFromNotification(postId) {
            showPage('home');
            await loadFeed();
            const feed = document.getElementById('feed');
            const postEl = feed ? feed.querySelector(`[data-post-id=\"${postId}\"]`) : null;
            if (postEl) {
                postEl.classList.add('post-highlight');
                postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => postEl.classList.remove('post-highlight'), 2000);
            }
        }

        document.getElementById('btnMarkAllRead').onclick = async () => {
            await api('/notifications/read-all', 'POST');
            loadNotifications();
            updateNotificationBadge();
        };

        document.getElementById('btnMarkAllReadModal').onclick = async () => {
            await api('/notifications/read-all', 'POST');
            loadNotifications();
            updateNotificationBadge();
        };

        async function updateNotificationBadge() {
            try {
                const data = await api('/notifications');
                const notifications = data.notifications;
                const unread = notifications.filter(n => !n.read_at).length;
                const badge = document.getElementById('notifBadge');
                if (unread > 0) {
                    badge.textContent = unread;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            } catch {
                
            }
        }

        async function updateMessageBadge() {
            
            document.getElementById('msgBadge').textContent = '1';
            document.getElementById('msgBadge').classList.remove('hidden');
        }

        // Echo/WebSockets
        function initEcho() {
            if (!token || !currentUser) return;
            window.Echo = new Echo({
                broadcaster: 'reverb',
                key: 'h81dgta6jqvb3e3mkasl',
                wsHost: window.location.hostname,
                wsPort: 8080,
                forceTLS: false,
                encrypted: false,
                disableStats: true,
                enabledTransports: ['ws', 'wss'],
                auth: { headers: { Authorization: `Bearer ${token}` } }
            });

            window.Echo.private(`messages.${currentUser.id}`).listen('MessageSent', (e) => {
                
            });

            window.Echo.private(`App.Models.User.${currentUser.id}`).notification((n) => {
                updateNotificationBadge();
            });
        }

        

        // Theme toggle
        function toggleTheme() {
            const html = document.documentElement;
            const isDark = html.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            window.dispatchEvent(new Event('themechange'));
        }

       
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }

        // Initialize
        initEmojiPicker();
        updateAuthButton();
        if (token) {
            loadUserData();
            showPage('home');
        } else {
            showAuthModal();
        }

        
        
        function bindPostComment() {
            const btn = document.getElementById('btnPostComment');
            if (!btn) return;
            btn.onclick = async () => {
                const body = document.getElementById('commentText').value.trim();
                if (body && currentCommentPostId) {
                    try {
                      
                        const payload = { body };
                        if (currentReplyToCommentId) payload.parent_id = currentReplyToCommentId;
                        await api(`/posts/${currentCommentPostId}/comments`, 'POST', payload);
                        document.getElementById('commentText').value = '';
                        currentReplyToCommentId = null;
                        await loadComments(currentCommentPostId);
                        loadFeed(); 
                    } catch (error) {
                        alert('Ошибка отправки комментария: ' + error.message);
                    }
                }
            };
        }

        if (document.readyState !== 'loading') bindPostComment(); else document.addEventListener('DOMContentLoaded', bindPostComment);
