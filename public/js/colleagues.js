document.addEventListener('DOMContentLoaded', () => {
    const requestsEl = document.getElementById('colleaguesRequests');
    const friendsEl = document.getElementById('colleaguesFriends');
    const acceptAllBtn = document.getElementById('acceptAllBtn');
    const declineAllBtn = document.getElementById('declineAllBtn');

    const API_URL = '/api';
    const token = localStorage.getItem('auth_token');

    const api = async (path, options = {}) => {
        const res = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}),
            },
        });
        if (!res.ok) throw new Error('Request failed');
        return res.json();
    };

    const resolveAvatar = (avatar) => avatar || '/images/avatar.png';

    const fullName = (user) => {
        if (!user) return '—';
        const name = `${user.name || ''} ${user.last_name || ''}`.trim();
        return name || 'Пользователь';
    };

    const renderEmpty = (el, text) => {
        el.innerHTML = `<div class="colleagues-empty">${text}</div>`;
    };

    const renderRequests = (requests = []) => {
        if (!requests.length) {
            renderEmpty(requestsEl, 'Нет новых заявок');
            return;
        }
        requestsEl.innerHTML = '';
        requests.forEach((req) => {
            const user = req.requester;
            const card = document.createElement('div');
            card.className = 'colleague-card';
            card.innerHTML = `
                <div class="colleague-card-header">
                    <img class="colleague-avatar" src="${resolveAvatar(user?.avatar)}" alt="">
                    <div class="colleague-meta">
                        <h3>${fullName(user)}</h3>
                        <span>${user?.speciality || user?.position || 'Терапевт'}</span>
                    </div>
                    <div class="colleague-actions">
                        <button class="accept" data-accept="${req.id}"><i class="fa-solid fa-check"></i></button>
                        <button class="decline" data-decline="${req.id}"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                <div class="colleague-info">
                    <div class="row"><i class="fa-solid fa-city"></i>Город: ${user?.city || '—'}</div>
                    <div class="row"><i class="fa-solid fa-hospital"></i>Место работы: ${user?.work_place || user?.organization_name || '—'}</div>
                </div>
            `;
            requestsEl.appendChild(card);
        });
    };

    const renderFriends = (friends = []) => {
        if (!friends.length) {
            renderEmpty(friendsEl, 'Пока нет друзей');
            return;
        }
        friendsEl.innerHTML = '';
        friends.forEach((user) => {
            const card = document.createElement('div');
            card.className = 'colleague-card';
            card.innerHTML = `
                <div class="colleague-card-header">
                    <img class="colleague-avatar" src="${resolveAvatar(user.avatar)}" alt="">
                    <div class="colleague-meta">
                        <h3>${fullName(user)}</h3>
                        <span>${user?.speciality || user?.position || 'Хирург'}</span>
                    </div>
                </div>
                <div class="colleague-actions" style="justify-content:flex-start;">
                    <button class="chat" data-chat="${user.id}"><i class="fa-solid fa-comment-dots"></i></button>
                    <button class="remove" data-remove="${user.id}"><i class="fa-solid fa-user-xmark"></i></button>
                </div>
            `;
            friendsEl.appendChild(card);
        });
    };

    const load = async () => {
        try {
            const [requests, friends] = await Promise.all([
                api('/friends/requests'),
                api('/friends'),
            ]);
            renderRequests(requests || []);
            renderFriends(friends || []);
        } catch (e) {
            renderEmpty(requestsEl, 'Не удалось загрузить заявки');
            renderEmpty(friendsEl, 'Не удалось загрузить друзей');
        }
    };

    const acceptRequest = async (id) => {
        await api(`/friends/requests/${id}/accept`, { method: 'POST' });
    };

    const declineRequest = async (id) => {
        await api(`/friends/requests/${id}/decline`, { method: 'POST' });
    };

    const removeFriend = async (id) => {
        await api(`/friends/${id}`, { method: 'DELETE' });
    };

    requestsEl?.addEventListener('click', async (event) => {
        const acceptId = event.target.closest('[data-accept]')?.dataset.accept;
        const declineId = event.target.closest('[data-decline]')?.dataset.decline;
        if (acceptId) {
            await acceptRequest(acceptId);
            await load();
        }
        if (declineId) {
            await declineRequest(declineId);
            await load();
        }
    });

    friendsEl?.addEventListener('click', async (event) => {
        const chatId = event.target.closest('[data-chat]')?.dataset.chat;
        const removeId = event.target.closest('[data-remove]')?.dataset.remove;
        if (chatId) {
            window.location.href = `/messenger?user=${chatId}`;
        }
        if (removeId) {
            await removeFriend(removeId);
            await load();
        }
    });

    acceptAllBtn?.addEventListener('click', async () => {
        const requests = await api('/friends/requests');
        await Promise.all((requests || []).map((req) => acceptRequest(req.id)));
        await load();
    });

    declineAllBtn?.addEventListener('click', async () => {
        const requests = await api('/friends/requests');
        await Promise.all((requests || []).map((req) => declineRequest(req.id)));
        await load();
    });

    load();
});
