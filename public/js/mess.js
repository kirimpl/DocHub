document.addEventListener('DOMContentLoaded', function () {
    // ============================================================
    // 1. ПЕРЕМЕННЫЕ И ЭЛЕМЕНТЫ
    // ============================================================

    // Элементы чата и навигации
    const chatsListContainer = document.getElementById('chatsListContainer');
    const emptyState = document.getElementById('emptyState');
    const chatView = document.getElementById('chatView');
    const contactsListEl = document.getElementById('contactsList');

    // Элементы Хедера чата
    const headerName = document.getElementById('chatHeaderName');
    const headerAvatar = document.getElementById('chatHeaderAvatar');
    const headerStatus = document.getElementById('chatHeaderStatus');

    // Элементы Модального окна (Создание ЧАТА)
    const modalChat = document.getElementById('createChatModal');

    // Элементы Модального окна (Создание ГРУППЫ)
    const modalGroup = document.getElementById('createGroupModal');
    const btnCreateGroup = document.getElementById('btnCreateGroup');
    const groupNameInput = document.getElementById('groupNameInput');
    const groupDescInput = document.getElementById('groupDescInput');
    const submitCreateGroup = document.getElementById('submitCreateGroup');
    const groupsListContainer = document.querySelector('.group-section .list-container');

    // Элементы отправки сообщений
    const messageInput = document.querySelector('.chat-input-area input');
    const sendBtn = document.querySelector('.chat-input-area button');
    const messagesContainer = document.querySelector('.chat-messages');

    // База данных пользователей
    const usersDatabase = [
        { id: 1, name: 'Александр Иванов', role: 'Врач', hospital: 'ГКБ №1', dept: 'Хирургия', initials: 'АИ', gender: 'male' },
        { id: 2, name: 'Мария Петрова', role: 'Врач', hospital: 'ЦКБ РАН', dept: 'Терапия', initials: 'МП', gender: 'female' },
        { id: 3, name: 'Дмитрий Сидоров', role: 'Кардиолог', hospital: 'ГКБ №1', dept: 'Кардиология', initials: 'ДС', gender: 'male' },
        { id: 4, name: 'Елена Васильева', role: 'Медсестра', hospital: 'ГКБ №1', dept: 'Терапия', initials: 'ЕВ', gender: 'female' },
        { id: 5, name: 'Сергей Волков', role: 'Главврач', hospital: 'ЦКБ РАН', dept: 'Администрация', initials: 'СВ', gender: 'male' },
    ];

    // ============================================================
    // 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================

    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // ============================================================
    // 3. ЛОГИКА ОТКРЫТИЯ И ВЫБОРА ЧАТА
    // ============================================================

    // Функция просто открывает данные в правом окне
    function openChatInterface(data) {
        emptyState.classList.add('hidden');
        chatView.classList.remove('hidden');

        // Заполняем хедер
        headerName.textContent = data.name;
        headerAvatar.textContent = data.initials;

        // Логика статуса
        if (headerStatus) {
            if (data.gender === 'group') {
                headerStatus.textContent = 'Участников: 1 (Вы)';
            } else {
                const minAgo = Math.floor(Math.random() * 59) + 1;
                const verb = (data.gender === 'female') ? 'Была' : 'Был';
                headerStatus.textContent = `${verb} онлайн: ${minAgo} минут назад`;
            }
        }
    }

    // Функция ДЕЛАЕТ элемент активным (визуально) и открывает чат
    function activateSidebarItem(element, data) {
        // 1. Убираем класс active у ВСЕХ элементов списка (и чатов, и групп)
        document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));

        // 2. Добавляем класс active ТОЛЬКО текущему нажатому элементу
        element.classList.add('active');

        // 3. Открываем данные справа
        openChatInterface(data);
    }

    // Функция СОЗДАЕТ новый элемент в списке (вызывается 1 раз при создании)
    function createSidebarItem(data, container, isGroup = false) {
        const newItem = document.createElement('div');
        newItem.className = 'list-item'; // Сразу без active, добавим позже

        const avatarColor = isGroup ? '#6EA8DB' : '#004080';

        newItem.innerHTML = `
            <div class="avatar-sq" style="background-color: ${avatarColor};">${data.initials}</div>
            <div class="item-info">
                <span class="name">${data.name}</span>
                <span class="desc">${data.desc || 'Нажмите, чтобы написать...'}</span>
            </div>
            ${!isGroup ? `<div class="item-meta"><span class="time">${getCurrentTime()}</span></div>` : ''}
        `;

        // Обработчик клика: НЕ создает новый, а просто АКТИВИРУЕТ этот
        newItem.addEventListener('click', function (e) {
            e.stopPropagation(); // Предотвращаем клики сквозь элементы
            activateSidebarItem(this, data);
        });

        // Добавляем в список и сразу активируем
        container.prepend(newItem);
        activateSidebarItem(newItem, data);
    }

    // ============================================================
    // 4. ЛОГИКА МОДАЛЬНОГО ОКНА (ПОИСК ЛЮДЕЙ)
    // ============================================================

    function renderContacts() {
        const search = document.getElementById('contactSearch').value.toLowerCase();
        // Фильтры (если есть в HTML)
        const hospEl = document.getElementById('filterHospital');
        const deptEl = document.getElementById('filterDept');
        const roleEl = document.getElementById('filterRole');

        const hosp = hospEl ? hospEl.value : '';
        const dept = deptEl ? deptEl.value : '';
        const role = roleEl ? roleEl.value : '';

        contactsListEl.innerHTML = '';

        const filtered = usersDatabase.filter(u => {
            return u.name.toLowerCase().includes(search) &&
                (hosp === '' || u.hospital === hosp) &&
                (dept === '' || u.dept === dept) &&
                (role === '' || u.role === role);
        });

        if (filtered.length === 0) {
            contactsListEl.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Ничего не найдено</div>';
            return;
        }

        filtered.forEach(user => {
            const el = document.createElement('div');
            el.className = 'contact-item';
            el.innerHTML = `
                <div class="avatar-sq" style="background:#D9EEFF; color:#0056B3;">${user.initials}</div>
                <div class="contact-info">
                    <h4>${user.name}</h4>
                    <p>${user.role} • ${user.dept}</p>
                </div>
            `;
            el.addEventListener('click', () => {
                createSidebarItem(user, chatsListContainer, false);
                modalChat.classList.remove('active');
            });
            contactsListEl.appendChild(el);
        });
    }

    // Слушатели для открытия модалки
    document.querySelectorAll('.trigger-modal').forEach(btn => {
        btn.addEventListener('click', () => { modalChat.classList.add('active'); renderContacts(); });
    });

    // Закрытие модалок
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.modal-overlay').classList.remove('active');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === modalChat) modalChat.classList.remove('active');
        if (e.target === modalGroup) modalGroup.classList.remove('active');
    });

    ['contactSearch', 'filterHospital', 'filterDept', 'filterRole'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', renderContacts);
    });

    // ============================================================
    // 5. ЛОГИКА СОЗДАНИЯ ГРУППЫ
    // ============================================================

    if (btnCreateGroup) {
        btnCreateGroup.addEventListener('click', () => {
            modalGroup.classList.add('active');
            if (groupNameInput) groupNameInput.focus();
        });
    }

    if (submitCreateGroup) {
        submitCreateGroup.addEventListener('click', () => {
            const name = groupNameInput.value.trim();
            const desc = groupDescInput.value.trim();

            if (name === '') return;

            const groupData = {
                name: name,
                desc: desc || 'Группа',
                initials: name.substring(0, 2).toUpperCase(),
                gender: 'group',
                role: 'Группа'
            };

            createSidebarItem(groupData, groupsListContainer, true);

            groupNameInput.value = '';
            groupDescInput.value = '';
            modalGroup.classList.remove('active');
        });
    }

    // ============================================================
    // 6. ОТПРАВКА СООБЩЕНИЙ
    // ============================================================

    function sendMessage() {
        const text = messageInput.value.trim();
        if (text === '') return;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'message-bubble sent';

        const time = getCurrentTime();
        msgDiv.innerHTML = `
            <div class="msg-text">${text}</div>
            <div class="msg-meta">
                ${time} <i class="fa-solid fa-check-double"></i>
            </div>
        `;

        messagesContainer.appendChild(msgDiv);
        messageInput.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (messageInput) {
        messageInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') sendMessage();
        });
    }


    const staticChat = document.querySelector('#chatsListContainer .list-item');
    if (staticChat) {
        staticChat.addEventListener('click', function (e) {
            e.stopPropagation();
            // Данные статического пользователя
            const staticUser = { name: 'Иван Иванов', initials: 'ИИ', gender: 'male', desc: 'Привет!' };
            // Просто активируем, НЕ создаем новый
            activateSidebarItem(this, staticUser);
        });
    }
});
// ============================================================
    // 8. ЛОГИКА МЕНЮ ЧАТА И ФУНКЦИОНАЛ КНОПОК
    // ============================================================

    const chatMenuBtn = document.getElementById('chatMenuBtn');
    const chatDropdown = document.getElementById('chatDropdown');
    
    // Кнопки меню
    const menuSearchBtn = document.getElementById('menuSearchBtn');
    const menuClearBtn = document.getElementById('menuClearBtn');
    const menuDeleteBtn = document.getElementById('menuDeleteBtn');
    
    // Элементы поиска
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    const closeSearchBtn = document.getElementById('closeSearchBtn');

    // --- 1. УПРАВЛЕНИЕ МЕНЮ (ОТКРЫТЬ/ЗАКРЫТЬ) ---
    if(chatMenuBtn) {
        chatMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chatDropdown.classList.toggle('hidden');
        });
    }

    window.addEventListener('click', () => {
        if(chatDropdown && !chatDropdown.classList.contains('hidden')) {
            chatDropdown.classList.add('hidden');
        }
    });

    // --- 2. ФУНКЦИЯ ПОИСКА ---
    if(menuSearchBtn) {
        menuSearchBtn.addEventListener('click', () => {
            // Показываем панель поиска
            searchBar.classList.remove('hidden');
            searchInput.focus();
            // Скрываем само меню
            chatDropdown.classList.add('hidden');
        });
    }

    // Логика фильтрации сообщений при вводе
    if(searchInput) {
        searchInput.addEventListener('input', function() {
            const filter = this.value.toLowerCase();
            const bubbles = document.querySelectorAll('.message-bubble');

            bubbles.forEach(bubble => {
                const text = bubble.querySelector('.msg-text').textContent.toLowerCase();
                // Если текст совпадает - показываем, иначе скрываем (display: none)
                if(text.includes(filter)) {
                    bubble.style.display = 'flex';
                } else {
                    bubble.style.display = 'none';
                }
            });
        });
    }

    // Закрытие поиска и сброс фильтра
    if(closeSearchBtn) {
        closeSearchBtn.addEventListener('click', () => {
            searchBar.classList.add('hidden');
            searchInput.value = '';
            // Возвращаем видимость всем сообщениям
            document.querySelectorAll('.message-bubble').forEach(b => b.style.display = 'flex');
        });
    }

    // --- 3. ФУНКЦИЯ ОЧИСТКИ ЧАТА ---
    if(menuClearBtn) {
        menuClearBtn.addEventListener('click', () => {
            if(confirm('Вы уверены, что хотите удалить все сообщения?')) {
                messagesContainer.innerHTML = ''; // Очищаем HTML
                
                // Добавляем системное сообщение
                const sysMsg = document.createElement('div');
                sysMsg.style.textAlign = 'center';
                sysMsg.style.fontSize = '12px';
                sysMsg.style.color = '#BDC9D6';
                sysMsg.style.marginTop = '20px';
                sysMsg.innerHTML = '<i class="fa-solid fa-eraser"></i> История очищена';
                
                messagesContainer.appendChild(sysMsg);
                chatDropdown.classList.add('hidden');
            }
        });
    }

    // --- 4. ФУНКЦИЯ УДАЛЕНИЯ ЧАТА ---
    if(menuDeleteBtn) {
        menuDeleteBtn.addEventListener('click', () => {
            if(confirm('Удалить этот чат навсегда?')) {
                // 1. Находим активный элемент в сайдбаре
                const activeItem = document.querySelector('.list-item.active');
                
                // 2. Удаляем его
                if(activeItem) {
                    activeItem.remove();
                }

                // 3. Скрываем окно чата и показываем пустой экран
                chatView.classList.add('hidden');
                emptyState.classList.remove('hidden');
                
                // Скрываем панель поиска, если она была открыта
                searchBar.classList.add('hidden');
                searchInput.value = '';
            }
        });
    }