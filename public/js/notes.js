(() => {
    const grid = document.getElementById('notesGrid');
    const titleInput = document.getElementById('noteTitle');
    const bodyInput = document.getElementById('noteBody');
    const createBtn = document.getElementById('createNoteBtn');
    const pinBtn = document.getElementById('pinNoteBtn');
    const searchInput = document.getElementById('notesSearch');
    const colorDots = document.querySelectorAll('.color-dot');

    const state = {
        notes: [],
        color: '#FFFFFF',
        isPinned: false,
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

    const render = () => {
        if (!grid) return;
        const query = (searchInput?.value || '').toLowerCase();
        const items = state.notes.filter((note) => {
            const title = (note.title || '').toLowerCase();
            const body = (note.body || '').toLowerCase();
            return title.includes(query) || body.includes(query);
        });

        grid.innerHTML = items
            .map((note) => {
                const safeTitle = note.title ? note.title : 'Без названия';
                const safeBody = note.body ? note.body : '';
                return `
                    <div class="note-card ${note.is_pinned ? 'pinned' : ''}" style="background:${note.color || '#FFFFFF'}">
                        <h4>${safeTitle}</h4>
                        <p>${safeBody}</p>
                        <div class="note-card-actions">
                            <button data-action="toggle-pin" data-id="${note.id}">
                                ${note.is_pinned ? 'Открепить' : 'Закрепить'}
                            </button>
                            <button data-action="delete" data-id="${note.id}">Удалить</button>
                        </div>
                    </div>
                `;
            })
            .join('');
    };

    const loadNotes = async () => {
        state.notes = await api('/notes');
        render();
    };

    const resetForm = () => {
        if (titleInput) titleInput.value = '';
        if (bodyInput) bodyInput.value = '';
        state.isPinned = false;
        pinBtn?.classList.remove('active');
        colorDots.forEach((dot) => dot.classList.remove('active'));
        state.color = '#FFFFFF';
    };

    createBtn?.addEventListener('click', async () => {
        const payload = {
            title: titleInput?.value || null,
            body: bodyInput?.value || null,
            color: state.color,
            is_pinned: state.isPinned,
        };
        await api('/notes', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        resetForm();
        await loadNotes();
    });

    pinBtn?.addEventListener('click', () => {
        state.isPinned = !state.isPinned;
        pinBtn.classList.toggle('active', state.isPinned);
        pinBtn.textContent = state.isPinned ? 'Закреплено' : 'Закрепить';
    });

    colorDots.forEach((dot) => {
        dot.addEventListener('click', () => {
            colorDots.forEach((d) => d.classList.remove('active'));
            dot.classList.add('active');
            state.color = dot.dataset.color || '#FFFFFF';
        });
    });

    grid?.addEventListener('click', async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.dataset.action;
        const id = target.dataset.id;
        if (!action || !id) return;

        if (action === 'delete') {
            await api(`/notes/${id}`, { method: 'DELETE' });
            await loadNotes();
        }

        if (action === 'toggle-pin') {
            const note = state.notes.find((n) => String(n.id) === String(id));
            if (!note) return;
            await api(`/notes/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_pinned: !note.is_pinned }),
            });
            await loadNotes();
        }
    });

    searchInput?.addEventListener('input', render);

    loadNotes().catch(() => {});
})();
