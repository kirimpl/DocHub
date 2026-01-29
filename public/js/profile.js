document.addEventListener('DOMContentLoaded', () => {
    const infoGrid = document.getElementById('userDataGrid');
    const postsList = document.getElementById('postsList');

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
        const avatarEl = document.getElementById('profileAvatar');

        const name = user.name || '????';
        const username = user.username || 'doctor';
        const sexLabel = user.sex === 'woman' ? 'Женщина' : 'Мужчина';
        let ageLabel = '???';
        if (user.birth_date) {
            const birth = new Date(user.birth_date);
            if (!Number.isNaN(birth.getTime())) {
                const today = new Date();
                let age = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                    age -= 1;
                }
                ageLabel = String(age);
            }
        }

        if (nameEl) nameEl.textContent = name;
        if (usernameEl) usernameEl.textContent = `@ ${username}`;
        if (sexAgeEl) sexAgeEl.textContent = `${sexLabel}, ${ageLabel} лет`;
        if (avatarEl && user.avatar) avatarEl.src = user.avatar;
    };

    const renderInfo = (user) => {
        if (!infoGrid) return;
        infoGrid.innerHTML = `
            <div class="details-grid">
                <div class="detail-item">
                    <i class="fa-solid fa-location-dot"></i> Город: <b>${user.city}</b>
                </div>
                <div class="detail-item">
                    <i class="fa-solid fa-briefcase"></i> Место работы: <b>${user.work_place}</b>
                </div>
                <div class="detail-item">
                    <i class="fa-solid fa-medal"></i> Стаж: <b>${user.work_experience} лет</b>
                </div>
                <div class="detail-item">
                    <i class="fa-solid fa-graduation-cap"></i> Образование: <b>${user.education}</b>
                </div>
                <div class="detail-item">
                    <i class="fa-solid fa-stethoscope"></i> Специализация: <b>${user.speciality}</b>
                </div>

                <hr style="border:0; border-top:1px solid #f0f4f8; margin: 15px 0;">
                <h3 style="color: #004080; font-size: 18px; margin-bottom: 15px;">Контакты</h3>

                <div class="detail-item">
                    <i class="fa-solid fa-envelope"></i> Почта: <b>${user.email}</b>
                </div>
                <div class="detail-item">
                    <i class="fa-solid fa-phone"></i> Телефон: <b>${user.phone_number}</b>
                </div>
            </div>
        `;
    };

    const renderPosts = (user, posts) => {
        if (!postsList) return;
        if (!posts || posts.length === 0) {
            postsList.innerHTML = '<p style="text-align: center; color: #8abceb; padding: 20px;">Постов пока нет</p>';
            return;
        }

        const name = user.name || 'Доктор';
        const initials = name.slice(0, 2).toUpperCase();

        postsList.innerHTML = posts.map((post) => {
            const time = formatTime(post.created_at);
            return `
                <div class="post-card-style" style="background: white; border-radius: 25px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.03); margin-bottom: 20px;">
                    <div style="background: #004080; height: 10px;"></div>
                    <div style="padding: 20px;">
                        <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                            <div style="background: #004080; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">${initials}</div>
                            <strong style="color: #333;">${name}${time ? ` • ${time}` : ''}</strong>
                        </div>
                        <p style="color: #000; font-size: 15px; line-height: 1.5;">${post.content || ''}</p>
                    </div>
                </div>
            `;
        }).join('');
    };

    const fetchCurrentUser = async () => {
        if (window.userData && window.userData.id) {
            return window.userData;
        }
        const token = getAuthToken();
        if (!token) return {};
        const response = await fetch(`/api/me`, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) return {};
        return response.json();
    };

    const fetchMyPosts = async () => {
        const token = getAuthToken();
        if (!token) return [];
        const response = await fetch(`/api/my-posts`, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) return [];
        return response.json();
    };

    (async () => {
        const user = await fetchCurrentUser();
        renderHeader(user || {});
        renderInfo(user || {});
        const posts = await fetchMyPosts();
        renderPosts(user || {}, posts || []);
    })();
});
