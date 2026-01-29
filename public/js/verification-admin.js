document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api';
    const adminList = document.getElementById('adminRequestsList');
    const threadsList = document.getElementById('supportThreadsList');
    const chatHeader = document.getElementById('supportChatHeader');
    const chatMessages = document.getElementById('supportChatMessages');
    const chatInput = document.getElementById('supportChatInput');
    const chatSend = document.getElementById('supportChatSend');
    const resolvedList = document.getElementById('supportResolvedList');
    const approvedList = document.getElementById('verificationApprovedList');

    if (!adminList && !threadsList) {
        return;
    }

    let activeThreadUserId = null;
    let currentAdminId = null;
    let echoReady = false;
    let pusherClient = null;
    const messageCache = new Map();

    const getAuthToken = () => localStorage.getItem('auth_token');

    const authHeaders = () => ({
        Accept: 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
    });

    const fetchPending = async () => {
        const res = await fetch(`${API_URL}/verification/pending`, {
            headers: authHeaders(),
        });
        if (!res.ok) return null;
        return res.json();
    };

    const approveUser = async (id) => {
        await fetch(`${API_URL}/verification/${id}/approve`, {
            method: 'POST',
            headers: authHeaders(),
        });
    };

    const rejectUser = async (id) => {
        const notes = prompt('Причина отклонения (необязательно):') || null;
        await fetch(`${API_URL}/verification/${id}/reject`, {
            method: 'POST',
            headers: {
                ...authHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notes }),
        });
    };

    const resolveDocUrl = (doc) => {
        if (!doc || !doc.file_path) return '#';
        if (doc.file_path.startsWith('http')) return doc.file_path;
        return `/storage/${doc.file_path}`;
    };

    const renderDocs = (docs) => {
        if (!docs || !docs.length) {
            return '<span style="color:#9ca3af;">Нет файлов</span>';
        }
        return docs.map((doc) => `
            <div style="margin-top: 6px;">
                <a href="${resolveDocUrl(doc)}" target="_blank" rel="noopener">Открыть файл</a>
                <span style="color:#9ca3af; font-size:12px;">(${doc.status || 'pending'})</span>
            </div>
        `).join('');
    };

    const renderRequests = (items) => {
        if (!adminList) return;
        if (!items || !items.length) {
            adminList.innerHTML = '<p style="color:#999;">Нет заявок</p>';
            return;
        }
        adminList.innerHTML = items.map((item) => `
            <div class="admin-request" style="padding: 12px 0; border-bottom: 1px solid #eef2f7;">
                <div style="font-weight: 600;">${item.name || 'Пользователь'} (${item.email || '-'})</div>
                <div style="color:#6b7280; font-size: 13px;">${item.work_place || 'Без места работы'}</div>
                <div style="margin-top: 8px;">${renderDocs(item.verification_documents)}</div>
                <div style="margin-top: 10px; display:flex; gap:8px;">
                    <button class="btn-primary" data-approve="${item.id}">Подтвердить</button>
                    <button class="btn-secondary" data-reject="${item.id}">Отклонить</button>
                </div>
            </div>
        `).join('');

        adminList.querySelectorAll('[data-approve]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                await approveUser(btn.dataset.approve);
                const pending = await fetchPending();
                renderRequests(pending);
            });
        });
        adminList.querySelectorAll('[data-reject]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                await rejectUser(btn.dataset.reject);
                const pending = await fetchPending();
                renderRequests(pending);
            });
        });
    };

    const fetchSupportThreads = async (status = 'open') => {
        const query = status ? `?status=${encodeURIComponent(status)}` : '';
        const res = await fetch(`${API_URL}/verification/support/threads${query}`, {
            headers: authHeaders(),
        });
        if (!res.ok) return null;
        return res.json();
    };

    const fetchApproved = async () => {
        if (!approvedList) return null;
        const res = await fetch(`${API_URL}/verification/approved`, {
            headers: authHeaders(),
        });
        if (!res.ok) return null;
        return res.json();
    };

    const fetchSupportThreadMessages = async (userId) => {
        const res = await fetch(`${API_URL}/verification/support/threads/${userId}`, {
            headers: authHeaders(),
        });
        if (!res.ok) return null;
        return res.json();
    };

    const fetchCurrentUser = async () => {
        const res = await fetch(`${API_URL}/me`, { headers: authHeaders() });
        if (!res.ok) return null;
        return res.json();
    };

    const sendSupportReply = async (userId, text) => {
        const res = await fetch(`${API_URL}/verification/support/threads/${userId}`, {
            method: 'POST',
            headers: {
                ...authHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ body: text }),
        });
        return res.ok;
    };

    const resolveSupportTicket = async (userId) => {
        const res = await fetch(`${API_URL}/verification/support/threads/${userId}/resolve`, {
            method: 'POST',
            headers: authHeaders(),
        });
        return res.ok;
    };

    const formatTime = (value) => {
        if (!value) return '';
        const date = new Date(value);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const selectThread = async (userId, { refresh = true } = {}) => {
        activeThreadUserId = userId;
        if (threadsList) {
            threadsList.querySelectorAll('[data-thread]').forEach((btn) => {
                const isActive = btn.dataset.thread === String(userId);
                btn.classList.toggle('is-active', isActive);
                btn.style.borderColor = isActive ? '#93c5fd' : '';
                btn.style.background = isActive ? '#eff6ff' : '';
            });
        }
        if (refresh) {
            const payload = await fetchSupportThreadMessages(userId);
            if (payload) {
                const statusLabel = payload.ticket?.status === 'resolved' ? 'Решена' : 'Не решена';
                chatHeader.textContent = `Чат: ${payload.user?.name || 'Пользователь'} — Статус заявки: ${statusLabel}`;
                renderResolveButton(payload.ticket);
                if (Array.isArray(payload.messages) && payload.messages.length > 0) {
                    messageCache.set(String(userId), payload.messages);
                    renderChatMessages(payload.messages, payload.current_user_id);
                } else if (messageCache.has(String(userId))) {
                    renderChatMessages(messageCache.get(String(userId)), payload.current_user_id);
                } else {
                    renderChatMessages(payload.messages, payload.current_user_id);
                }
            }
        }
    };

    const renderThreadList = (container, threads, emptyText) => {
        if (!container) return;
        if (!threads || !threads.length) {
            container.innerHTML = `<div>${emptyText}</div>`;
            return;
        }
        container.innerHTML = threads.map((thread) => {
            const statusLabel = thread.status === 'resolved' ? 'Решена' : 'Не решена';
            return `
                <button class="btn-secondary" style="text-align:left;" data-thread="${thread.user_id}">
                    <div style="font-weight:600;">${thread.name || 'Пользователь'}</div>
                    <div style="font-size:12px; color:#6b7280;">${thread.email || ''}</div>
                    <div style="font-size:11px; color:#93a3b8;">Статус: ${statusLabel}</div>
                </button>
            `;
        }).join('');

        container.querySelectorAll('[data-thread]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                await selectThread(btn.dataset.thread);
            });
        });
    };

    const renderThreads = (openThreads, resolvedThreads) => {
        if (!threadsList && !resolvedList) return;
        renderThreadList(threadsList, openThreads, 'Нет обращений.');
        renderThreadList(resolvedList, resolvedThreads, 'Нет решенных обращений.');

        const allThreads = [...(openThreads || []), ...(resolvedThreads || [])];
        if (activeThreadUserId) {
            const exists = allThreads.some((thread) => String(thread.user_id) === String(activeThreadUserId));
            if (exists) {
                selectThread(activeThreadUserId, { refresh: false });
            }
        } else if (chatMessages && !chatMessages.innerHTML) {
            chatMessages.innerHTML = '<div style="color:#9ca3af;">Выберите диалог.</div>';
        }
    };

    const renderApproved = (items) => {
        if (!approvedList) return;
        if (!items || !items.length) {
            approvedList.innerHTML = '<p style="color:#999;">Нет подтверждений</p>';
            return;
        }
        approvedList.innerHTML = items.map((item) => `
            <div style="padding: 10px 0; border-bottom: 1px solid #eef2f7;">
                <div style="font-weight: 600;">${item.name || 'Пользователь'} (${item.email || '-'})</div>
                <div style="color:#6b7280; font-size: 12px;">
                    Подтвердил: ${item.reviewed_by_name || '—'}
                </div>
                <div style="color:#9ca3af; font-size: 12px;">
                    Дата: ${item.reviewed_at || '—'}
                </div>
            </div>
        `).join('');
    };

    const refreshThreads = async () => {
        const [openThreads, resolvedThreads] = await Promise.all([
            fetchSupportThreads('open'),
            fetchSupportThreads('resolved'),
        ]);
        if (openThreads === null || resolvedThreads === null) return;
        renderThreads(openThreads, resolvedThreads);
        if (activeThreadUserId) {
            const payload = await fetchSupportThreadMessages(activeThreadUserId);
            if (payload) {
                if (Array.isArray(payload.messages) && payload.messages.length > 0) {
                    messageCache.set(String(activeThreadUserId), payload.messages);
                    renderChatMessages(payload.messages, payload.current_user_id);
                } else if (messageCache.has(String(activeThreadUserId))) {
                    renderChatMessages(messageCache.get(String(activeThreadUserId)), payload.current_user_id);
                } else {
                    renderChatMessages(payload.messages, payload.current_user_id);
                }
            }
        }
    };

    const renderChatMessages = (messages, currentUserId) => {
        if (!chatMessages) return;
        if (!messages || !messages.length) {
            chatMessages.innerHTML = '<div style="color:#9ca3af;">Нет сообщений.</div>';
            return;
        }
        chatMessages.innerHTML = messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            const align = isMine ? 'flex-end' : 'flex-start';
            const bg = isMine ? '#e0f2fe' : '#f3f4f6';
            const name = msg.sender_name ? msg.sender_name : (isMine ? 'Вы' : 'Пользователь');
            return `
                <div style="display: flex; justify-content: ${align};">
                    <div style="max-width: 70%; background: ${bg}; padding: 8px 12px; border-radius: 10px;">
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${name}</div>
                        <div>${msg.body || ''}</div>
                        <div style="font-size: 11px; color: #9ca3af; margin-top: 4px; text-align: right;">${formatTime(msg.created_at)}</div>
                    </div>
                </div>
            `;
        }).join('');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const renderResolveButton = (ticket) => {
        if (!chatHeader) return;
        let container = document.getElementById('supportResolveWrap');
        if (!container) {
            container = document.createElement('div');
            container.id = 'supportResolveWrap';
            container.style.marginTop = '6px';
            chatHeader.insertAdjacentElement('afterend', container);
        }
        container.innerHTML = '';
        if (!ticket || ticket.status !== 'resolved') {
            const btn = document.createElement('button');
            btn.className = 'btn-secondary';
            btn.textContent = 'Решена';
            btn.addEventListener('click', async () => {
                if (!activeThreadUserId) return;
                const ok = await resolveSupportTicket(activeThreadUserId);
                if (ok) {
                    const [openThreads, resolvedThreads] = await Promise.all([
                        fetchSupportThreads('open'),
                        fetchSupportThreads('resolved'),
                    ]);
                    if (openThreads !== null && resolvedThreads !== null) {
                        renderThreads(openThreads, resolvedThreads);
                    }
                    const payload = await fetchSupportThreadMessages(activeThreadUserId);
                    if (payload) {
                        const statusLabel = payload.ticket?.status === 'resolved' ? 'Решена' : 'Не решена';
                        chatHeader.textContent = `Чат: ${payload.user?.name || 'Пользователь'} — Статус заявки: ${statusLabel}`;
                        renderResolveButton(payload.ticket);
                        renderChatMessages(payload.messages, payload.current_user_id);
                    }
                }
            });
            container.appendChild(btn);
        } else if (ticket.resolved_by_name) {
            const note = document.createElement('div');
            note.style.color = '#6b7280';
            note.style.fontSize = '12px';
            note.textContent = `Решено: ${ticket.resolved_by_name}`;
            container.appendChild(note);
        }
    };

    const handleAdminMessage = async (event) => {
        const msg = event?.message || event;
        if (!msg) return;
        const otherId = msg.sender_id === currentAdminId ? msg.recipient_id : msg.sender_id;
        if (otherId) {
            const cached = messageCache.get(String(otherId)) || [];
            messageCache.set(String(otherId), [...cached, msg]);
        }

        const [openThreads, resolvedThreads] = await Promise.all([
            fetchSupportThreads('open'),
            fetchSupportThreads('resolved'),
        ]);
        if (openThreads !== null && resolvedThreads !== null) {
            renderThreads(openThreads, resolvedThreads);
        }

        if (activeThreadUserId && String(activeThreadUserId) === String(otherId)) {
            renderChatMessages(messageCache.get(String(otherId)) || [msg], currentAdminId);
        }
    };

    const initEcho = () => {
        if (echoReady || !currentAdminId) return;
        if (!window.Pusher) return;
        if (window.Echo && typeof window.Echo.private === 'function') {
            window.Echo.private(`messages.${currentAdminId}`).listen('.MessageSent', handleAdminMessage);
            echoReady = true;
            return;
        }

        if (!pusherClient) {
            const token = getAuthToken();
            if (!token) return;
            const echoKey = window.ECHO_KEY || 'h81dgta6jqvb3e3mkasl';
            pusherClient = new window.Pusher(echoKey, {
                wsHost: window.location.hostname,
                wsPort: 8080,
                forceTLS: false,
                encrypted: false,
                enabledTransports: ['ws', 'wss'],
                authEndpoint: '/broadcasting/auth',
                auth: { headers: { Authorization: `Bearer ${token}` } },
            });
        }

        if (pusherClient) {
            const channel = pusherClient.subscribe(`private-messages.${currentAdminId}`);
            channel.bind('MessageSent', handleAdminMessage);
            echoReady = true;
        }
    };

    const init = async () => {
        const token = getAuthToken();
        if (!token) {
            if (adminList) adminList.innerHTML = '<p style="color:#999;">Нет доступа</p>';
            if (threadsList) threadsList.innerHTML = '<div>Нет доступа.</div>';
            return;
        }

        const me = await fetchCurrentUser();
        currentAdminId = me?.id || null;
        const pending = await fetchPending();
        renderRequests(pending);

        const [openThreads, resolvedThreads] = await Promise.all([
            fetchSupportThreads('open'),
            fetchSupportThreads('resolved'),
        ]);
        if (openThreads !== null && resolvedThreads !== null) {
            renderThreads(openThreads, resolvedThreads);
        }

        const approved = await fetchApproved();
        if (approved !== null) {
            renderApproved(approved);
        }

        initEcho();
    };

    if (chatSend && chatInput) {
        let sending = false;
        chatSend.addEventListener('click', async () => {
            if (sending) return;
            const text = chatInput.value.trim();
            if (!text || !activeThreadUserId) return;
            sending = true;
            chatSend.disabled = true;
            chatSend.textContent = 'Отправка...';
            const optimistic = {
                sender_id: currentAdminId,
                recipient_id: Number(activeThreadUserId),
                body: text,
                created_at: new Date().toISOString(),
            };
            const cached = messageCache.get(String(activeThreadUserId)) || [];
            messageCache.set(String(activeThreadUserId), [...cached, optimistic]);
            renderChatMessages(messageCache.get(String(activeThreadUserId)), currentAdminId);
            chatInput.value = '';
            const ok = await sendSupportReply(activeThreadUserId, text);
            if (!ok) {
                alert('Не удалось отправить сообщение.');
            }
            chatSend.disabled = false;
            chatSend.textContent = 'Отправить';
            sending = false;
        });
    }

    init();
});
