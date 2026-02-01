(() => {
    const grid = document.getElementById('meetingsGrid');
    const empty = document.getElementById('meetingsEmpty');
    const search = document.getElementById('meetingsSearch');

    const state = {
        meetings: [],
        joined: new Set(),
    };

    const api = async (path, options = {}) => {
        const token = localStorage.getItem('auth_token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        };
        const res = await fetch(`/api${path}`, { ...options, headers });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Request failed');
        }
        return res.json();
    };

    const formatDateTime = (value) => {
        if (!value) return 'Без времени';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'Без времени';
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const render = () => {
        if (!grid) return;
        const query = (search?.value || '').trim().toLowerCase();
        const items = state.meetings.filter((meeting) => {
            if (!query) return true;
            const title = (meeting.title || '').toLowerCase();
            const desc = (meeting.description || '').toLowerCase();
            const creator = (meeting.creator?.name || '').toLowerCase();
            return title.includes(query) || desc.includes(query) || creator.includes(query);
        });

        grid.innerHTML = items
            .map((meeting) => {
                const creatorName = meeting.creator?.name || 'Неизвестно';
                const creatorAvatar = meeting.creator?.avatar || '/images/avatar.png';
                const cityName = meeting.city || meeting.creator?.city || '—';
                const orgName = meeting.organization_name || '—';
                const joined = state.joined.has(meeting.id);
                const statusLabel = meeting.status === 'live' ? 'Сейчас идёт' : 'Запланировано';
                const statusClass = meeting.status === 'live' ? 'live' : 'scheduled';

                return `
                    <article class="meeting-card">
                        <div class="meeting-card-header">
                            <div class="meeting-title-group">
                                <span class="meeting-status ${statusClass}">${statusLabel}</span>
                                <h3>${meeting.title}</h3>
                                <p>${meeting.description || 'Описание отсутствует.'}</p>
                            </div>
                            <div class="meeting-creator">
                                <img src="${creatorAvatar}" alt="" />
                                <div>
                                    <span>Ведущий</span>
                                    <strong>${creatorName}</strong>
                                </div>
                            </div>
                        </div>
                        <div class="meeting-meta">
                            <div>
                                <span>Начало</span>
                                <strong>${formatDateTime(meeting.starts_at)}</strong>
                            </div>
                            <div>
                                <span>Окончание</span>
                                <strong>${formatDateTime(meeting.ends_at)}</strong>
                            </div>
                            <div>
                                <span>Отделение</span>
                                <strong>${meeting.department_name || '—'}</strong>
                            </div>
                            <div>
                                <span>Город</span>
                                <strong>${cityName}</strong>
                            </div>
                            <div>
                                <span>Организация</span>
                                <strong>${orgName}</strong>
                            </div>
                        </div>
                        <div class="meeting-actions">
                            <button class="meeting-join ${joined ? 'joined' : ''}" data-id="${meeting.id}">
                                ${joined ? 'Вы участник' : 'Присоединиться'}
                            </button>
                        </div>
                    </article>
                `;
            })
            .join('');

        if (empty) {
            empty.style.display = items.length ? 'none' : 'block';
        }
    };

    const loadMeetings = async () => {
        state.meetings = await api('/events/meetings');
        render();
    };

    grid?.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.classList.contains('meeting-join')) return;

        const id = target.dataset.id;
        if (!id) return;
        if (state.joined.has(Number(id))) return;

        try {
            await api(`/events/${id}/join`, { method: 'POST' });
            state.joined.add(Number(id));
            render();
        } catch (error) {
            console.error(error);
        }
    });

    search?.addEventListener('input', render);

    loadMeetings().catch(() => {});
})();
