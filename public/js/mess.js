document.addEventListener('DOMContentLoaded', () => {
    // 1. КОНФИГУРАЦИЯ
    const CONFIG = {
        API_URL: '/api',
        PUSHER_KEY: 'h81dgta6jqvb3e3mkasl',
        WS_HOST: window.location.hostname,
        WS_PORT: 8080,
    };

    const State = {
        user: null,
        chat: { id: null, type: null },
        recorder: { instance: null, chunks: [], active: false },
        pusher: null,
        echoReady: false,
        isReplying: false,
        replyContent: null,
        messageToForward: null,
        targetElement: null,
        pinnedElement: null,
        cache: { users: [], groups: [] }
    };

    // 2. ИНЪЕКЦИЯ HTML (МОДАЛКА)
    if (!document.getElementById('forwardModal')) {
        const fwModal = document.createElement('div');
        fwModal.id = 'forwardModal';
        fwModal.className = 'modal-overlay';
        fwModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Переслать</h3>
                    <button class="close-modal" id="closeForwardBtn">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="forwardList" class="contacts-list" style="max-height: 300px; overflow-y: auto;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(fwModal);
    }

    const ctxMenu = document.getElementById('msgContextMenu');
    if (ctxMenu && !document.getElementById('ctxForward')) {
        const btn = document.createElement('div');
        btn.id = 'ctxForward';
        btn.className = 'context-item';
        btn.innerHTML = '<i class="fa-solid fa-share"></i> Переслать';
        const delBtn = document.getElementById('ctxDelete');
        if (delBtn) ctxMenu.insertBefore(btn, delBtn);
        else ctxMenu.appendChild(btn);
    }

    // 3. UI
    const UI = {
        containers: {
            messages: document.querySelector('.chat-messages'),
            chats: document.getElementById('chatsListContainer'),
            groups: document.getElementById('groupsListContainer'),
            empty: document.getElementById('emptyState'),
            view: document.getElementById('chatView'),
            contacts: document.getElementById('contactsList'),
            forwardList: document.getElementById('forwardList')
        },
        header: {
            name: document.getElementById('chatHeaderName'),
            avatar: document.getElementById('chatHeaderAvatar'),
        },
        input: {
            message: document.getElementById('messageInput'),
            file: document.getElementById('hiddenFileInput'),
            search: document.getElementById('searchInput'),
            groupName: document.getElementById('groupNameInput'),
        },
        buttons: {
            send: document.getElementById('sendBtn'),
            attach: document.getElementById('attachBtn'),
            mic: document.getElementById('micBtn'),
            emoji: document.getElementById('emojiBtn'),
            createGroup: document.getElementById('btnCreateGroup'),
            submitGroup: document.getElementById('submitCreateGroup'),
            closeReply: document.getElementById('closeReplyBtn'),
            menu: document.getElementById('chatMenuBtn'),
            menuSearch: document.getElementById('menuSearchBtn'),

            menuClear: document.getElementById('menuClearBtn'),
            menuDelete: document.getElementById('menuDeleteBtn'),

            closeSearch: document.getElementById('closeSearchBtn'),
            unpin: document.getElementById('unpinBtn'),
            closeForward: document.getElementById('closeForwardBtn')
        },
        panels: {
            pinned: document.getElementById('pinnedMessageBar'),
            pinnedText: document.getElementById('pinnedText'),
            reply: document.getElementById('replyPanel'),
            replyText: document.getElementById('replyTextPreview'),
            search: document.getElementById('searchBar'),
            emoji: document.getElementById('emojiWrapper'),
            context: document.getElementById('msgContextMenu'),
            dropdown: document.getElementById('chatDropdown'),
        },
        modals: {
            chat: document.getElementById('createChatModal'),
            group: document.getElementById('createGroupModal'),
            forward: document.getElementById('forwardModal'),
        },
        ctx: {
            reply: document.getElementById('ctxReply'),
            forward: document.getElementById('ctxForward'),
            delete: document.getElementById('ctxDelete'),
            pin: document.getElementById('ctxPin'),
        }
    };

    // 4. УТИЛИТЫ
    const Utils = {
        getToken: () => localStorage.getItem('auth_token'),
        
        getHeaders: (isMultipart = false) => {
            const headers = {
                'Accept': 'application/json',
                'Authorization': `Bearer ${Utils.getToken()}`
            };
            if (!isMultipart) headers['Content-Type'] = 'application/json';
            return headers;
        },

        formatTime: (val) => val ? new Date(val).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',

        getDisplayUser: (user) => {
            if (!user) return { name: '?', initials: '?', desc: '', id: 0 };
            const name = user.name || user.email || 'Без имени';
            const i1 = (user.name || '').charAt(0).toUpperCase();
            const i2 = (user.last_name || '').charAt(0).toUpperCase();
            return {
                id: user.id,
                name: name,
                initials: (i1 + i2),
                desc: user.speciality || 'Пользователь',
                avatar: user.avatar
            };
        },

        rememberChat: (userId) => {
            if (!State.user || !userId) return;
            const key = `chats_${State.user.id}`;
            let chats = JSON.parse(localStorage.getItem(key) || '[]');
            const sid = String(userId);
            if (!chats.includes(sid)) {
                chats.push(sid);
                localStorage.setItem(key, JSON.stringify(chats));
            }
        },

        setClearTime: (chatId) => {
            if(!State.user || !chatId) return;
            const key = `cleared_${State.user.id}_${chatId}`;
            localStorage.setItem(key, new Date().toISOString());
        },

        getClearTime: (chatId) => {
            if(!State.user || !chatId) return null;
            return localStorage.getItem(`cleared_${State.user.id}_${chatId}`);
        },

        resolveUrl: (path) => {
            if (!path) return null;
            if (path.startsWith('blob:') || path.startsWith('http')) return path;
            let clean = path.replace(/^public\//, '').replace(/^\/+/, '').replace(/^storage\//, '');
            return `/storage/${clean}`;
        },

        // === ИСПРАВЛЕННАЯ ФУНКЦИЯ (ВЫРЕЗАЕТ ТЕГ НАЧИСТО) ===
        parseMessageContent: (msg) => {
            let text = msg.body || '';
            let type = 'text';
            let url = null;

            // 1. Сначала берем URL из базы данных (если есть)
            if (msg.audio_url) { type = 'audio'; url = msg.audio_url; }
            else if (msg.image_url) { type = 'image'; url = msg.image_url; }
            else if (msg.localBlobUrl) { type = msg.content_type; url = msg.localBlobUrl; }

            // 2. Регулярное выражение для поиска тегов [IMAGE|...]
            const tagRegex = /\[(IMAGE|FILE|AUDIO)\|(.*?)\]/gi;

            // Если URL еще нет (например, пришло по сокету текстом), пытаемся достать из тега
            if (!url) {
                const match = tagRegex.exec(text);
                if (match) {
                    type = match[1].toLowerCase();
                    url = match[2];
                }
            }

            // 3. ГЛАВНОЕ ИСПРАВЛЕНИЕ:
            // Жестко удаляем ВСЕ технические теги из текста, чтобы они не отображались под фото
            text = text.replace(tagRegex, '').trim();

            if (text === '.') text = '';

            if (type !== 'text' && url) url = Utils.resolveUrl(url);
            return { type, url, text };
        }
    };
    // 5. API
    const Api = {
        async req(endpoint, method = 'GET', body = null, isFile = false) {
            try {
                const opts = { method, headers: Utils.getHeaders(isFile) };
                if (body) opts.body = isFile ? body : JSON.stringify(body);

                const res = await fetch(`${CONFIG.API_URL}${endpoint}`, opts);

                if (res.status === 204) return true;

                if (res.ok) {
                    const text = await res.text();
                    try { return text ? JSON.parse(text) : true; } catch (e) { return true; }
                }
            } catch (e) { console.error(e); }
            return null;
        },
        async upload(file) {
            if (file.size > 10 * 1024 * 1024) { alert('Файл > 10МБ'); return null; }
            const fd = new FormData(); fd.append('file', file);
            const res = await Api.req('/media', 'POST', fd, true);
            return res ? (res.data || res) : null;
        }
    };

    // 6. ЛОГИКА
    const Logic = {
        async send(text, attachmentType = null, attachmentUrl = null, targetChatOverride = null) {
            const targetChat = targetChatOverride || State.chat;
            if (!targetChat.id) return;

            let finalBody = text || '';
            const payload = {};

            if (attachmentUrl) {
                finalBody += ` [${attachmentType.toUpperCase()}|${attachmentUrl}]`;
                if (attachmentType === 'audio') payload.audio_url = attachmentUrl;
                if (attachmentType === 'image') payload.image_url = attachmentUrl;
            }

            if (!finalBody.trim()) finalBody = '.';

            payload.body = finalBody;
            if (targetChat.type === 'private') payload.recipient_id = targetChat.id;

            const url = targetChat.type === 'private'
                ? '/messages/send'
                : `/group-chats/${targetChat.id}/messages`;

            await Api.req(url, 'POST', payload);
        },

        async action(id, type) {
            const base = State.chat.type === 'private' ? `/messages/${id}` : `/group-chats/${State.chat.id}/messages/${id}`;
            if (type === 'delete') {
                await Api.req(base, 'DELETE');
                return true;
            }
            else await Api.req(`${base}/${type}`, 'POST');
        },

        // 1. ОЧИСТИТЬ (Остается в списке, но пустой)
        async clearCurrentChat() {
            UI.panels.dropdown.classList.add('hidden');
            if (!confirm('Очистить историю?')) return;

            // Запоминаем время очистки (чтобы скрыть старые сообщения, даже если они придут с сервера)
            Utils.setClearTime(State.chat.id);

            const bubbles = document.querySelectorAll('.message-bubble');
            const ids = Array.from(bubbles).map(el => el.dataset.id).filter(id => id && !id.startsWith('loc'));

            UI.containers.messages.innerHTML = '<div style="text-align:center;padding:20px;color:#888">Очистка...</div>';

            // Удаляем с сервера
            if (ids.length > 0) {
                ids.forEach(id => Logic.action(id, 'delete'));
            }

            UI.containers.messages.innerHTML = '<div style="text-align:center;color:#888;margin-top:20px">История очищена</div>';
        },

        // 2. УДАЛИТЬ (Уходит из списка)
        async deleteCurrentChat() {
            UI.panels.dropdown.classList.add('hidden');

            if (State.chat.type === 'group') {
                if (!confirm('Удалить группу навсегда?')) return;
                const success = await Api.req(`/group-chats/${State.chat.id}`, 'DELETE');
                if (success) {
                    const item = document.querySelector(`.list-item[data-chat-id="${State.chat.id}"]`);
                    if (item) item.remove();
                    UI.containers.view.classList.add('hidden');
                    UI.containers.empty.classList.remove('hidden');
                } else {
                    alert('Ошибка удаления группы');
                }
            } else {
                if (!confirm('Удалить чат?')) return;

                Utils.setClearTime(State.chat.id); // Тоже ставим фильтр на всякий случай

                const bubbles = document.querySelectorAll('.message-bubble');
                const ids = Array.from(bubbles).map(el => el.dataset.id).filter(id => id && !id.startsWith('loc'));
                if (ids.length > 0) {
                    ids.forEach(id => Api.req(`/messages/${id}`, 'DELETE'));
                }

                const item = document.querySelector(`.list-item[data-chat-id="${State.chat.id}"]`);
                if (item) item.remove();

                UI.containers.view.classList.add('hidden');
                UI.containers.empty.classList.remove('hidden');

                const key = `chats_${State.user.id}`;
                let chats = JSON.parse(localStorage.getItem(key) || '[]');
                chats = chats.filter(id => String(id) !== String(State.chat.id));
                localStorage.setItem(key, JSON.stringify(chats));
            }
        }
    };

    const Render = {
        chatItem(item, type, container, isForwardMode = false) {
            let uid = null, uObj = null;
            if (type === 'private') {
                if (item.id && !item.sender_id && !item.recipient_id) { uid = item.id; uObj = item; }
                else {
                    const myId = String(State.user.id);
                    uid = String(item.sender_id) === myId ? item.recipient_id : item.sender_id;
                    uObj = String(item.sender_id) === myId ? item.recipient : item.sender;
                }
            } else { uid = item.id; uObj = { name: item.name, speciality: 'Группа', id: item.id }; }
            if (!uid || (!isForwardMode && container.querySelector(`[data-chat-id="${uid}"]`))) return;
            const d = Utils.getDisplayUser(uObj);
            const el = document.createElement('div');
            el.className = isForwardMode ? 'contact-item' : 'list-item';
            el.dataset.chatId = uid;
            el.innerHTML = `<div class="avatar-sq" style="background:${type === 'group' ? '#0056A6' : '#004080'}">${d.initials}</div><div class="${isForwardMode ? 'contact-info' : 'item-info'}"><span class="name">${d.name}</span><span class="desc">${d.desc}</span></div>`;
            el.onclick = () => {
                if (isForwardMode) { Actions.executeForward({ id: uid, type: type }); }
                else {
                    document.querySelectorAll('.list-item').forEach(i => i.classList.remove('active'));
                    el.classList.add('active');
                    Actions.open(uid, type, d);
                    if (type === 'private') Utils.rememberChat(uid);
                }
            };
            container.prepend(el);
        },

        message(msg) {
            // === ФИЛЬТР: Убираем системные уведомления о закрепе из ленты ===
            if (msg.support_ticket_id || msg.type === 'system' || msg.action === 'pin' || (msg.body && msg.body.toLowerCase().includes('закрепил'))) return;

            // === ФИЛЬТР: Проверка на очистку чата ===
            let chatIdCheck = State.chat.id;
            if (!chatIdCheck && msg.sender_id) chatIdCheck = String(msg.sender_id) === String(State.user.id) ? msg.recipient_id : msg.sender_id;
            if (chatIdCheck) {
                const clearTimeStr = Utils.getClearTime(chatIdCheck);
                if (clearTimeStr) {
                    if (new Date(msg.created_at).getTime() <= new Date(clearTimeStr).getTime()) return;
                }
            }

            const isMine = String(msg.sender_id) === String(State.user.id);
            const content = Utils.parseMessageContent(msg);
            const div = document.createElement('div');
            div.className = `message-bubble ${isMine ? 'sent' : 'received'}`;
            div.dataset.id = msg.id;
            let html = '';
            if (State.chat.type === 'group' && !isMine && msg.sender) html += `<div style="font-size:10px;color:#555;margin-bottom:2px">${Utils.getDisplayUser(msg.sender).name}</div>`;
            if (msg.reply_to) {
                const rC = Utils.parseMessageContent(msg.reply_to);
                let rT = rC.text || 'Вложение';
                if (rC.type === 'audio') rT = '🎤 Голосовое'; if (rC.type === 'image') rT = '📷 Фото';
                html += `<div class="msg-quote"><span class="quote-name">Цитата</span><span class="quote-text">${rT}</span></div>`;
            }

            if (content.type === 'image') {
                html += `<img src="${content.url}" class="msg-image" onclick="window.open('${content.url}','_blank')">`;
                if (content.text) html += `<div class="msg-text">${content.text}</div>`;
            } else if (content.type === 'audio') {
                html += `<audio controls preload="metadata" src="${content.url}" class="msg-audio"></audio>`;
            } else if (content.type === 'file') {
                html += `<a href="${content.url}" target="_blank" style="text-decoration:none;color:inherit"><div class="msg-file"><div class="msg-file-icon"><i class="fa-solid fa-file-lines"></i></div><div class="msg-file-details"><div class="msg-file-name">Файл</div><div class="msg-file-size">Скачать</div></div></div></a>`;
                if (content.text) html += `<div class="msg-text">${content.text}</div>`;
            } else {
                html += `<div class="msg-text">${content.text}</div>`;
            }

            html += `<div class="msg-meta">${Utils.formatTime(msg.created_at)} ${isMine ? '<i class="fa-solid fa-check-double" style="margin-left:5px"></i>' : ''}</div>`;
            div.innerHTML = html;
            UI.containers.messages.appendChild(div);

            // Если при загрузке истории есть флаг is_pinned - обновляем шапку
            if (msg.is_pinned) Actions.togglePin(true, content.text, div);

            UI.containers.messages.scrollTop = UI.containers.messages.scrollHeight;
        }
    };

    const Actions = {
        async init() {
            const token = Utils.getToken();
            if (!token) return;

            State.user = await Api.req('/me');
            if (!State.user) return;

            const [inbox, users, groups] = await Promise.all([
                Api.req('/messages/inbox'),
                Api.req('/users'),
                Api.req('/group-chats')
            ]);

            State.cache = { users: users || [], groups: groups || [] };

            const savedIds = JSON.parse(localStorage.getItem(`chats_${State.user.id}`) || '[]');
            const rendered = new Set();
            UI.containers.chats.innerHTML = '';

            (Array.isArray(inbox) ? inbox : (inbox?.data || [])).forEach(c => {
                const uid = String(c.sender_id) === String(State.user.id) ? c.recipient_id : c.sender_id;
                if (uid) { rendered.add(String(uid)); Render.chatItem(c, 'private', UI.containers.chats); }
            });

            if (users) {
                savedIds.forEach(id => {
                    if (!rendered.has(String(id))) {
                        const u = users.find(x => String(x.id) === String(id));
                        if (u) { Render.chatItem(u, 'private', UI.containers.chats); rendered.add(String(id)); }
                    }
                });
                if (rendered.size === 0) {
                    UI.containers.chats.innerHTML += '<div style="padding:10px;font-size:11px;color:#888;text-align:center">Контакты</div>';
                    users.forEach(u => {
                        if (u.id !== State.user.id) Render.chatItem(u, 'private', UI.containers.chats);
                    });
                }
            }

            UI.containers.groups.innerHTML = '';
            (Array.isArray(groups) ? groups : (groups?.data || [])).forEach(g => {
                if (g.type !== 'lecture') Render.chatItem(g, 'group', UI.containers.groups);
            });

            Socket.init();
        },

        async open(id, type, disp) {
            UI.containers.empty.classList.add('hidden');
            UI.containers.view.classList.remove('hidden');
            State.chat = { id, type };
            UI.header.name.textContent = disp.name;
            UI.header.avatar.textContent = disp.initials;
            Actions.togglePin(false);
            Actions.cancelReply();

            UI.containers.messages.innerHTML = '<div style="text-align:center;padding:20px">Загрузка...</div>';
            const res = await Api.req(type === 'private' ? `/messages/conversation/${id}` : `/group-chats/${id}/messages`);
            UI.containers.messages.innerHTML = '';

            if (res && Array.isArray(res) && res.length) res.forEach(Render.message);
            else UI.containers.messages.innerHTML = '<div style="text-align:center;color:#888;margin-top:20px">Напишите первое сообщение</div>';
        },

        openForwardModal() {
            UI.panels.context.classList.add('hidden');
            UI.modals.forward.classList.add('active');
            UI.containers.forwardList.innerHTML = '';

            if (State.cache.users) {
                State.cache.users.forEach(u => {
                    if (u.id !== State.user.id) Render.chatItem(u, 'private', UI.containers.forwardList, true);
                });
            }
            if (State.cache.groups) {
                (Array.isArray(State.cache.groups) ? State.cache.groups : State.cache.groups.data).forEach(g => {
                    if (g.type !== 'lecture') Render.chatItem(g, 'group', UI.containers.forwardList, true);
                });
            }
        },

        async executeForward(targetChat) {
            if (!State.messageToForward) return;
            const msg = State.messageToForward;
            const content = Utils.parseMessageContent(msg);

            await Logic.send(content.text, content.type, content.url, targetChat);

            UI.modals.forward.classList.remove('active');
            alert('Сообщение переслано!');
        },

        async sendMsg() {
            const txt = UI.input.message.value.trim();
            if (!txt && !State.recorder.active) return;

            const tmp = {
                id: 'tmp-' + Date.now(), body: txt, created_at: new Date(),
                sender_id: State.user.id, localBlobUrl: null
            };
            if (State.isReplying) tmp.reply_to = { body: State.replyContent };

            Render.message(tmp);
            UI.input.message.value = '';
            Actions.cancelReply();
            Actions.toggleBtn();
            if (State.chat.type === 'private') Utils.rememberChat(State.chat.id);

            await Logic.send(txt);
        },

        async sendFile(file) {
            if (!file || !State.chat.id) return;
            const type = file.type.startsWith('image/') ? 'image' : 'file';
            const url = URL.createObjectURL(file);

            Render.message({
                id: 'loc-' + Date.now(), sender_id: State.user.id, created_at: new Date(),
                body: '', localBlobUrl: url, content_type: type
            });
            if (State.chat.type === 'private') Utils.rememberChat(State.chat.id);

            const up = await Api.upload(file);
            if (up) await Logic.send('', type, up.path || up.url);
        },

        toggleBtn() {
            const show = UI.input.message.value.trim().length > 0;
            UI.buttons.send.classList.toggle('hidden', !show);
            UI.buttons.send.classList.toggle('visible', show);
        },

        cancelReply() {
            State.isReplying = false; UI.panels.reply.classList.add('hidden');
        },

        togglePin(show, txt = '', el = null) {
            if (show) {
                UI.panels.pinned.classList.remove('hidden');
                UI.panels.pinnedText.textContent = txt;
                State.pinnedElement = el;
            } else {
                UI.panels.pinned.classList.add('hidden');
                State.pinnedElement = null;
            }
        }
    };

    const Socket = {
        init() {
            if (State.echoReady || !window.Pusher || !State.user) return;
            State.pusher = new window.Pusher(CONFIG.PUSHER_KEY, {
                wsHost: CONFIG.WS_HOST, wsPort: CONFIG.WS_PORT, forceTLS: false, encrypted: false,
                enabledTransports: ['ws', 'wss'], authEndpoint: '/broadcasting/auth',
                auth: { headers: { Authorization: `Bearer ${Utils.getToken()}` } }
            });

            // КАНАЛ СООБЩЕНИЙ
            const channel = State.pusher.subscribe(`private-messages.${State.user.id}`);

            // 1. Пришло новое сообщение
            channel.bind('MessageSent', (e) => {
                const msg = e.message || e;
                if (!msg || msg.support_ticket_id) return;
                if (e.sender) msg.sender = e.sender;
                if (State.chat.type === 'private' && String(msg.sender_id) === String(State.chat.id)) {
                    Render.message(msg);
                }
            });

            // 2. Сообщение ЗАКРЕПИЛИ
            channel.bind('MessagePinned', (e) => {
                const msg = e.message || e;
                if (State.chat.id) {
                    // Проверяем, относится ли закреп к текущему чату
                    const belongs = (State.chat.type === 'private' && (String(msg.sender_id) === String(State.chat.id) || String(msg.recipient_id) === String(State.chat.id))) ||
                        (State.chat.type === 'group' && String(msg.chat_group_id) === String(State.chat.id));

                    if (belongs) {
                        const content = Utils.parseMessageContent(msg);
                        Actions.togglePin(true, content.text);
                    }
                }
            });

            // 3. Сообщение ОТКРЕПИЛИ
            channel.bind('MessageUnpinned', () => {
                Actions.togglePin(false);
            });

            State.echoReady = true;
        }
    };

    // 8. LISTENERS
    UI.buttons.send.onclick = Actions.sendMsg;
    UI.input.message.onkeypress = e => { if (e.key === 'Enter') Actions.sendMsg(); };
    UI.input.message.oninput = Actions.toggleBtn;

    UI.buttons.attach.onclick = () => UI.input.file.click();
    UI.input.file.onchange = function () { if (this.files[0]) Actions.sendFile(this.files[0]); this.value = ''; };

    UI.buttons.emoji.onclick = (e) => { e.stopPropagation(); UI.panels.emoji.classList.toggle('hidden'); };
    document.querySelector('emoji-picker')?.addEventListener('emoji-click', e => {
        UI.input.message.value += e.detail.unicode;
        Actions.toggleBtn(); UI.input.message.focus();
    });

    UI.buttons.mic.onclick = async () => {
        if (!State.chat.id) return;
        if (State.recorder.active) { State.recorder.instance.stop(); return; }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream);
            State.recorder = { instance: mr, chunks: [], active: true };
            mr.start();
            UI.buttons.mic.innerHTML = '<i class="fa-solid fa-stop" style="color:red"></i>';
            UI.input.message.disabled = true; UI.input.message.placeholder = 'Запись...';

            mr.ondataavailable = e => State.recorder.chunks.push(e.data);
            mr.onstop = async () => {
                const file = new File([new Blob(State.recorder.chunks, { type: 'audio/webm' })], "v.webm", { type: "audio/webm" });
                Render.message({
                    id: 'loc-' + Date.now(), sender_id: State.user.id, created_at: new Date(),
                    body: '', localBlobUrl: URL.createObjectURL(file), content_type: 'audio'
                });
                UI.buttons.mic.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                if (State.chat.type === 'private') Utils.rememberChat(State.chat.id);

                const up = await Api.upload(file);
                if (up) await Logic.send('', 'audio', up.path || up.url);

                State.recorder.active = false;
                UI.buttons.mic.innerHTML = '<i class="fa-solid fa-microphone"></i>'; UI.buttons.mic.style.color = '';
                UI.input.message.disabled = false; UI.input.message.placeholder = 'Сообщение...';
                stream.getTracks().forEach(t => t.stop());
            };
        } catch (e) { alert('Микрофон недоступен'); }
    };

    UI.buttons.menu.onclick = (e) => { e.stopPropagation(); UI.panels.dropdown.classList.toggle('hidden'); };
    UI.buttons.menuSearch.onclick = () => { UI.panels.dropdown.classList.add('hidden'); UI.panels.search.classList.remove('hidden'); UI.input.search.focus(); };
    UI.buttons.closeSearch.onclick = () => { UI.panels.search.classList.add('hidden'); UI.input.search.value = ''; document.querySelectorAll('.message-bubble').forEach(m => m.classList.remove('hidden')); };
    UI.input.search.oninput = (e) => {
        const v = e.target.value.toLowerCase();
        document.querySelectorAll('.message-bubble').forEach(m => m.classList.toggle('hidden', !m.querySelector('.msg-text')?.textContent.toLowerCase().includes(v)));
    };

    if (UI.buttons.menuClear) UI.buttons.menuClear.onclick = Logic.clearCurrentChat;
    if (UI.buttons.menuDelete) UI.buttons.menuDelete.onclick = Logic.deleteCurrentChat;

    UI.containers.messages.oncontextmenu = (e) => {
        const b = e.target.closest('.message-bubble');
        if (b) {
            e.preventDefault(); State.targetElement = b;

            const content = Utils.parseMessageContent({
                body: b.querySelector('.msg-text')?.textContent || '',
                audio_url: b.querySelector('audio')?.src,
                image_url: b.querySelector('.msg-image')?.src
            });
            State.messageToForward = { body: content.text, audio_url: content.type === 'audio' ? content.url : null, image_url: content.type === 'image' ? content.url : null };

            let x = e.clientX, y = e.clientY;
            if (x + 220 > window.innerWidth) x = window.innerWidth - 220;
            if (y + 200 > window.innerHeight) y = window.innerHeight - 200;

            UI.panels.context.style.left = x + 'px';
            UI.panels.context.style.top = y + 'px';
            UI.panels.context.classList.remove('hidden');
        }
    };

    UI.ctx.reply.onclick = () => {
        State.isReplying = true; State.replyContent = State.targetElement.querySelector('.msg-text')?.innerText || 'Вложение';
        UI.panels.reply.classList.remove('hidden'); UI.panels.replyText.textContent = State.replyContent; UI.input.message.focus();
    };
    UI.ctx.delete.onclick = async () => {
        if (confirm('Удалить?')) {
            const id = State.targetElement.dataset.id; State.targetElement.remove();
            if (id) await Logic.action(id, 'delete');
        }
    };
    UI.ctx.pin.onclick = async () => {
        const txt = State.targetElement.querySelector('.msg-text')?.innerText || 'Вложение';
        Actions.togglePin(true, txt, State.targetElement);
        if (State.targetElement.dataset.id) await Logic.action(State.targetElement.dataset.id, 'pin');
    };
    UI.ctx.forward.onclick = () => {
        Actions.openForwardModal();
    };

    UI.buttons.unpin.onclick = async (e) => {
        e.stopPropagation();
        if (State.pinnedElement?.dataset.id) await Logic.action(State.pinnedElement.dataset.id, 'unpin');
        Actions.togglePin(false);
    };
    UI.buttons.closeReply.onclick = Actions.cancelReply;
    if (UI.buttons.closeForward) UI.buttons.closeForward.onclick = () => UI.modals.forward.classList.remove('active');

    window.onclick = (e) => {
        if (!UI.panels.context.contains(e.target)) UI.panels.context.classList.add('hidden');
        if (!UI.panels.emoji.contains(e.target) && e.target !== UI.buttons.emoji) UI.panels.emoji.classList.add('hidden');
        if (!UI.buttons.menu.contains(e.target)) UI.panels.dropdown.classList.add('hidden');
        if (e.target === UI.modals.chat) UI.modals.chat.classList.remove('active');
        if (e.target === UI.modals.group) UI.modals.group.classList.remove('active');
        if (e.target === UI.modals.forward) UI.modals.forward.classList.remove('active');
    };

    document.querySelectorAll('.trigger-modal').forEach(b => b.onclick = () => { if (!b.textContent.includes('группу')) { UI.modals.chat.classList.add('active'); renderContacts(); } });
    document.querySelectorAll('.close-modal').forEach(b => b.onclick = function () { this.closest('.modal-overlay').classList.remove('active'); });
    UI.buttons.createGroup.onclick = (e) => { e.stopPropagation(); UI.modals.group.classList.add('active'); };
    UI.buttons.submitGroup.onclick = async () => {
        const n = UI.input.groupName.value.trim();
        if (!n) return alert('Название?');
        if (await Api.req('/group-chats', 'POST', { name: n, member_ids: [] })) {
            UI.modals.group.classList.remove('active'); UI.input.groupName.value = ''; Actions.init();
        }
    };

    async function renderContacts() {
        UI.containers.contacts.innerHTML = 'Загрузка...';
        const u = await Api.req('/users');
        UI.containers.contacts.innerHTML = '';
        if (u) u.forEach(user => {
            if (user.id === State.user.id) return;
            const d = Utils.getDisplayUser(user);
            const el = document.createElement('div');
            el.className = 'contact-item';
            el.innerHTML = `<div class="avatar-sq">${d.initials}</div><div class="contact-info"><h4>${d.name}</h4><p>${d.desc}</p></div>`;
            el.onclick = () => {
                Render.chatItem(user, 'private', UI.containers.chats);
                UI.modals.chat.classList.remove('active');
                Actions.open(user.id, 'private', d);
                Utils.rememberChat(user.id);
            };
            UI.containers.contacts.appendChild(el);
        });
    }

    Actions.init();
});