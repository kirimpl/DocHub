(() => {
    const queryLabel = document.getElementById('searchQueryLabel');
    const metaLabel = document.getElementById('searchMeta');
    const postsContainer = document.getElementById('searchPosts');
    const usersContainer = document.getElementById('searchUsers');
    const lecturesContainer = document.getElementById('searchLectures');
    const tabs = document.querySelectorAll('.search-tab');
    const sections = document.querySelectorAll('.search-section');

    const token = localStorage.getItem('auth_token');

    const setActiveTab = (tabName) => {
        tabs.forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        sections.forEach((section) => {
            section.classList.toggle('active', section.dataset.section === tabName);
        });
    };

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            setActiveTab(tab.dataset.tab);
        });
    });

    const createEmpty = (message) => {
        const empty = document.createElement('div');
        empty.className = 'search-empty';
        empty.textContent = message;
        return empty;
    };

    const formatDate = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const renderPosts = (posts) => {
        postsContainer.innerHTML = '';
        if (!posts.length) {
            postsContainer.appendChild(createEmpty('Постов по запросу не найдено.'));
            return;
        }
        posts.forEach((post) => {
            const card = document.createElement('div');
            card.className = 'search-post-card';
            const author = post.user || {};
            const avatar = author.avatar || '/images/avatar.png';
            card.innerHTML = `
                <div class="search-post-header">
                    <img class="search-avatar" src="${avatar}" alt="">
                    <div>
                        <div class="search-name">${author.name || 'Пользователь'}</div>
                        <div class="search-meta">${formatDate(post.created_at)}</div>
                    </div>
                </div>
                <div class="search-post-content">${post.content || ''}</div>
            `;
            postsContainer.appendChild(card);
        });
    };

    const renderUsers = (users) => {
        usersContainer.innerHTML = '';
        if (!users.length) {
            usersContainer.appendChild(createEmpty('Пользователей по запросу не найдено.'));
            return;
        }
        users.forEach((user) => {
            const card = document.createElement('div');
            card.className = 'search-user-card';
            const avatar = user.avatar || '/images/avatar.png';
            const name = [user.name, user.last_name].filter(Boolean).join(' ');
            card.innerHTML = `
                <div class="search-user-header">
                    <img class="search-avatar" src="${avatar}" alt="">
                    <div>
                        <div class="search-name">${name || 'Пользователь'}</div>
                        <div class="search-user-details">${user.work_place || ''}</div>
                    </div>
                </div>
                <div class="search-actions">
                    <a class="search-btn" href="/profile?user=${user.id}">Открыть профиль</a>
                </div>
            `;
            usersContainer.appendChild(card);
        });
    };

    const renderLectures = (lectures) => {
        lecturesContainer.innerHTML = '';
        if (!lectures.length) {
            lecturesContainer.appendChild(createEmpty('Лекций по запросу не найдено.'));
            return;
        }
        lectures.forEach((lecture) => {
            const card = document.createElement('div');
            card.className = 'search-lecture-card';
            const creator = lecture.creator || {};
            const avatar = creator.avatar || '/images/avatar.png';
            card.innerHTML = `
                <div class="search-lecture-header">
                    <img class="search-avatar" src="${avatar}" alt="">
                    <div>
                        <div class="search-name">${lecture.title || 'Лекция'}</div>
                        <div class="search-lecture-details">Ведущий: ${creator.name || '—'}</div>
                    </div>
                </div>
                <div class="search-post-content">${lecture.description || ''}</div>
                <div class="search-actions">
                    <a class="search-btn" href="/lecture/${lecture.id}">Открыть лекцию</a>
                </div>
            `;
            lecturesContainer.appendChild(card);
        });
    };

    const loadResults = async () => {
        const params = new URLSearchParams(window.location.search);
        const query = (params.get('q') || '').trim();
        if (!query) {
            queryLabel.textContent = '—';
            metaLabel.textContent = 'Введите запрос в поиск.';
            renderPosts([]);
            renderUsers([]);
            renderLectures([]);
            return;
        }

        queryLabel.textContent = query;
        metaLabel.textContent = 'Ищем совпадения...';

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!response.ok) {
                throw new Error('Search request failed');
            }
            const data = await response.json();
            const posts = data.posts || [];
            const users = data.users || [];
            const lectures = data.lectures || [];

            metaLabel.textContent = `Найдено: постов ${posts.length}, пользователей ${users.length}, лекций ${lectures.length}`;
            renderPosts(posts);
            renderUsers(users);
            renderLectures(lectures);
        } catch (error) {
            metaLabel.textContent = 'Не удалось загрузить результаты поиска.';
            renderPosts([]);
            renderUsers([]);
            renderLectures([]);
        }
    };

    loadResults();
})();
