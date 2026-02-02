document.addEventListener('DOMContentLoaded', () => {
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

    const modalChat = document.getElementById('createChatModal');
    const modalGroup = document.getElementById('createGroupModal');
    const btnCreateGroup = document.getElementById('btnCreateGroup');
    const groupNameInput = document.getElementById('groupNameInput');
    const submitCreateGroup = document.getElementById('submitCreateGroup');

    const emojiBtn = document.getElementById('emojiBtn');
    const emojiWrapper = document.getElementById('emojiWrapper');
    const ctxMenu = document.getElementById('msgContextMenu');
    const ctxReply = document.getElementById('ctxReply');
    const ctxDelete = document.getElementById('ctxDelete');
    const ctxPin = document.getElementById('ctxPin');

    const pinnedMessageBar = document.getElementById('pinnedMessageBar');
    const pinnedText = document.getElementById('pinnedText');
    const unpinBtn = document.getElementById('unpinBtn');
    const pinnedContentClick = document.getElementById('pinnedContentClick');

    const replyPanel = document.getElementById('replyPanel');
    const replyTextPreview = document.getElementById('replyTextPreview');
    const closeReplyBtn = document.getElementById('closeReplyBtn');

    const chatMenuBtn = document.getElementById('chatMenuBtn');
    const chatDropdown = document.getElementById('chatDropdown');
    const menuSearchBtn = document.getElementById('menuSearchBtn');
    const menuClearBtn = document.getElementById('menuClearBtn');
    const menuDeleteBtn = document.getElementById('menuDeleteBtn');

    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    const closeSearchBtn = document.getElementById('closeSearchBtn');

    let currentUser = null;
    let currentActiveChatId = null;
    let activeChatType = null; 
    let targetMessageElement = null;
    let currentPinnedElement = null;
    let isReplying = false;
    let replyContent = null;
    
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];
    
    let echoReady = false;
    let pusherClient = null;

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
        if (!user) return { name: 'Неизвестный', initials: '??', desc: '', id: 0 };
        const firstName = user.name || '';
        const lastName = user.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || user.email || 'Без имени';

        let i1 = firstName.charAt(0).toUpperCase();
        let i2 = lastName.charAt(0).toUpperCase();
        if (!i1 && !i2) i1 = '?';

        const desc = user.speciality || user.position || 'Пользователь';
        return { id: user.id, name: fullName, initials: (i1 + i2), desc: desc, avatar: user.avatar };
    };

    const fetchMe = async () => {
        try {
            const res = await fetch(`${API_URL}/me`, { headers: authHeaders() });
            if (res.ok) return await res.json();
        } catch (e) { console.error(e); }
        return null;
    };

    const fetchUsers = async () => {
        let url = `${API_URL}/users`;
        try {
            let res = await fetch(url, { headers: authHeaders() });
            if (!res.ok) {
                url = `${API_URL}/search`;
                res = await fetch(url, { headers: authHeaders() });
            }
            if (res.ok) return await res.json();
        } catch (e) { }
        return [];
    };

    const fetchInbox = async () => {
        try {
            const res = await fetch(`${API_URL}/messages/inbox`, { headers: authHeaders() });
            if (res.ok) {
                const json = await res.json();
                let items = [];
                if (Array.isArray(json)) items = json;
                else if (json.data && Array.isArray(json.data)) items = json.data;
                else if (json.conversations && Array.isArray(json.conversations)) items = json.conversations;
                else if (typeof json === 'object' && json !== null) items = Object.values(json);
                return items;
            }
        } catch (e) { console.error(e); }
        return [];
    };

    const fetchGroups = async () => {
        try {
            const res = await fetch(`${API_URL}/group-chats`, { headers: authHeaders() });
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json)) return json;
                if (json.data && Array.isArray(json.data)) return json.data;
                return [];
            }
        } catch (e) { }
        return [];
    };

    const fetchMessages = async (id, type) => {
        const url = type === 'private'
            ? `${API_URL}/messages/conversation/${id}`
            : `${API_URL}/group-chats/${id}/messages`;

        try {
            const res = await fetch(url, { headers: authHeaders() });
            if (res.ok) return await res.json();
        } catch (e) { }
        return [];
    };

    const uploadMedia = async (file) => {
        if (file.size > 10 * 1024 * 1024) {
            alert('Файл слишком большой. Максимум 10МБ.');
            return null;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/media`, { 
                method: 'POST', 
                headers: authHeaders(true), 
                body: formData 
            });
            
            if (!res.ok) return null;
            const json = await res.json();
            return json.data ? json.data : json;
        } catch (e) { 
            return null; 
        }
    };

    const apiSendMessage = async (data, targetId, type) => {
        let safeBody = data.body;
        if (!safeBody || safeBody.trim() === '') {
            if (data.type === 'image') safeBody = ' Фото';
            else if (data.type === 'audio') safeBody = ' Голосовое сообщение';
            else if (data.type === 'file') safeBody = ' Файл';
            else safeBody = '.';
        }

        const payload = {
            body: safeBody,
            type: data.type || 'text',
            attachment_id: data.attachment_id || null 
        };

        let url;
        if (type === 'private') {
            url = `${API_URL}/messages/send`;
            payload.recipient_id = targetId;
        } else {
            url = `${API_URL}/group-chats/${targetId}/messages`;
        }

        try {
            const res = await fetch(url, { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
            if (res.ok) return await res.json();
        } catch (e) { }
        return null;
    };

    const apiAction = async (msgId, action) => {
        let url = activeChatType === 'private'
            ? `${API_URL}/messages/${msgId}`
            : `${API_URL}/group-chats/${currentActiveChatId}/messages/${msgId}`;

        let method = 'POST';
        if (action === 'delete') method = 'DELETE';
        else if (action === 'pin' || action === 'unpin') {
            url += '/pin';
            method = (action === 'pin') ? 'POST' : 'DELETE';
        }
        await fetch(url, { method, headers: authHeaders() });
    };

    function createSidebarItem(item, type, container) {
        const emptyMsg = container.querySelector('.empty-list-msg');
        if (emptyMsg) emptyMsg.remove();

        let targetUser = null;
        let targetId = null;

        if (type === 'private') {
            if (item.sender_id || item.recipient_id) {
                const myId = String(currentUser.id);
                const senderId = String(item.sender_id);

                if (senderId === myId) {
                    targetUser = item.recipient || { id: item.recipient_id, name: `ID: ${item.recipient_id}`, speciality: '' };
                    targetId = item.recipient_id;
                } else {
                    targetUser = item.sender || { id: item.sender_id, name: `ID: ${item.sender_id}`, speciality: '' };
                    targetId = item.sender_id;
                }
            }
            else if (item.id) {
                targetUser = item;
                targetId = item.id;
            }
        } else {
            targetUser = { name: item.name, speciality: 'Группа', id: item.id };
            targetId = item.id;
        }

        if (!targetId) return;
        if (container.querySelector(`[data-chat-id="${targetId}"]`)) return;

        const display = getDisplayUser(targetUser);
        const bg = (type === 'group') ? '#6EA8DB' : '#004080';

        const el = document.createElement('div');
        el.className = 'list-item';
        el.dataset.chatId = targetId;

        el.innerHTML = `
            <div class="avatar-sq" style="background-color: ${bg}">${display.initials}</div>
            <div class="item-info">
                <span class="name">${display.name}</span>
                <span class="desc">${display.desc}</span>
            </div>
        `;

        el.addEventListener('click', () => {
            document.querySelectorAll('.list-item').forEach(i => i.classList.remove('active'));
            el.classList.add('active');
            openChat(targetId, type, display);
        });

        if (type === 'private' && !item.sender_id && !item.recipient_id) {
            container.appendChild(el);
        } else {
            container.prepend(el);
        }
    }

    function renderMessage(data) {
        const msgDiv = document.createElement('div');
        msgDiv.dataset.id = data.id;
        const isMine = (String(data.sender_id) === String(currentUser?.id));

        msgDiv.className = `message-bubble ${isMine ? 'sent' : 'received'}`;

        const time = formatTime(data.created_at || new Date());
        let content = data.body || '';
        let contentType = data.content_type || 'text';

        let attachment = data.attachment || null;
        
        if (data.localBlobUrl) {
            attachment = { url: data.localBlobUrl, original_name: 'Загрузка...', mime_type: data.content_type };
            contentType = data.content_type;
        } 
        else if (attachment) {
            const mime = attachment.mime_type || attachment.type || '';
            if (mime.includes('image')) contentType = 'image';
            else if (mime.includes('audio')) contentType = 'audio';
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

        if (contentType === 'image' && attachment) {
            innerHTML += `<img src="${attachment.url}" class="msg-image" onclick="window.open('${attachment.url}', '_blank')">`;
        } else if (contentType === 'file' && attachment) {
            innerHTML += `
            <a href="${attachment.url}" target="_blank" style="text-decoration:none; color:inherit;">
                <div class="msg-file">
                    <div class="msg-file-icon"><i class="fa-solid fa-arrow-down"></i></div>
                    <div class="msg-file-details">
                        <div class="msg-file-name">${attachment.original_name || attachment.name || 'Файл'}</div>
                    </div>
                </div>
            </a>`;
        } else if (contentType === 'audio' && attachment) {
            innerHTML += `<audio controls src="${attachment.url}" class="msg-audio" style="max-width: 240px;"></audio>`;
        } else {
            innerHTML += `<div class="msg-text">${content}</div>`;
        }

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
        cancelReply();

        if (searchBar) {
            searchBar.classList.add('hidden');
            if (searchInput) searchInput.value = '';
        }

        messagesContainer.innerHTML = '<div style="text-align:center; padding:20px;">Загрузка...</div>';

        const messages = await fetchMessages(id, type);
        messagesContainer.innerHTML = '';

        if (messages && messages.length > 0) {
            messages.forEach(msg => renderMessage(msg));
        } else {
            messagesContainer.innerHTML = '<div style="text-align:center; color:#888; margin-top:20px;">Напишите первое сообщение</div>';
        }
    }

    const initData = async () => {
        const token = getAuthToken();
        if (!token) return;

        currentUser = await fetchMe();
        if (!currentUser) return;

        const inbox = await fetchInbox();
        chatsListContainer.innerHTML = '';

        if (inbox.length > 0) {
            inbox.forEach(chat => createSidebarItem(chat, 'private', chatsListContainer));
        } else {
            const allUsers = await fetchUsers();
            if (allUsers.length > 0) {
                const hint = document.createElement('div');
                hint.innerHTML = '<div style="padding:10px; font-size:11px; color:#888; text-align:center;">Ваши контакты</div>';
                chatsListContainer.appendChild(hint);

                allUsers.forEach(user => {
                    if (String(user.id) !== String(currentUser.id)) {
                        createSidebarItem(user, 'private', chatsListContainer);
                    }
                });
            } else {
                chatsListContainer.innerHTML = '<div class="empty-list-msg" style="padding:15px; text-align:center; font-size:12px; color:#888;">Нет контактов</div>';
            }
        }

        const groups = await fetchGroups();
        groupsListContainer.innerHTML = '';

        if (groups.length === 0) {
            groupsListContainer.innerHTML = '<div class="empty-list-msg" style="padding:15px; text-align:center; font-size:12px; color:#888;">Нет групп</div>';
        } else {
            groups.forEach(group => {
                if (group.type === 'lecture' || group.is_lecture) return;
                createSidebarItem(group, 'group', groupsListContainer);
            });
        }

        initEcho();
    };

    const handleIncomingMessage = (e) => {
        const msg = e.message || e;
        if (activeChatType === 'private' && String(msg.sender_id) === String(currentActiveChatId)) {
            renderMessage(msg);
        }
    };

    const initEcho = () => {
        if (echoReady || !currentUser) return;
        if (!window.Pusher || !window.REVERB_CONFIG) return;

        const token = getAuthToken();
        const config = window.REVERB_CONFIG;

        const pusherConfig = {
            wsHost: config.host,
            wsPort: config.port,
            wssPort: 443,
            forceTLS: config.scheme === 'https',
            disableStats: true,
            cluster: 'mt1',
            enabledTransports: ['ws', 'wss'],
            authEndpoint: '/api/broadcasting/auth',
            auth: { headers: { Authorization: `Bearer ${token}` } }
        };

        if (window.Echo) {
            const EchoCtor = window.Echo.default || window.Echo;
            window.Echo = new EchoCtor({
                broadcaster: 'pusher',
                key: config.key,
                ...pusherConfig
            });
            window.Echo.private(`messages.${currentUser.id}`).listen('.MessageSent', handleIncomingMessage);
            echoReady = true;
        } else {
            pusherClient = new window.Pusher(config.key, pusherConfig);
            const channel = pusherClient.subscribe(`private-messages.${currentUser.id}`);
            channel.bind('MessageSent', handleIncomingMessage);
            channel.bind('.MessageSent', handleIncomingMessage);
            echoReady = true;
        }
    };

    function toggleSendBtn() {
        if (messageInput.value.trim().length > 0) {
            sendBtn.classList.remove('hidden');
            sendBtn.classList.add('visible');
        } else {
            sendBtn.classList.remove('visible');
            sendBtn.classList.add('hidden');
        }
    }

    async function sendMessage() {
        const text = messageInput.value.trim();
        if (text === '' || !currentActiveChatId) return;

        const tempMsg = {
            body: text,
            created_at: new Date().toISOString(),
            sender_id: currentUser.id,
            content_type: 'text',
            id: 'temp-' + Date.now()
        };
        if (isReplying && replyContent) tempMsg.reply_to = { body: replyContent };

        renderMessage(tempMsg);
        messageInput.value = '';
        cancelReply();
        toggleSendBtn();

        await apiSendMessage({ body: text, type: 'text' }, currentActiveChatId, activeChatType);

        if (activeChatType === 'private') {
            await initData();
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    messageInput.addEventListener('input', toggleSendBtn);

    if (attachBtn) attachBtn.addEventListener('click', () => hiddenFileInput.click());

    if (hiddenFileInput) hiddenFileInput.addEventListener('change', async function () {
        if (this.files && this.files.length > 0) {
            const file = this.files[0];
            if (!currentActiveChatId) return;

            const localUrl = URL.createObjectURL(file);
            const type = file.type.startsWith('image/') ? 'image' : 'file';

            renderMessage({
                id: 'local-' + Date.now(),
                sender_id: currentUser.id,
                created_at: new Date().toISOString(),
                body: '',
                content_type: type,
                attachment: { url: localUrl, original_name: file.name, mime_type: file.type }
            });

            const uploadRes = await uploadMedia(file);

            if (uploadRes && uploadRes.id) {
                await apiSendMessage({ 
                    body: '', 
                    type: type, 
                    attachment_id: uploadRes.id 
                }, currentActiveChatId, activeChatType);
            }

            this.value = '';
        }
    });

    if (micBtn) micBtn.addEventListener('click', async () => {
        if (!currentActiveChatId) return;

        if (isRecording) {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            return;
        }

        if (!navigator.mediaDevices) {
            alert('Ваш браузер не поддерживает запись звука.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.start();
            isRecording = true;

            micBtn.innerHTML = '<i class="fa-solid fa-stop" style="color:red"></i>';
            messageInput.placeholder = 'Запись голосового...';
            messageInput.disabled = true;

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

            mediaRecorder.onstop = async () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                const file = new File([blob], "voice.webm", { type: "audio/webm" });
                
                const localUrl = URL.createObjectURL(blob);
                renderMessage({
                    id: 'local-' + Date.now(),
                    sender_id: currentUser.id,
                    created_at: new Date().toISOString(),
                    body: '',
                    content_type: 'audio',
                    attachment: { url: localUrl, mime_type: 'audio/webm' }
                });

                micBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                const uploadRes = await uploadMedia(file);
                
                if (uploadRes && uploadRes.id) {
                    await apiSendMessage({ 
                        body: '', 
                        type: 'audio', 
                        attachment_id: uploadRes.id 
                    }, currentActiveChatId, activeChatType);
                }

                isRecording = false;
                micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
                micBtn.style.color = '';
                messageInput.placeholder = 'Напишите сообщение...';
                messageInput.disabled = false;

                stream.getTracks().forEach(t => t.stop());
            };
        } catch (e) {
            alert('Ошибка доступа к микрофону.');
        }
    });

    document.querySelectorAll('.trigger-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.textContent.includes('группу')) {
                modalChat.classList.add('active');
                renderContacts();
            }
        });
    });
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function () { this.closest('.modal-overlay').classList.remove('active'); });
    });

    async function renderContacts() {
        contactsListEl.innerHTML = '<div style="padding:20px; text-align:center;">Загрузка...</div>';
        const users = await fetchUsers();
        contactsListEl.innerHTML = '';
        users.forEach(user => {
            if (user.id === currentUser.id) return;
            const item = document.createElement('div');
            item.className = 'contact-item';
            const d = getDisplayUser(user);
            item.innerHTML = `<div class="avatar-sq">${d.initials}</div><div class="contact-info"><h4>${d.name}</h4><p>${d.desc}</p></div>`;
            item.addEventListener('click', () => {
                createSidebarItem(user, 'private', chatsListContainer);
                modalChat.classList.remove('active');
                openChat(user.id, 'private', d);
            });
            contactsListEl.appendChild(item);
        });
    }

    if (btnCreateGroup) btnCreateGroup.addEventListener('click', (e) => { e.stopPropagation(); modalGroup.classList.add('active'); });
    if (submitCreateGroup) submitCreateGroup.addEventListener('click', async () => {
        const name = groupNameInput.value.trim();
        if (!name) { alert('Название?'); return; }
        try {
            const res = await fetch(`${API_URL}/group-chats`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ name: name, member_ids: [] })
            });
            if (res.ok) {
                modalGroup.classList.remove('active');
                groupNameInput.value = '';
                initData();
            } else { alert('Ошибка создания'); }
        } catch (e) { alert('Ошибка сети'); }
    });

    if (chatMenuBtn) {
        chatMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chatDropdown.classList.toggle('hidden');
        });
    }

    if (menuSearchBtn) {
        menuSearchBtn.addEventListener('click', () => {
            chatDropdown.classList.add('hidden');
            if (searchBar) {
                searchBar.classList.remove('hidden');
                if (searchInput) searchInput.focus();
            }
        });
    }

    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', () => {
            searchBar.classList.add('hidden');
            if (searchInput) searchInput.value = '';
            document.querySelectorAll('.message-bubble').forEach(msg => msg.classList.remove('hidden'));
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.message-bubble').forEach(msg => {
                const textEl = msg.querySelector('.msg-text');
                if (textEl) {
                    if (textEl.textContent.toLowerCase().includes(term)) msg.classList.remove('hidden');
                    else msg.classList.add('hidden');
                }
            });
        });
    }

    if (menuClearBtn) {
        menuClearBtn.addEventListener('click', async () => {
            if (!confirm('Вы уверены? Это удалит все сообщения в этом чате.')) return;
            chatDropdown.classList.add('hidden');

            let url;
            if (activeChatType === 'private') {
                url = `${API_URL}/messages/conversation/${currentActiveChatId}`;
            } else {
                url = `${API_URL}/group-chats/${currentActiveChatId}/messages`; 
            }

            try {
                const res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
                
                if (res.ok) {
                    messagesContainer.innerHTML = '<div style="text-align:center; color:#888; margin-top:20px;">История очищена</div>';
                } else {
                    if(activeChatType === 'group') {
                        alert('Очистка группового чата недоступна или вы не администратор.');
                    } else {
                        alert('Не удалось очистить чат');
                    }
                }
            } catch (e) { alert('Ошибка сети'); }
        });
    }

    if (menuDeleteBtn) {
        menuDeleteBtn.addEventListener('click', async () => {
            if (confirm('Удалить чат?')) {
                const url = activeChatType === 'private' ? `${API_URL}/messages/conversation/${currentActiveChatId}` : `${API_URL}/group-chats/${currentActiveChatId}`;
                await fetch(url, { method: 'DELETE', headers: authHeaders() });
                location.reload();
            }
        });
    }

    messagesContainer.addEventListener('contextmenu', (e) => {
        const bubble = e.target.closest('.message-bubble');
        if (bubble) {
            e.preventDefault();
            targetMessageElement = bubble;
            let x = e.clientX, y = e.clientY;
            if (x + 220 > window.innerWidth) x = window.innerWidth - 220;
            if (y + 200 > window.innerHeight) y = window.innerHeight - 200;
            ctxMenu.style.left = `${x}px`; ctxMenu.style.top = `${y}px`; ctxMenu.classList.remove('hidden');
        }
    });

    window.addEventListener('click', (e) => {
        if (ctxMenu) ctxMenu.classList.add('hidden');
        if (emojiWrapper && !emojiWrapper.contains(e.target) && e.target !== emojiBtn) emojiWrapper.classList.add('hidden');
        if (chatDropdown && !chatMenuBtn.contains(e.target)) chatDropdown.classList.add('hidden');
        if (e.target === modalChat) modalChat.classList.remove('active');
        if (e.target === modalGroup) modalGroup.classList.remove('active');
    });

    if (ctxPin) ctxPin.addEventListener('click', async () => {
        if (targetMessageElement) {
            showPinnedBar(targetMessageElement.querySelector('.msg-text')?.innerText || 'Вложение', targetMessageElement);
            if (targetMessageElement.dataset.id) await apiAction(targetMessageElement.dataset.id, 'pin');
        }
    });
    function showPinnedBar(txt, el) { pinnedMessageBar.classList.remove('hidden'); pinnedText.textContent = txt; currentPinnedElement = el; }
    function hidePinnedBar() { pinnedMessageBar.classList.add('hidden'); currentPinnedElement = null; }
    if (unpinBtn) unpinBtn.addEventListener('click', async (e) => { e.stopPropagation(); if (currentPinnedElement?.dataset.id) await apiAction(currentPinnedElement.dataset.id, 'unpin'); hidePinnedBar(); });
    if (pinnedContentClick) pinnedContentClick.addEventListener('click', () => { if (currentPinnedElement) currentPinnedElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); });

    if (ctxReply) ctxReply.addEventListener('click', () => {
        if (targetMessageElement) {
            isReplying = true; replyContent = targetMessageElement.querySelector('.msg-text')?.innerText || 'Вложение';
            replyPanel.classList.remove('hidden'); replyTextPreview.textContent = replyContent; messageInput.focus();
        }
    });
    if (closeReplyBtn) closeReplyBtn.addEventListener('click', cancelReply);
    function cancelReply() { isReplying = false; replyContent = null; replyPanel.classList.add('hidden'); }

    if (ctxDelete) ctxDelete.addEventListener('click', async () => {
        if (confirm('Удалить сообщение?')) {
            const id = targetMessageElement.dataset.id;
            targetMessageElement.remove();
            if (id) await apiAction(id, 'delete');
        }
    });

    if (emojiBtn) emojiBtn.addEventListener('click', (e) => { e.stopPropagation(); emojiWrapper.classList.toggle('hidden'); });
    const picker = document.querySelector('emoji-picker');
    if (picker) picker.addEventListener('emoji-click', event => { messageInput.value += event.detail.unicode; });

    initData();
});