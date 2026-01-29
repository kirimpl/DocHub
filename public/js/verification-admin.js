document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api';
    const adminList = document.getElementById('adminRequestsList');
    const threadsList = document.getElementById('supportThreadsList');
    const chatHeader = document.getElementById('supportChatHeader');
    const chatMessages = document.getElementById('supportChatMessages');
    const chatInput = document.getElementById('supportChatInput');
    const chatSend = document.getElementById('supportChatSend');

    let activeThreadUserId = null;

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

    const fetchSupportThreads = async () => {
        const res = await fetch(`${API_URL}/verification/support/threads`, {
            headers: authHeaders(),
        });
        if (!res.ok) return [];
        return res.json();
    };

    const fetchSupportThreadMessages = async (userId) => {
        const res = await fetch(`${API_URL}/verification/support/threads/${userId}`, {
            headers: authHeaders(),
        });
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

    const formatTime = (value) => {
        if (!value) return '';
        const date = new Date(value);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderThreads = (threads) => {
        if (!threadsList) return;
        if (!threads || !threads.length) {
            threadsList.innerHTML = '<div>Нет обращений.</div>';
            return;
        }
        threadsList.innerHTML = threads.map((thread) => `
            <button class="btn-secondary" style="text-align:left;" data-thread="${thread.user_id}">
                <div style="font-weight:600;">${thread.name || 'Пользователь'}</div>
                <div style="font-size:12px; color:#6b7280;">${thread.email || ''}</div>
            </button>
        `).join('');

        threadsList.querySelectorAll('[data-thread]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                activeThreadUserId = btn.dataset.thread;
                const payload = await fetchSupportThreadMessages(activeThreadUserId);
                if (payload) {
                    chatHeader.textContent = `Чат: ${payload.user?.name || 'Пользователь'}`;
                    renderChatMessages(payload.messages, payload.current_user_id);
                }
            });
        });
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
            return `
                <div style="display: flex; justify-content: ${align};">
                    <div style="max-width: 70%; background: ${bg}; padding: 8px 12px; border-radius: 10px;">
                        <div>${msg.body || ''}</div>
                        <div style="font-size: 11px; color: #9ca3af; margin-top: 4px; text-align: right;">${formatTime(msg.created_at)}</div>
                    </div>
                </div>
            `;
        }).join('');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const init = async () => {
        const token = getAuthToken();
        if (!token) {
            if (adminList) adminList.innerHTML = '<p style="color:#999;">Нет доступа</p>';
            if (threadsList) threadsList.innerHTML = '<div>Нет доступа.</div>';
            return;
        }

        const pending = await fetchPending();
        renderRequests(pending);

        const threads = await fetchSupportThreads();
        renderThreads(threads);
    };

    if (chatSend && chatInput) {
        chatSend.addEventListener('click', async () => {
            const text = chatInput.value.trim();
            if (!text || !activeThreadUserId) return;
            const ok = await sendSupportReply(activeThreadUserId, text);
            if (ok) {
                chatInput.value = '';
                const payload = await fetchSupportThreadMessages(activeThreadUserId);
                if (payload) {
                    renderChatMessages(payload.messages, payload.current_user_id);
                }
            }
        });
    }

    init();
});
