document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api';
    const statusLabel = document.getElementById('verificationStatusLabel');
    const btnUpload = document.getElementById('btnUploadDocs');
    const fileInput = document.getElementById('verificationFileInput');
    const btnHelpToggle = document.getElementById('btnHelpToggle');
    const helpPanel = document.getElementById('helpPanel');
    const docsList = document.getElementById('verificationDocsList');
    const messagesBox = document.getElementById('supportChatMessages');
    const messageInput = document.getElementById('supportChatInput');
    const btnSend = document.getElementById('btnSupportSend');
    const ticketsList = document.getElementById('supportTicketsList');
    const newTicketBtn = document.getElementById('supportNewTicket');

    if (!statusLabel && !messagesBox && !docsList) {
        return;
    }

    let supportUser = null;
    let currentUserId = null;
    let activeTicketId = null;
    let activeTicketStatus = null;
    let echoReady = false;

    const getAuthToken = () => localStorage.getItem('auth_token');

    const authHeaders = () => ({
        Accept: 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
    });

    const setStatus = (value) => {
        if (statusLabel) statusLabel.textContent = value || 'неизвестно';
        if (btnUpload) {
            btnUpload.style.display = value === 'verified' ? 'none' : '';
        }
    };

    const formatTime = (value) => {
        if (!value) return '';
        const date = new Date(value);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderDocs = (items) => {
        if (!docsList) return;
        if (!items || !items.length) {
            docsList.innerHTML = '<div>Документы не загружены.</div>';
            return;
        }
        docsList.innerHTML = items.map((doc) => {
            const href = doc.file_path ? `/storage/${doc.file_path}` : '#';
            const status = doc.status || 'pending';
            return `<div><a href="${href}" target="_blank" rel="noopener">Документ</a> <span style="color:#9ca3af;">(${status})</span></div>`;
        }).join('');
    };

    const renderMessages = (items, currentUserId) => {
        if (!messagesBox) return;
        if (!items || !items.length) {
            messagesBox.innerHTML = '<div style="color:#9ca3af;">Нет сообщений.</div>';
            return;
        }
        messagesBox.innerHTML = items.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            const align = isMine ? 'flex-end' : 'flex-start';
            const bg = isMine ? '#e0f2fe' : '#f3f4f6';
            const label = isMine ? 'Вы' : (supportUser?.name || 'Поддержка');
            return `
                <div style="display: flex; justify-content: ${align};">
                    <div style="max-width: 70%; background: ${bg}; padding: 8px 12px; border-radius: 10px;">
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${label}</div>
                        <div>${msg.body || ''}</div>
                        <div style="font-size: 11px; color: #9ca3af; margin-top: 4px; text-align: right;">${formatTime(msg.created_at)}</div>
                    </div>
                </div>
            `;
        }).join('');
        messagesBox.scrollTop = messagesBox.scrollHeight;
    };

    const normalizeTicketsList = () => {
        if (!ticketsList) return;
        const buttons = ticketsList.querySelectorAll('[data-ticket]');
        if (!buttons.length) {
            ticketsList.innerHTML = '<div style="color:#9ca3af;">Нет обращений.</div>';
            return;
        }
        buttons.forEach((btn) => {
            const status = btn.dataset.status;
            const label = status === 'resolved'
                ? '\u0420\u0435\u0448\u0435\u043d\u0430'
                : '\u041e\u0442\u043a\u0440\u044b\u0442\u0430';
            const lastLine = btn.querySelector('div:last-child');
            if (lastLine) {
                lastLine.textContent = lastLine.textContent.includes('Статус')
                    ? `Статус: ${label}`
                    : label;
            }
        });
    };

    const appendMessage = (msg) => {
        if (!messagesBox || !currentUserId) return;
        if (!msg) return;
        const isMine = msg.sender_id === currentUserId;
        const align = isMine ? 'flex-end' : 'flex-start';
        const bg = isMine ? '#e0f2fe' : '#f3f4f6';
        const label = isMine ? 'Вы' : (supportUser?.name || 'Поддержка');
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = align;
        wrapper.innerHTML = `
            <div style="max-width: 70%; background: ${bg}; padding: 8px 12px; border-radius: 10px;">
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${label}</div>
                <div>${msg.body || ''}</div>
                <div style="font-size: 11px; color: #9ca3af; margin-top: 4px; text-align: right;">${formatTime(msg.created_at)}</div>
            </div>
        `;
        messagesBox.appendChild(wrapper);
        messagesBox.scrollTop = messagesBox.scrollHeight;
    };

    const fetchStatus = async () => {
        const res = await fetch(`${API_URL}/verification/status`, { headers: authHeaders() });
        if (!res.ok) return null;
        return res.json();
    };

    const fetchDocs = async () => {
        const res = await fetch(`${API_URL}/verification/documents`, { headers: authHeaders() });
        if (!res.ok) return [];
        return res.json();
    };

    const fetchSupport = async () => {
        const res = await fetch(`${API_URL}/verification/support`, { headers: authHeaders() });
        if (!res.ok) return null;
        const data = await res.json();
        return data.support || null;
    };

    const fetchTickets = async (status = '') => {
        const query = status ? `?status=${encodeURIComponent(status)}` : '';
        const res = await fetch(`${API_URL}/verification/support/tickets${query}`, { headers: authHeaders() });
        if (!res.ok) return [];
        return res.json();
    };

    const fetchMessages = async (ticketId) => {
        const query = ticketId ? `?ticket_id=${encodeURIComponent(ticketId)}` : '';
        const res = await fetch(`${API_URL}/verification/support/messages${query}`, { headers: authHeaders() });
        if (!res.ok) return null;
        return res.json();
    };

    const sendMessage = async (text, ticketId) => {
        const res = await fetch(`${API_URL}/verification/support/messages`, {
            method: 'POST',
            headers: {
                ...authHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                body: text,
                ticket_id: ticketId || null,
            }),
        });
        if (!res.ok) return null;
        return res.json();
    };

    const uploadDocument = async (file) => {
        const form = new FormData();
        form.append('document', file);
        const res = await fetch(`${API_URL}/verification/documents`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: form,
        });
        return res.ok;
    };

    let echoRetryCount = 0;
    let pusherClient = null;

    const bindSupportEvents = (handler) => {
        handler('MessageSent', (event) => {
            const msg = event?.message || event;
            if (!msg) return;
            if (!supportUser) return;
            if (msg.sender_id !== supportUser.id && msg.recipient_id !== supportUser.id) return;
            if (activeTicketId && msg.support_ticket_id && msg.support_ticket_id !== activeTicketId) return;
            appendMessage(msg);
        });
        handler('SupportTicketResolved', (event) => {
            if (!event || event.user_id !== currentUserId) return;
            if (event.ticket_id && activeTicketId && event.ticket_id !== activeTicketId) return;
            activeTicketStatus = 'resolved';
            if (messageInput) messageInput.disabled = true;
            if (btnSend) btnSend.disabled = true;
            if (ticketsList) {
                fetchTickets().then((tickets) => {
                    ticketsList.innerHTML = tickets.length
                        ? tickets.map((ticket) => {
                            const label = ticket.status === 'resolved' ? 'Решена' : 'Открыта';
                            return `
                                <button class="btn-secondary" style="text-align:left;" data-ticket="${ticket.id}" data-status="${ticket.status}">
                                    <div style="font-weight:600;">#${ticket.id}</div>
                                    <div style="font-size:11px; color:#93a3b8;">${label}</div>
                                </button>
                            `;
                        }).join('')
                        : '<div style="color:#9ca3af;">Нет обращений.</div>';
                    normalizeTicketsList();
                });
            }
        });
    };

    const initEcho = () => {
        if (echoReady || !currentUserId) return;
        if (!window.Pusher) return;

        if (window.Echo && typeof window.Echo.private === 'function') {
            echoReady = true;
            const channel = window.Echo.private(`messages.${currentUserId}`);
            bindSupportEvents((eventName, cb) => channel.listen(`.${eventName}`, cb));
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
            const channel = pusherClient.subscribe(`private-messages.${currentUserId}`);
            bindSupportEvents((eventName, cb) => channel.bind(eventName, cb));
            echoReady = true;
            return;
        }

        if (echoRetryCount < 10) {
            echoRetryCount += 1;
            setTimeout(initEcho, 500);
        }
    };

    const init = async () => {
        const token = getAuthToken();
        if (!token) {
            setStatus('нужно войти');
            if (messagesBox) {
                messagesBox.innerHTML = '<div style="color:#9ca3af;">Требуется авторизация.</div>';
            }
            return;
        }

        const statusData = await fetchStatus();
        setStatus(statusData?.status || 'неизвестно');

        const docs = await fetchDocs();
        renderDocs(docs);

        supportUser = await fetchSupport();
        const tickets = await fetchTickets();
        if (ticketsList) {
            if (!tickets.length) {
                ticketsList.innerHTML = '<div style="color:#9ca3af;">РќРµС‚ РѕР±СЂР°С‰РµРЅРёР№.</div>';
            } else {
                    ticketsList.innerHTML = tickets.map((ticket) => {
                        const label = ticket.status === 'resolved' ? 'Р РµС€РµРЅР°' : 'РћС‚РєСЂС‹С‚Р°';
                        return `
                            <button class="btn-secondary" style="text-align:left;" data-ticket="${ticket.id}" data-status="${ticket.status}">
                                <div style="font-weight:600;">#${ticket.id}</div>
                                <div style="font-size:11px; color:#93a3b8;">${label}</div>
                            </button>
                        `;
                    }).join('');
                    normalizeTicketsList();
                }
            }
        normalizeTicketsList();

        const openTicket = tickets.find((ticket) => ticket.status === 'open');
        activeTicketId = openTicket ? openTicket.id : (tickets[0]?.id || null);
        activeTicketStatus = openTicket ? 'open' : (tickets[0]?.status || null);

        const messagesPayload = await fetchMessages(activeTicketId);
        if (messagesPayload) {
            supportUser = messagesPayload.support || supportUser;
            currentUserId = messagesPayload.current_user_id;
            activeTicketId = messagesPayload.ticket?.id || activeTicketId;
            activeTicketStatus = messagesPayload.ticket?.status || activeTicketStatus;
            renderMessages(messagesPayload.messages || [], messagesPayload.current_user_id);
            if (messageInput) messageInput.disabled = activeTicketStatus === 'resolved';
            if (btnSend) btnSend.disabled = activeTicketStatus === 'resolved';
        }

        initEcho();
    };

    if (btnUpload && fileInput) {
        btnUpload.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;
            const ok = await uploadDocument(file);
            if (ok) {
                alert('Документ отправлен. Ожидайте проверки.');
                const docs = await fetchDocs();
                renderDocs(docs);
            } else {
                alert('Не удалось отправить документ.');
            }
            fileInput.value = '';
        });
    }

    if (btnHelpToggle && helpPanel) {
        btnHelpToggle.addEventListener('click', () => {
            helpPanel.style.display = helpPanel.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (ticketsList) {
        ticketsList.addEventListener('click', async (event) => {
            const target = event.target.closest('[data-ticket]');
            if (!target) return;
            activeTicketId = Number(target.dataset.ticket);
            activeTicketStatus = target.dataset.status;
            const payload = await fetchMessages(activeTicketId);
            if (payload) {
                supportUser = payload.support || supportUser;
                currentUserId = payload.current_user_id;
                renderMessages(payload.messages || [], payload.current_user_id);
                if (messageInput) messageInput.disabled = activeTicketStatus === 'resolved';
                if (btnSend) btnSend.disabled = activeTicketStatus === 'resolved';
            }
        });
    }

    if (newTicketBtn) {
        newTicketBtn.addEventListener('click', () => {
            activeTicketId = null;
            activeTicketStatus = 'open';
            if (messageInput) messageInput.disabled = false;
            if (btnSend) btnSend.disabled = false;
            if (messagesBox) {
                messagesBox.innerHTML = '<div style="color:#9ca3af;">Новое обращение.</div>';
            }
        });
    }

    if (btnSend && messageInput) {
        let sending = false;
        btnSend.addEventListener('click', async () => {
            if (sending) return;
            const text = messageInput.value.trim();
            if (!text) return;
            if (activeTicketStatus === 'resolved') return;
            sending = true;
            btnSend.disabled = true;
            btnSend.textContent = 'Отправка...';
            const optimistic = {
                sender_id: currentUserId,
                recipient_id: supportUser?.id,
                support_ticket_id: activeTicketId || null,
                body: text,
                created_at: new Date().toISOString(),
            };
            appendMessage(optimistic);
            messageInput.value = '';
            const response = await sendMessage(text, activeTicketId);
            if (!response) {
                alert('Не удалось отправить сообщение.');
            } else if (!activeTicketId && response.ticket_id) {
                activeTicketId = response.ticket_id;
                const tickets = await fetchTickets();
                if (ticketsList) {
                    ticketsList.innerHTML = tickets.map((ticket) => {
                        const label = ticket.status === 'resolved' ? 'Решена' : 'Открыта';
                        return `
                            <button class="btn-secondary" style="text-align:left;" data-ticket="${ticket.id}" data-status="${ticket.status}">
                                <div style="font-weight:600;">#${ticket.id}</div>
                                <div style="font-size:11px; color:#93a3b8;">${label}</div>
                            </button>
                        `;
                    }).join('');
                }
            }
            btnSend.disabled = false;
            btnSend.textContent = 'Отправить';
            sending = false;
        });
        messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                btnSend.click();
            }
        });
    }

    init();
});
