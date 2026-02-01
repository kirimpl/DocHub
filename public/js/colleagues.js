document.addEventListener('DOMContentLoaded', () => {
    const requestsEl = document.getElementById('colleaguesRequests');
    const sentEl = document.getElementById('colleaguesSent');
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

    const normalizeRole = (user) => {
        const raw = (user?.speciality || user?.position || '').trim();
        if (!raw) return 'Хирург';
        const map = {
            Surgeon: 'Хирург',
            Therapist: 'Терапевт',
            Cardiologist: 'Кардиолог',
            Neurologist: 'Невролог',
        };
        return map[raw] || raw;
    };

    const cityIcon = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask id="mask0_413_471" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="1" y="1" width="22" height="21">
        <path d="M2 21H22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 13H5C4.44772 13 4 13.4477 4 14V20C4 20.5523 4.44772 21 5 21H7C7.55228 21 8 20.5523 8 20V14C8 13.4477 7.55228 13 7 13Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        <path d="M6 17H6.5" stroke="black" stroke-width="2" stroke-linecap="square" stroke-linejoin="round"/>
        <path d="M19 2H9C8.44772 2 8 2.44772 8 3V20C8 20.5523 8.44772 21 9 21H19C19.5523 21 20 20.5523 20 20V3C20 2.44772 19.5523 2 19 2Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/>
        <path d="M11 5H13V7H11V5ZM15 5H17V7H15V5ZM11 8.5H13V10.5H11V8.5ZM15 8.5H17V10.5H15V8.5ZM15 12H17V14H15V12ZM15 15.5H17V17.5H15V15.5Z" fill="black"/>
        </mask>
        <g mask="url(#mask0_413_471)">
        <path d="M0 0H24V24H0V0Z" fill="#0056A6"/>
        </g>
        </svg>
    `;

    const workIcon = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M11 3C10.2044 3 9.44129 3.31607 8.87868 3.87868C8.31607 4.44129 8 5.20435 8 6V7H5C4.20435 7 3.44129 7.31607 2.87868 7.87868C2.31607 8.44129 2 9.20435 2 10V18C2 18.7956 2.31607 19.5587 2.87868 20.1213C3.44129 20.6839 4.20435 21 5 21H19C19.7956 21 20.5587 20.6839 21.1213 20.1213C21.6839 19.5587 22 18.7956 22 18V10C22 9.20435 21.6839 8.44129 21.1213 7.87868C20.5587 7.31607 19.7956 7 19 7H16V6C16 5.20435 15.6839 4.44129 15.1213 3.87868C14.5587 3.31607 13.7956 3 13 3H11ZM14 7H10V6C10 5.73478 10.1054 5.48043 10.2929 5.29289C10.4804 5.10536 10.7348 5 11 5H13C13.2652 5 13.5196 5.10536 13.7071 5.29289C13.8946 5.48043 14 5.73478 14 6V7Z" fill="#0056A6"/>
        </svg>
    `;

    const chatIcon = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.953 2.25C9.636 2.25 7.835 2.25 6.433 2.4C5.015 2.553 3.892 2.87 2.996 3.586C2.076 4.322 1.646 5.279 1.443 6.486C1.25 7.638 1.25 9.104 1.25 10.932V11.115C1.25 12.897 1.25 14.13 1.45 15.049C1.558 15.544 1.728 15.974 1.995 16.372C2.259 16.764 2.595 17.094 2.996 17.414C3.627 17.919 4.371 18.224 5.25 18.414V21C5.25012 21.1314 5.28475 21.2605 5.35044 21.3743C5.41613 21.4881 5.51057 21.5826 5.62429 21.6484C5.73802 21.7143 5.86704 21.7491 5.99844 21.7493C6.12984 21.7496 6.259 21.7153 6.373 21.65C6.959 21.315 7.478 20.95 7.953 20.606L8.257 20.385C8.59525 20.1318 8.94073 19.8883 9.293 19.655C10.137 19.107 10.943 18.75 12 18.75H12.047C14.364 18.75 16.165 18.75 17.567 18.6C18.985 18.447 20.108 18.13 21.004 17.414C21.404 17.094 21.741 16.764 22.004 16.372C22.272 15.974 22.442 15.544 22.55 15.049C22.75 14.13 22.75 12.897 22.75 11.115V10.932C22.75 9.104 22.75 7.638 22.557 6.487C22.354 5.279 21.924 4.322 21.004 3.586C20.108 2.869 18.985 2.553 17.567 2.401C16.165 2.25 14.364 2.25 12.047 2.25H11.953Z" fill="#0056A6"/>
        </svg>
    `;

    const removeIcon = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.00039 7.1999C6.00039 5.92686 6.5061 4.70596 7.40628 3.80579C8.30645 2.90562 9.52735 2.3999 10.8004 2.3999C12.0734 2.3999 13.2943 2.90562 14.1945 3.80579C15.0947 4.70596 15.6004 5.92686 15.6004 7.1999C15.6004 8.47294 15.0947 9.69384 14.1945 10.594C13.2943 11.4942 12.0734 11.9999 10.8004 11.9999C9.52735 11.9999 8.30645 11.4942 7.40628 10.594C6.5061 9.69384 6.00039 8.47294 6.00039 7.1999ZM2.40039 15.5999C2.40039 14.2643 3.48399 13.1999 4.81119 13.1999H12.3088C11.3318 14.3813 10.7983 15.8669 10.8004 17.3999C10.8004 18.9635 11.344 20.3999 12.2524 21.5315C11.778 21.5771 11.294 21.5999 10.8004 21.5999C8.57439 21.5999 6.50079 21.1367 4.96239 20.1563C3.39999 19.1603 2.40039 17.6279 2.40039 15.5999ZM22.8004 17.3999C22.8004 18.8321 22.2315 20.2056 21.2188 21.2183C20.2061 22.231 18.8326 22.7999 17.4004 22.7999C15.9682 22.7999 14.5947 22.231 13.582 21.2183C12.5693 20.2056 12.0004 18.8321 12.0004 17.3999C12.0004 15.9677 12.5693 14.5942 13.582 13.5815C14.5947 12.5688 15.9682 11.9999 17.4004 11.9999C18.8326 11.9999 20.2061 12.5688 21.2188 13.5815C22.2315 14.5942 22.8004 15.9677 22.8004 17.3999ZM19.6252 16.0247C19.7379 15.912 19.8011 15.7592 19.8011 15.5999C19.8011 15.4406 19.7379 15.2878 19.6252 15.1751C19.5125 15.0624 19.3597 14.9991 19.2004 14.9991C19.0411 14.9991 18.8883 15.0624 18.7756 15.1751L17.4004 16.5515L16.0252 15.1751C15.9125 15.0624 15.7597 14.9991 15.6004 14.9991C15.4411 14.9991 15.2883 15.0624 15.1756 15.1751C15.0629 15.2878 14.9996 15.4406 14.9996 15.5999C14.9996 15.7592 15.0629 15.912 15.1756 16.0247L16.552 17.3999L15.1756 18.7751C15.1198 18.8309 15.0756 18.8971 15.0454 18.97C15.0152 19.0429 14.9996 19.121 14.9996 19.1999C14.9996 19.2788 15.0152 19.3569 15.0454 19.4298C15.0756 19.5027 15.1198 19.5689 15.1756 19.6247C15.2314 19.6805 15.2976 19.7247 15.3705 19.7549C15.4434 19.7851 15.5215 19.8007 15.6004 19.8007C15.6793 19.8007 15.7574 19.7851 15.8303 19.7549C15.9032 19.7247 15.9694 19.6805 19.6252 16.0247Z" fill="#FF3636"/>
        </svg>
    `;

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
                        <span>${normalizeRole(user)}</span>
                    </div>
                    <div class="colleague-actions">
                        <button class="accept" data-accept="${req.id}"><i class="fa-solid fa-check"></i></button>
                        <button class="decline" data-decline="${req.id}"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                <div class="colleague-info">
                    <div class="row"><span class="icon">${cityIcon}</span><span class="label">Город:</span><span class="value">${user?.city || '—'}</span></div>
                    <div class="row"><span class="icon">${workIcon}</span><span class="label">Место работы:</span><span class="value">${user?.work_place || user?.organization_name || '—'}</span></div>
                </div>
            `;
            requestsEl.appendChild(card);
        });
    };

    const renderSent = (requests = []) => {
        if (!sentEl) return;
        if (!requests.length) {
            renderEmpty(sentEl, 'Нет отправленных заявок');
            return;
        }
        sentEl.innerHTML = '';
        requests.forEach((req) => {
            const user = req.recipient;
            const card = document.createElement('div');
            card.className = 'colleague-card';
            card.innerHTML = `
                <div class="colleague-card-header">
                    <img class="colleague-avatar" src="${resolveAvatar(user?.avatar)}" alt="">
                    <div class="colleague-meta">
                        <h3>${fullName(user)}</h3>
                        <span>${normalizeRole(user)}</span>
                    </div>
                </div>
                <div class="colleague-info">
                    <div class="row"><span class="icon">${cityIcon}</span><span class="label">Город:</span><span class="value">${user?.city || '—'}</span></div>
                    <div class="row"><span class="icon">${workIcon}</span><span class="label">Место работы:</span><span class="value">${user?.work_place || user?.organization_name || '—'}</span></div>
                </div>
                <div class="colleague-actions">
                    <button class="decline" data-cancel="${req.id}"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;
            sentEl.appendChild(card);
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
                        <span>${normalizeRole(user)}</span>
                        <div class="colleague-divider"></div>
                    </div>
                </div>
                <div class="colleague-actions">
                    <button class="chat" data-chat="${user.id}">${chatIcon}</button>
                    <button class="remove" data-remove="${user.id}">${removeIcon}</button>
                </div>
            `;
            friendsEl.appendChild(card);
        });
    };

    const load = async () => {
        try {
            const [requests, friends, sent] = await Promise.all([
                api('/friends/requests'),
                api('/friends'),
                api('/friends/requests/sent'),
            ]);
            renderRequests(requests || []);
            renderSent(sent || []);
            renderFriends(friends || []);
        } catch (e) {
            renderEmpty(requestsEl, 'Не удалось загрузить заявки');
            renderEmpty(sentEl, 'Не удалось загрузить отправленные заявки');
            renderEmpty(friendsEl, 'Не удалось загрузить друзей');
        }
    };

    const acceptRequest = async (id) => {
        await api(`/friends/requests/${id}/accept`, { method: 'POST' });
    };

    const declineRequest = async (id) => {
        await api(`/friends/requests/${id}/decline`, { method: 'POST' });
    };

    const cancelRequest = async (id) => {
        await api(`/friends/requests/${id}/cancel`, { method: 'POST' });
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

    sentEl?.addEventListener('click', async (event) => {
        const cancelId = event.target.closest('[data-cancel]')?.dataset.cancel;
        if (!cancelId) return;
        await cancelRequest(cancelId);
        await load();
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