document.addEventListener('DOMContentLoaded', () => {
    const infoGrid = document.getElementById('userDataGrid');
    const postsList = document.getElementById('postsList');
    const avatarImg = document.getElementById('profileAvatar');
    const avatarInput = document.getElementById('avatarInput');
    const coverDiv = document.getElementById('profileCover');
    const coverInput = document.getElementById('coverInput');

    const getAuthToken = () => localStorage.getItem('auth_token');

    const formatTime = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Отображение заголовка профиля
    const renderHeader = (user) => {
        const nameEl = document.getElementById('profileName');
        const sexAgeEl = document.getElementById('profileSexAge');
        const usernameEl = document.getElementById('profileUsername');

        const name = user.name || 'Гость';
        const username = user.username || 'doctor';
        const sexLabel = user.sex === 'woman' ? 'Женщина' : 'Мужчина';
        let ageLabel = '???';
        if (user.birth_date) {
            const birth = new Date(user.birth_date);
            if (!Number.isNaN(birth.getTime())) {
                const today = new Date();
                let age = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
                ageLabel = String(age);
            }
        }

        if (nameEl) nameEl.textContent = name;
        if (usernameEl) usernameEl.textContent = `@${username}`;
        if (sexAgeEl) sexAgeEl.textContent = `${sexLabel}, ${ageLabel} лет`;
        if (avatarImg && user.avatar) avatarImg.src = user.avatar + '?t=' + Date.now();
        if (coverDiv && user.cover_image) coverDiv.style.backgroundImage = `url('${user.cover_image}?t=${Date.now()}')`;
    };

    // Отображение информации о пользователе
    const renderInfo = (user) => {
        if (!infoGrid) return;
        infoGrid.innerHTML = `
            <div class="detail-item"><i class="fa-solid fa-location-dot"></i><span>Город</span><b>${user.city || '—'}</b></div>
            <div class="detail-item"><i class="fa-solid fa-briefcase"></i><span>Место работы</span><b>${user.work_place || '—'}</b></div>
            <div class="detail-item"><i class="fa-solid fa-medal"></i><span>Стаж</span><b>${user.work_experience || 0} лет</b></div>
            <div class="detail-item"><i class="fa-solid fa-graduation-cap"></i><span>Образование</span><b>${user.education || '—'}</b></div>
            <div class="detail-item"><i class="fa-solid fa-stethoscope"></i><span>Специализация</span><b>${user.speciality || '—'}</b></div>
            <div class="section-title contacts-title">Контакты</div>
            <div class="underline-link"></div>
            <div class="detail-item"><i class="fa-solid fa-envelope"></i><span>Почта</span><b>${user.email || '—'}</b></div>
            <div class="detail-item"><i class="fa-solid fa-phone"></i><span>Телефон</span><b>${user.phone_number || '—'}</b></div>
        `;
    };

    // Отображение постов
    const renderPosts = (user, posts) => {
        if (!postsList) return;
        if (!posts || posts.length === 0) {
            postsList.innerHTML = '<p style="text-align: center; color: var(--text-title); padding: 20px;">Постов пока нет</p>';
            return;
        }
        const initials = (user.name || 'Доктор').slice(0, 2).toUpperCase();
        postsList.innerHTML = posts.map(post => {
            const time = formatTime(post.created_at);
            return `
                <div class="post-card-style">
                    <div></div>
                    <div style="padding: 20px;">
                        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                            <div style="background: var(--accent); color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">${initials}</div>
                            <strong class="author">${user.name || 'Доктор'}${time ? ` • ${time}` : ''}</strong>
                        </div>
                        <p>${post.content || ''}</p>
                    </div>
                </div>
            `;
        }).join('');
    };

    // Получаем данные пользователя через обычный запрос
    const fetchCurrentUser = async () => {
        const token = getAuthToken();
        if (!token) return {};
        const res = await fetch('/api/me', {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`
            }
        });
        return res.ok ? res.json() : {};
    };

    // Получаем посты пользователя через обычный запрос
    const fetchMyPosts = async () => {
        const token = getAuthToken();
        if (!token) return [];
        const res = await fetch('/api/my-posts', {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`
            }
        });
        return res.ok ? res.json() : [];
    };

    // Инициализация страницы
    (async () => {
        const user = await fetchCurrentUser();
        renderHeader(user);
        renderInfo(user);
        const posts = await fetchMyPosts();
        renderPosts(user, posts);
    })();

    // Обновление аватарки
    if (avatarImg && avatarInput) {
        avatarImg.addEventListener('click', () => avatarInput.click());
        avatarInput.addEventListener('change', async () => {
            const file = avatarInput.files[0];
            if (!file) return;
            const token = getAuthToken();
            if (!token) return alert('Нет авторизации');

            const formData = new FormData();
            formData.append('avatar', file);

            const res = await fetch('/api/profile/avatar', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: formData
            });

            if (!res.ok) return alert('Ошибка загрузки аватарки');
            const data = await res.json();
            avatarImg.src = data.avatar + '?t=' + Date.now();
        });
    }

    // Обновление обложки
    if (coverDiv && coverInput) {
        coverDiv.addEventListener('click', () => coverInput.click());
        coverInput.addEventListener('change', async () => {
            const file = coverInput.files[0];
            if (!file) return;
            const token = getAuthToken();
            if (!token) return alert('Нет авторизации');

            const formData = new FormData();
            formData.append('cover', file);

            const res = await fetch('/api/profile/cover', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                body: formData
            });

            if (!res.ok) return alert('Ошибка загрузки обложки');
            const data = await res.json();
            coverDiv.style.backgroundImage = `url('${data.cover_image}?t=${Date.now()}')`;
        });
    }
});
