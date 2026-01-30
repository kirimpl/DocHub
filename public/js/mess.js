document.addEventListener('DOMContentLoaded', () => {
    // ... (старые переменные DOM остаются) ...
    const API_URL = '/api';
    const messagesContainer = document.querySelector('.chat-messages');
    const chatsListContainer = document.getElementById('chatsListContainer');
    const groupsListContainer = document.getElementById('groupsListContainer');
    const emptyState = document.getElementById('emptyState');
    const chatView = document.getElementById('chatView');
    const contactsListEl = document.getElementById('contactsList');
    const headerName = document.getElementById('chatHeaderName');
    const headerAvatar = document.getElementById('chatHeaderAvatar');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const attachBtn = document.getElementById('attachBtn');
    const hiddenFileInput = document.getElementById('hiddenFileInput');
    const micBtn = document.getElementById('micBtn');

    // Модальные окна и прочее
    const modalChat = document.getElementById('createChatModal');
    const modalGroup = document.getElementById('createGroupModal');
    const btnCreateGroup = document.getElementById('btnCreateGroup');
    const groupNameInput = document.getElementById('groupNameInput');
    const groupDescInput = document.getElementById('groupDescInput');
    const submitCreateGroup = document.getElementById('submitCreateGroup');
    const contactSearch = document.getElementById('contactSearch');
    const forwardModal = document.getElementById('forwardModal');
    const closeForwardModal = document.getElementById('closeForwardModal');
    const forwardList = document.getElementById('forwardList');
    const forwardSearch = document.getElementById('forwardSearch');
    const pinnedMessageBar = document.getElementById('pinnedMessageBar');
    const pinnedText = document.getElementById('pinnedText');
    const unpinBtn = document.getElementById('unpinBtn');
    const pinnedContentClick = document.getElementById('pinnedContentClick');
    const replyPanel = document.getElementById('replyPanel');
    const replyTextPreview = document.getElementById('replyTextPreview');
    const closeReplyBtn = document.getElementById('closeReplyBtn');
    const emojiBtn = document.getElementById('emojiBtn');
    const emojiWrapper = document.getElementById('emojiWrapper');
    const ctxMenu = document.getElementById('msgContextMenu');
    const ctxReply = document.getElementById('ctxReply');
    const ctxCopy = document.getElementById('ctxCopy');
    const ctxPin = document.getElementById('ctxPin');
    const ctxDelete = document.getElementById('ctxDelete');
    const ctxForward = document.getElementById('ctxForward');
    const chatMenuBtn = document.getElementById('chatMenuBtn');
    const chatDropdown = document.getElementById('chatDropdown');
    const menuSearchBtn = document.getElementById('menuSearchBtn');
    const menuClearBtn = document.getElementById('menuClearBtn');
    const menuDeleteBtn = document.getElementById('menuDeleteBtn');
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    const closeSearchBtn = document.getElementById('closeSearchBtn');

    // === СОСТОЯНИЕ ===
    let currentUser = null;
    let activeChatId = null;
    let activeChatType = null;
    let targetMessageElement = null;
    let currentPinnedElement = null;
    let isReplying = false;
    let replyContent = null;
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;

    // Переменные для Reverb/Echo
    let echoReady = false;
    let pusherClient = null;

    // === API HELPERS ===
    const getAuthToken = () => localStorage.getItem('auth_token');

    const authHeaders = (isMultipart = false) => {
        const headers = {
            'Accept': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        };
        if (!isMultipart) headers['Content-Type'] = 'application/json';
        return headers;
    };

    const formatTime = (value) => {
        if (!value) return '';
        return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getDisplayUser = (user) => {
        if (!user) return { name: 'Unknown', initials: '??', desc: '', id: 0 };
        const firstName = user.name || '';
        const lastName = user.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Без имени';
        const i1 = firstName.charAt(0).toUpperCase();
        const i2 = lastName.charAt(0).toUpperCase();
        const initials = (i1 + i2) || '??';
        const desc = user.speciality || user.position || user.email || 'Пользователь';
        return { id: user.id, name: fullName, initials: initials, desc: desc, avatar: user.avatar };
    };

    // === ФУНКЦИЯ ОБРАБОТКИ ВХОДЯЩЕГО СООБЩЕНИЯ ===
    const handleIncomingMessage = (e) => {
        // e.message или e - в зависимости от того, как Echo отдает данные
        const msg = e.message || e;
        console.log('Новое сообщение:', msg);

        if (activeChatType === 'private' && String(msg.sender_id) === String(currentActiveChatId)) {
            renderMessage(msg);
        }
    };

    // === REALTIME (ТВОЙ КОД) ===
    const initEcho = () => {
        if (echoReady || !currentUser) return;
        if (!window.Pusher) return;

        const token = getAuthToken();
        if (!token) return;

        // Берем настройки, которые мы передали в app.blade.php
        const config = window.REVERB_CONFIG;
        const echoKey = config.key;

        // 1. Попытка настроить Laravel Echo
        if (window.Echo && typeof window.Echo.private !== 'function') {
            const EchoCtor = window.Echo?.default || (typeof window.Echo === 'function' ? window.Echo : null);

            if (EchoCtor) {
                console.log('Инициализация Echo (конструктор)...');
                window.Echo = new EchoCtor({
                    broadcaster: 'pusher', // Используем 'pusher' для совместимости CDN
                    key: echoKey,
                    wsHost: config.host,
                    wsPort: config.port,
                    wssPort: 443,
                    forceTLS: config.scheme === 'https',
                    encrypted: false,
                    disableStats: true,
                    cluster: 'mt1', // Заглушка
                    enabledTransports: ['ws', 'wss'],
                    authEndpoint: '/api/broadcasting/auth',
                    auth: { headers: { Authorization: `Bearer ${token}` } },
                });
            }
        }

        // 2. Если Echo готов - подписываемся
        if (window.Echo && typeof window.Echo.private === 'function') {
            console.log(`Подписка Echo на messages.${currentUser.id}`);
            window.Echo.private(`messages.${currentUser.id}`)
                .listen('.MessageSent', handleIncomingMessage);

            echoReady = true;
            return;
        }

        // 3. Fallback: Если Echo не сработал, используем чистый Pusher
        if (!pusherClient) {
            console.log('Инициализация чистого Pusher (Fallback)...');
            pusherClient = new window.Pusher(echoKey, {
                wsHost: config.host,
                wsPort: config.port,
                wssPort: 443,
                forceTLS: config.scheme === 'https',
                encrypted: false,
                disableStats: true,
                cluster: 'mt1',
                enabledTransports: ['ws', 'wss'],
                authEndpoint: '/api/broadcasting/auth',
                auth: { headers: { Authorization: `Bearer ${token}` } },
            });
        }

        if (pusherClient) {
            console.log(`Подписка Pusher на private-messages.${currentUser.id}`);
            // В чистом Pusher канал должен начинаться с 'private-'
            const channel = pusherClient.subscribe(`private-messages.${currentUser.id}`);
            channel.bind('MessageSent', handleIncomingMessage);
            // Также слушаем событие с точкой, на всякий случай
            channel.bind('.MessageSent', handleIncomingMessage);
            echoReady = true;
        }
    };

    // === API ЗАПРОСЫ ===
    const fetchMe = async () => {
        try {
            const res = await fetch(`${API_URL}/me`, { headers: authHeaders() });
            if (res.ok) return await res.json();
        } catch (e) { console.error(e); }
        return null;
    };
    const fetchInbox = async () => { /* ... */
        try { const res = await fetch(`${API_URL}/messages/inbox`, { headers: authHeaders() }); if (res.ok) return await res.json(); } catch (e) { } return [];
    };
    const fetchGroups = async () => { /* ... */
        try { const res = await fetch(`${API_URL}/group-chats`, { headers: authHeaders() }); if (res.ok) return await res.json(); } catch (e) { } return [];
    };
    const fetchMessages = async (id, type) => {
        const url = type === 'private' ? `${API_URL}/messages/conversation/${id}` : `${API_URL}/group-chats/${id}/messages`;
        try { const res = await fetch(url, { headers: authHeaders() }); if (res.ok) return await res.json(); } catch (e) { } return [];
    };
    const fetchUsers = async () => {
        try { const res = await fetch(`${API_URL}/users`, { headers: authHeaders() }); if (res.ok) return await res.json(); } catch (e) { } return [];
    };
    const uploadMedia = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_URL}/media`, { method: 'POST', headers: authHeaders(true), body: formData });
            if (!res.ok) { alert('Ошибка загрузки'); return null; }
            return await res.json();
        } catch (e) { return null; }
    };
    const apiSendMessage = async (data, targetId, type) => {
        let safeBody = data.body;
        if (!safeBody || safeBody.trim() === '') {
            if (data.type === 'image') safeBody = '📷 Фото';
            else if (data.type === 'audio') safeBody = '🎤 Голосовое сообщение';
            else if (data.type === 'file') safeBody = '📎 Файл';
            else safeBody = '.';
        }
        const payload = { body: safeBody, attachment_id: data.attachment_id || null, type: data.type || 'text' };
        let url = type === 'private' ? `${API_URL}/messages/send` : `${API_URL}/group-chats/${targetId}/messages`;
        if (type === 'private') payload.recipient_id = targetId;

        try {
            const res = await fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
            if (res.ok) return await res.json();
        } catch (e) { console.error(e); }
        return null;
    };
    const apiAction = async (msgId, action) => { /* ... */
        let url = activeChatType === 'private' ? `${API_URL}/messages/${msgId}` : `${API_URL}/group-chats/${activeChatId}/messages/${msgId}`;
        let method = 'POST';
        if (action === 'delete') { method = 'DELETE'; }
        else if (action === 'pin' || action === 'unpin') { url += '/pin'; method = action === 'pin' ? 'POST' : 'DELETE'; }
        await fetch(url, { method, headers: authHeaders() });
    };

    // === RENDER ===
    function renderMessage(data) {
        const msgDiv = document.createElement('div');
        msgDiv.dataset.id = data.id;
        const isMine = data.sender_id === currentUser?.id;
        msgDiv.className = `message-bubble ${isMine ? 'sent' : 'received'}`;
        const time = formatTime(data.created_at || new Date());
        let content = data.body || '';
        let contentType = data.content_type || 'text';
        let attachment = data.attachment || null;
        if (attachment) {
            if (attachment.type?.includes('image') || attachment.mime_type?.includes('image')) contentType = 'image';
            else if (attachment.type?.includes('audio') || attachment.mime_type?.includes('audio')) contentType = 'audio';
            else contentType = 'file';
        }
        let innerHTML = '';
        if (data.is_forwarded) innerHTML += `<div class="forwarded-tag"><i class="fa-solid fa-share"></i> Пересланное</div>`;
        if (activeChatType === 'group' && !isMine && data.sender) {
            const senderInfo = getDisplayUser(data.sender);
            innerHTML += `<div style="font-size:10px; color:#555; margin-bottom:2px;">${senderInfo.name}</div>`;
        }
        if (data.reply_to) {
            innerHTML += `<div class="msg-quote"><span class="quote-name">Цитата</span><span class="quote-text">${data.reply_to.body || 'Вложение'}</span></div>`;
        }
        if (contentType === 'image' && attachment) innerHTML += `<img src="${attachment.url}" class="msg-image">`;
        else if (contentType === 'file' && attachment) innerHTML += `<div class="msg-file"><div class="msg-file-icon"><i class="fa-solid fa-arrow-down"></i></div><div class="msg-file-details"><div class="msg-file-name">${attachment.original_name || attachment.name || 'Файл'}</div><div class="msg-file-size">${attachment.size || ''}</div></div></div>`;
        else if (contentType === 'audio' && attachment) innerHTML += `<audio controls src="${attachment.url}" class="msg-audio"></audio>`;
        else innerHTML += `<div class="msg-text">${content}</div>`;
        const checkIcon = isMine ? '<i class="fa-solid fa-check-double" style="margin-left:5px;"></i>' : '';
        innerHTML += `<div class="msg-meta">${time} ${checkIcon}</div>`;
        msgDiv.innerHTML = innerHTML;
        messagesContainer.appendChild(msgDiv);
        if (data.is_pinned) showPinnedBar(content, msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function openChat(id, type, userDisplayData) {
        emptyState.classList.add('hidden');
        chatView.classList.remove('hidden');
        currentActiveChatId = id;
        activeChatType = type;
        headerName.textContent = userDisplayData.name;
        headerAvatar.textContent = userDisplayData.initials;
        hidePinnedBar();
        messagesContainer.innerHTML = '<div style="text-align:center; padding:20px;">Загрузка...</div>';
        cancelReply();
        const messages = await fetchMessages(id, type);
        messagesContainer.innerHTML = '';
        if (messages && messages.length > 0) messages.forEach(msg => renderMessage(msg));
        else messagesContainer.innerHTML = '<div style="text-align:center; color:#888; margin-top:20px;">Напишите первое сообщение</div>';
    }

    function createSidebarItem(item, type, container) {
        const el = document.createElement('div');
        el.className = 'list-item';
        let targetUser = item;
        let targetId = item.id;
        if (type === 'group') { targetUser = { name: item.name, speciality: 'Группа', id: item.id }; }
        else if (item.recipient || item.sender) {
            if (item.recipient && item.recipient.id !== currentUser.id) targetUser = item.recipient;
            else if (item.sender) targetUser = item.sender;
            targetId = targetUser.id;
        }
        const display = getDisplayUser(targetUser);
        if (type === 'group') display.desc = item.description || 'Групповой чат';
        const bg = type === 'group' ? '#6EA8DB' : '#004080';
        let avatarHtml = `<div class="avatar-sq" style="background-color: ${bg}">${display.initials}</div>`;
        el.innerHTML = `${avatarHtml}<div class="item-info"><span class="name">${display.name}</span><span class="desc">${display.desc}</span></div>`;
        el.addEventListener('click', () => {
            document.querySelectorAll('.list-item').forEach(i => i.classList.remove('active'));
            el.classList.add('active');
            openChat(targetId, type, display);
        });
        container.prepend(el);
    }

    const initData = async () => {
        const token = getAuthToken();
        if (!token) return;
        currentUser = await fetchMe();
        if (!currentUser) return;
        const inbox = await fetchInbox();
        chatsListContainer.innerHTML = '';
        inbox.forEach(chat => createSidebarItem(chat, 'private', chatsListContainer));
        const groups = await fetchGroups();
        groupsListContainer.innerHTML = '';
        groups.forEach(group => createSidebarItem(group, 'group', groupsListContainer));
        initEcho();
    };

    // === HANDLERS ===
    async function sendMessage() {
        const text = messageInput.value.trim();
        if (text === '' || !currentActiveChatId) return;
        const tempMsg = { body: text, created_at: new Date().toISOString(), sender_id: currentUser.id, content_type: 'text', id: 'temp-' + Date.now() };
        if (isReplying && replyContent) tempMsg.reply_to = { body: replyContent };
        renderMessage(tempMsg);
        messageInput.value = '';
        cancelReply();
        toggleSendBtn();
        await apiSendMessage({ body: text, type: 'text' }, currentActiveChatId, activeChatType);
    }

    if (attachBtn && hiddenFileInput) {
        attachBtn.addEventListener('click', () => hiddenFileInput.click());
        hiddenFileInput.addEventListener('change', async function () {
            if (this.files && this.files.length > 0) {
                const file = this.files[0];
                if (!currentActiveChatId) return;
                const uploadRes = await uploadMedia(file);
                if (uploadRes) {
                    const type = file.type.startsWith('image/') ? 'image' : 'file';
                    await apiSendMessage({ body: '', type: type, attachment_id: uploadRes.id }, currentActiveChatId, activeChatType);
                    const msgs = await fetchMessages(currentActiveChatId, activeChatType);
                    if (msgs.length) renderMessage(msgs[msgs.length - 1]);
                }
                this.value = '';
            }
        });
    }

    if (micBtn) {
        micBtn.addEventListener('click', async () => {
            if (!currentActiveChatId) return;
            if (isRecording) { mediaRecorder.stop(); return; }
            if (!navigator.mediaDevices) return;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                mediaRecorder.start();
                isRecording = true;
                micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
                micBtn.style.color = 'red';
                mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
                mediaRecorder.onstop = async () => {
                    const blob = new Blob(audioChunks, { type: 'audio/mp3' });
                    const file = new File([blob], "voice.mp3", { type: "audio/mp3" });
                    const uploadRes = await uploadMedia(file);
                    if (uploadRes) {
                        await apiSendMessage({ body: '', type: 'audio', attachment_id: uploadRes.id }, currentActiveChatId, activeChatType);
                        const msgs = await fetchMessages(currentActiveChatId, activeChatType);
                        if (msgs.length) renderMessage(msgs[msgs.length - 1]);
                    }
                    isRecording = false;
                    micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
                    micBtn.style.color = '';
                    stream.getTracks().forEach(t => t.stop());
                };
            } catch (e) { console.error(e); }
        });
    }

    function toggleSendBtn() {
        const hasText = messageInput.value.trim().length > 0;
        if (hasText) {
            sendBtn.classList.remove('hidden');
            sendBtn.classList.add('visible');
        } else {
            sendBtn.classList.remove('visible');
            sendBtn.classList.add('hidden');
        }
    }

    // Ввод текста
    messageInput.addEventListener('input', toggleSendBtn);

    // Отправка по Enter
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Клик по кнопке отправки
    sendBtn.addEventListener('click', sendMessage);


    // --- 2. ЭМОДЗИ ---

    if (emojiBtn && emojiWrapper) {
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiWrapper.classList.toggle('hidden');
        });

        const picker = document.querySelector('emoji-picker');
        if (picker) {
            picker.addEventListener('emoji-click', event => {
                messageInput.value += event.detail.unicode;
                toggleSendBtn();
            });
        }
    }


    // --- 3. МЕНЮ ЧАТА (Троеточие сверху) ---

    if (chatMenuBtn) {
        chatMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chatDropdown.classList.toggle('hidden');
        });
    }

    if (menuDeleteBtn) {
        menuDeleteBtn.addEventListener('click', async () => {
            if (confirm('Удалить этот чат? Все сообщения будут потеряны.')) {
                const url = activeChatType === 'private'
                    ? `${API_URL}/messages/conversation/${currentActiveChatId}`
                    : `${API_URL}/group-chats/${currentActiveChatId}`;

                await fetch(url, { method: 'DELETE', headers: authHeaders() });
                location.reload();
            }
        });
    }


    // --- 4. КОНТЕКСТНОЕ МЕНЮ СООБЩЕНИЙ (ПКМ) ---

    messagesContainer.addEventListener('contextmenu', (e) => {
        const bubble = e.target.closest('.message-bubble');
        if (bubble) {
            e.preventDefault();
            targetMessageElement = bubble;

            // Вычисляем позицию, чтобы меню не улетало за экран
            let x = e.clientX;
            let y = e.clientY;
            const menuWidth = 220;
            const menuHeight = 200;

            if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth;
            if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight;

            ctxMenu.style.left = `${x}px`;
            ctxMenu.style.top = `${y}px`;
            ctxMenu.classList.remove('hidden');
        }
    });

    // Закрытие всех меню при клике в пустоту
    window.addEventListener('click', (e) => {
        if (ctxMenu) ctxMenu.classList.add('hidden');

        if (emojiWrapper && !emojiWrapper.contains(e.target) && e.target !== emojiBtn) {
            emojiWrapper.classList.add('hidden');
        }

        if (chatDropdown && !chatMenuBtn.contains(e.target)) {
            chatDropdown.classList.add('hidden');
        }

        // Закрытие модальных окон при клике на затемнение
        if (e.target === forwardModal) forwardModal.classList.remove('active');
        if (e.target === modalChat) modalChat.classList.remove('active');
        if (e.target === modalGroup) modalGroup.classList.remove('active');
    });


    // --- 5. ДЕЙСТВИЯ С СООБЩЕНИЯМИ (Закреп, Ответ, Удаление) ---

    // -- ЗАКРЕПЛЕНИЕ --
    ctxPin.addEventListener('click', async () => {
        if (targetMessageElement) {
            const text = targetMessageElement.querySelector('.msg-text')?.innerText || 'Вложение';
            showPinnedBar(text, targetMessageElement);

            if (targetMessageElement.dataset.id) {
                await apiAction(targetMessageElement.dataset.id, 'pin');
            }
        }
    });

    function showPinnedBar(text, element) {
        pinnedMessageBar.classList.remove('hidden');
        pinnedText.textContent = text;
        currentPinnedElement = element;
    }

    function hidePinnedBar() {
        pinnedMessageBar.classList.add('hidden');
        currentPinnedElement = null;
    }

    unpinBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (currentPinnedElement && currentPinnedElement.dataset.id) {
            await apiAction(currentPinnedElement.dataset.id, 'unpin');
        }
        hidePinnedBar();
    });

    // Переход к закрепленному сообщению
    pinnedContentClick.addEventListener('click', () => {
        if (currentPinnedElement) {
            currentPinnedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Подсветка сообщения
            const originalBg = currentPinnedElement.style.background;
            currentPinnedElement.style.background = '#FFF3CD'; // Светло-желтый
            setTimeout(() => {
                currentPinnedElement.style.background = originalBg;
            }, 1000);
        }
    });

    // -- ОТВЕТ (REPLY) --
    ctxReply.addEventListener('click', () => {
        if (targetMessageElement) {
            const text = targetMessageElement.querySelector('.msg-text')?.innerText || 'Вложение';
            isReplying = true;
            replyContent = text;

            replyPanel.classList.remove('hidden');
            replyTextPreview.textContent = text;
            messageInput.focus();
        }
    });

    closeReplyBtn.addEventListener('click', cancelReply);

    function cancelReply() {
        isReplying = false;
        replyContent = null;
        replyPanel.classList.add('hidden');
    }

    // -- УДАЛЕНИЕ --
    ctxDelete.addEventListener('click', async () => {
        if (confirm('Удалить сообщение?')) {
            const id = targetMessageElement.dataset.id;
            targetMessageElement.remove(); // Удаляем визуально сразу

            if (id) {
                await apiAction(id, 'delete');
            }
        }
    });


    // --- 6. МОДАЛЬНЫЕ ОКНА И КОНТАКТЫ ---

    async function renderContacts() {
        contactsListEl.innerHTML = '<div style="padding:20px; text-align:center; color:#888;">Загрузка...</div>';
        const users = await fetchUsers();
        contactsListEl.innerHTML = '';

        users.forEach(user => {
            if (user.id === currentUser.id) return; // Не показываем себя

            const itemElement = document.createElement('div');
            itemElement.className = 'contact-item';
            const display = getDisplayUser(user);

            itemElement.innerHTML = `
                <div class="avatar-sq" style="background:#D9EEFF; color:#0056B3;">
                    ${display.initials}
                </div>
                <div class="contact-info">
                    <h4>${display.name}</h4>
                    <p>${display.desc}</p>
                </div>
            `;

            itemElement.addEventListener('click', () => {
                createSidebarItem(user, 'private', chatsListContainer);
                modalChat.classList.remove('active');
                openChat(user.id, 'private', display);
            });

            contactsListEl.appendChild(itemElement);
        });
    }

    // Открытие модалок
    document.querySelectorAll('.trigger-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            // Если кнопка не для группы, открываем создание чата
            if (!btn.textContent.includes('группу')) {
                modalChat.classList.add('active');
                renderContacts();
            }
        });
    });

    // Закрытие крестиком
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.modal-overlay').classList.remove('active');
        });
    });

    // Создание группы
    if (btnCreateGroup) {
        btnCreateGroup.addEventListener('click', (e) => {
            e.stopPropagation();
            modalGroup.classList.add('active');
        });
    }

    if (submitCreateGroup) {
        submitCreateGroup.addEventListener('click', async () => {
            const name = groupNameInput.value.trim();
            const desc = groupDescInput.value.trim();
            if (!name) return;

            const res = await fetch(`${API_URL}/group-chats`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ name, description: desc })
            });

            if (res.ok) {
                modalGroup.classList.remove('active');
                groupNameInput.value = '';
                // Перезагружаем данные, чтобы группа появилась в списке
                initData();
            }
        });
    }

    // === ЗАПУСК ===
    initData();
});