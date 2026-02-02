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

    const renderHeader = (user) => {
        const nameEl = document.getElementById('profileName');
        const sexAgeEl = document.getElementById('profileSexAge');
        const usernameEl = document.getElementById('profileUsername');
        const verifiedBadge = document.getElementById('verifiedBadge');

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
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                ageLabel = age;
            }
        }

        if (nameEl) nameEl.textContent = name;
        if (usernameEl) usernameEl.textContent = `@${username}`;
        if (sexAgeEl) sexAgeEl.textContent = `${sexLabel}, ${ageLabel} лет`;

        if (verifiedBadge) {
            verifiedBadge.style.display = user.is_verified ? 'inline-flex' : 'none';
        }

        if (avatarImg && user.avatar) {
            avatarImg.src = `${user.avatar}?t=${Date.now()}`;
        }

        if (coverDiv && user.cover_image) {
            coverDiv.style.backgroundImage = `url('${user.cover_image}?t=${Date.now()}')`;
        }
    };

    const renderInfo = (user) => {
        if (!infoGrid) return;

        infoGrid.innerHTML = `
            <div class="detail-item">
                <span>Город</span>
                <b>${user.city || '—'}</b>
            </div>

            <div class="detail-item">
                <span>Место работы</span>
                <b>${user.work_place || '—'}</b>
            </div>

            <div class="detail-item">
                <span>Стаж</span>
                <b>${user.work_experience || 0} лет</b>
            </div>

            <div class="detail-item">
                <span>Образование</span>
                <b>${user.education || '—'}</b>
            </div>

            <div class="section-title contacts-title">Контакты</div>
            <div class="underline-link"></div>

            <div class="detail-item">
                <span>Почта</span>
                <b>${user.email || '—'}</b>
            </div>

            <div class="detail-item">
                <span>Телефон</span>
                <b>${user.phone_number || '—'}</b>
            </div>
        `;
    };

    const renderPosts = (user, posts) => {
        if (!postsList) return;

        if (!posts.length) {
            postsList.innerHTML = '<p style="text-align:center;padding:20px">Постов пока нет</p>';
            return;
        }

        const initials = (user.name || 'Доктор').slice(0, 2).toUpperCase();

        postsList.innerHTML = posts.map(post => {
            const time = formatTime(post.created_at);
            return `
                <div class="post-card-style">
                    <div style="padding:20px">
                        <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">
                            <div style="background:var(--accent);color:#fff;padding:2px 6px;border-radius:4px;font-size:10px">
                                ${initials}
                            </div>
                            <strong>${user.name || 'Доктор'}${time ? ` • ${time}` : ''}</strong>
                        </div>
                        <p>${post.content || ''}</p>
                    </div>
                </div>
            `;
        }).join('');
    };

    const fetchCurrentUser = async () => {
        const token = getAuthToken();
        if (!token) return {};
        const res = await fetch('/api/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.ok ? res.json() : {};
    };

    const fetchMyPosts = async () => {
        const token = getAuthToken();
        if (!token) return [];
        const res = await fetch('/api/my-posts', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.ok ? res.json() : [];
    };

    (async () => {
        const user = await fetchCurrentUser();
        renderHeader(user);
        renderInfo(user);

        const posts = await fetchMyPosts();
        renderPosts(user, posts);
    })();

    if (avatarImg && avatarInput) {
        avatarImg.onclick = () => avatarInput.click();
        avatarInput.onchange = async () => {
            const file = avatarInput.files[0];
            if (!file) return;

            const form = new FormData();
            form.append('avatar', file);

            const token = getAuthToken();
            const res = await fetch('/api/profile/avatar', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form
            });

            if (res.ok) {
                const data = await res.json();
                avatarImg.src = `${data.avatar}?t=${Date.now()}`;
            }
        };
    }

    if (coverDiv && coverInput) {
        coverDiv.onclick = () => coverInput.click();
        coverInput.onchange = async () => {
            const file = coverInput.files[0];
            if (!file) return;

            const form = new FormData();
            form.append('cover', file);

            const token = getAuthToken();
            const res = await fetch('/api/profile/cover', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form
            });

            if (res.ok) {
                const data = await res.json();
                coverDiv.style.backgroundImage =
                    `url('${data.cover_image}?t=${Date.now()}')`;
            }
        };
    }
});
