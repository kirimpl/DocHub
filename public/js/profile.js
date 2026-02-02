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

    const renderInfo = (user) => {
        if (!infoGrid) return;
        infoGrid.innerHTML = `
    <div class="detail-item">
        <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id="mask0_city" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="22" height="21">
                <path d="M1 20H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 12H4C3.44772 12 3 12.4477 3 13V19C3 19.5523 3.44772 20 4 20H6C6.55228 20 7 19.5523 7 19V13C7 12.4477 6.55228 12 6 12Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                <path d="M5 16H5.5" stroke="black" stroke-width="2" stroke-linecap="square" stroke-linejoin="round"/>
                <path d="M18 1H8C7.44772 1 7 1.44772 7 2V19C7 19.5523 7.44772 20 8 20H18C18.5523 20 19 19.5523 19 19V2C19 1.44772 18.5523 1 18 1Z" fill="white" stroke="white" stroke-width="2" stroke-linejoin="round"/>
                <path d="M10 4H12V6H10V4ZM14 4H16V6H14V4ZM10 7.5H12V9.5H10V7.5ZM14 7.5H16V9.5H14V7.5ZM14 11H16V13H14V11ZM14 14.5H16V16.5H14V14.5Z" fill="black"/>
            </mask>
            <g mask="url(#mask0_city)">
                <path d="M-1 -1H23V23H-1V-1Z" fill="#0056A6"/>
            </g>
        </svg>
        <span>Город</span>
        <b>${user.city || '—'}</b>
    </div>

    <div class="detail-item">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11 3C10.2044 3 9.44129 3.31607 8.87868 3.87868C8.31607 4.44129 8 5.20435 8 6V7H5C4.20435 7 3.44129 7.31607 2.87868 7.87868C2.31607 8.44129 2 9.20435 2 10V18C2 18.7956 2.31607 19.5587 2.87868 20.1213C3.44129 20.6839 4.20435 21 5 21H19C19.7956 21 20.5587 20.6839 21.1213 20.1213C21.6839 19.5587 22 18.7956 22 18V10C22 9.20435 21.6839 8.44129 21.1213 7.87868C20.5587 7.31607 19.7956 7 19 7H16V6C16 5.20435 15.6839 4.44129 15.1213 3.87868C14.5587 3.31607 13.7956 3 13 3H11ZM14 7H10V6C10 5.73478 10.1054 5.48043 10.2929 5.29289C10.4804 5.10536 10.7348 5 11 5H13C13.2652 5 13.5196 5.10536 13.7071 5.29289C13.8946 5.48043 14 5.73478 14 6V7Z" fill="#0056A6"/>
        </svg>
        <span>Место работы</span>
        <b>${user.work_place || '—'}</b>
    </div>

    <div class="detail-item">
        <!-- Иконка Стаж -->
        <svg width="16" height="21" viewBox="0 0 16 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0H0V2L5.81 6.36C4.04674 6.94143 2.58648 8.19918 1.75016 9.8568C0.913849 11.5144 0.769916 13.4363 1.35 15.2C1.63699 16.0737 2.09342 16.8822 2.69318 17.5794C3.29294 18.2765 4.02426 18.8486 4.84531 19.2628C5.66635 19.677 6.56101 19.9253 7.47811 19.9935C8.39521 20.0616 9.31674 19.9483 10.19 19.66C11.5905 19.1997 12.8099 18.309 13.6744 17.1149C14.5388 15.9207 15.0043 14.4842 15.0043 13.01C15.0043 11.5358 14.5388 10.0993 13.6744 8.90514C12.8099 7.71103 11.5905 6.82032 10.19 6.36L16 2V0ZM10.94 17.5L8 15.78L5.06 17.5L5.84 14.17L3.25 11.93L6.66 11.64L8 8.5L9.34 11.64L12.75 11.93L10.16 14.17L10.94 17.5Z" fill="#0056A6"/>
        </svg>
        <span>Стаж</span>
        <b>${user.work_experience || 0} лет</b>
    </div>

    <div class="detail-item">
        <!-- Иконка Образование -->
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.835 8.50001L12 0.807007L0.165039 8.50001L12 16.192L20 10.992V16H22V9.69301L23.835 8.50001Z" fill="#0056A6"/>
            <path d="M5 17.5V13.835L12 18.385L19 13.835V17.5C19 18.97 17.986 20.115 16.747 20.838C15.483 21.576 13.802 22 12 22C10.198 22 8.518 21.576 7.253 20.838C6.014 20.115 5 18.97 5 17.5Z" fill="#0056A6"/>
        </svg>
        <span>Образование</span>
        <b>${user.education || '—'}</b>
    </div>

    <div class="section-title contacts-title">Контакты</div>
    <div class="underline-link"></div>

    <div class="detail-item">
    <svg width="24" height="24" viewBox="0 0 24 24">
        <path fill="currentColor"
            d="M4 20C3.45 20 2.97933 19.8043 2.588 19.413C2.19667 19.0217 2.00067 18.5507 2 18V6C2 5.45 2.196 4.97933 2.588 4.588C2.98 4.19667 3.45067 4.00067 4 4H20C20.55 4 21.021 4.196 21.413 4.588C21.805 4.98 22.0007 5.45067 22 6V18C22 18.55 21.8043 19.021 21.413 19.413C21.0217 19.805 20.5507 20.0007 20 20H4ZM12 13L20 8V6L12 11L4 6V8L12 13Z"/>
    </svg>
    <span>Почта</span>
    <b>${user.email || '—'}</b>
</div>

<div class="detail-item">
    <svg width="24" height="24" viewBox="0 0 24 24">
        <path fill="currentColor"
            d="M9.00411 3.41598C8.43211 2.60598 7.64011 2.24098 6.80011 2.24998C6.00311 2.25798 5.22711 2.59898 4.57911 3.05298C3.91817 3.5183 3.35459 4.10837 2.92011 4.78998C2.51011 5.43898 2.21411 6.20598 2.25411 6.95498C2.44711 10.558 4.47411 14.408 7.32111 17.257C10.1661 20.103 13.9651 22.081 17.8011 21.703C18.5531 21.629 19.2641 21.246 19.8451 20.758C20.446 20.249 20.937 19.6229 21.2881 18.918C21.6281 18.226 21.8311 17.428 21.7191 16.651C21.6031 15.841 21.1501 15.117 20.3171 14.637C19.3011 14.017 18.0521 13.399 16.5621 13.202C16.0111 13.278 15.4991 13.538 15.0561 14.004C14.7151 14.364 14.2131 14.476 13.5071 14.272C12.7891 14.064 11.9811 13.548 11.2791 12.85C10.5771 12.154 10.0461 11.34 9.81911 10.605C9.59511 9.87698 9.69411 9.34198 10.0441 8.97298C10.5171 8.47498 10.7691 7.92098 10.8221 7.33498C10.8741 6.76498 10.7321 6.22898 10.5291 5.76098C10.2251 5.06198 9.70911 4.36698 9.30511 3.82498L9.00411 3.41598Z"/>
    </svg>
    <span>Телефон</span>
    <b>${user.phone_number || '—'}</b>
</div>

`;

    };

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

    (async () => {
        const user = await fetchCurrentUser();
        renderHeader(user);
        renderInfo(user);
        const posts = await fetchMyPosts();
        renderPosts(user, posts);
    })();

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
