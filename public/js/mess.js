document.addEventListener('DOMContentLoaded', function () {
    
    // 1. ПЕРЕМЕННЫЕ И ЭЛЕМЕНТЫ
    const chatsListContainer = document.getElementById('chatsListContainer');
    const groupsListContainer = document.getElementById('groupsListContainer');
    const emptyState = document.getElementById('emptyState');
    const chatView = document.getElementById('chatView');
    const contactsListEl = document.getElementById('contactsList');
    const messagesContainer = document.querySelector('.chat-messages');

    const headerName = document.getElementById('chatHeaderName');
    const headerAvatar = document.getElementById('chatHeaderAvatar');
    const headerStatus = document.getElementById('chatHeaderStatus');

    const modalChat = document.getElementById('createChatModal');
    const modalGroup = document.getElementById('createGroupModal');

    const btnCreateGroup = document.getElementById('btnCreateGroup');
    const groupNameInput = document.getElementById('groupNameInput');
    const groupDescInput = document.getElementById('groupDescInput');
    const submitCreateGroup = document.getElementById('submitCreateGroup');

    const messageInput = document.getElementById('messageInput');
    const micBtn = document.getElementById('micBtn');
    const sendBtn = document.getElementById('sendBtn');
    const attachBtn = document.getElementById('attachBtn');
    const hiddenFileInput = document.getElementById('hiddenFileInput');

    const emojiBtn = document.getElementById('emojiBtn');
    const emojiWrapper = document.getElementById('emojiWrapper');

    const chatMenuBtn = document.getElementById('chatMenuBtn');
    const chatDropdown = document.getElementById('chatDropdown');
    const menuClearBtn = document.getElementById('menuClearBtn');
    const menuDeleteBtn = document.getElementById('menuDeleteBtn');

    const menuSearchBtn = document.getElementById('menuSearchBtn');
    const btnHeaderSearch = document.getElementById('btnHeaderSearch');
    const btnHeaderAudio = document.getElementById('btnHeaderAudio');
    const btnHeaderVideo = document.getElementById('btnHeaderVideo');

    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    const closeSearchBtn = document.getElementById('closeSearchBtn');

    const usersDatabase = [
        { id: 1, name: 'Александр Иванов', role: 'Врач', hospital: 'ГКБ №1', dept: 'Хирургия', initials: 'АИ', gender: 'male' },
        { id: 2, name: 'Мария Петрова', role: 'Врач', hospital: 'ЦКБ РАН', dept: 'Терапия', initials: 'МП', gender: 'female' },
        { id: 3, name: 'Дмитрий Сидоров', role: 'Кардиолог', hospital: 'ГКБ №1', dept: 'Кардиология', initials: 'ДС', gender: 'male' },
        { id: 4, name: 'Елена Васильева', role: 'Медсестра', hospital: 'ГКБ №1', dept: 'Терапия', initials: 'ЕВ', gender: 'female' },
    ];

    const chatsData = {};
    let currentActiveChatId = null;

    // 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ОТРИСОВКИ
    function renderMessage(content, time, type, contentType = 'text') {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message-bubble ${type}`;
        const checkIcon = type === 'sent' ? '<i class="fa-solid fa-check-double"></i>' : '';

        let innerHTML = '';

        if (contentType === 'image') {
            innerHTML = `<img src="${content}" class="msg-image" alt="image">`;
        } 
        else if (contentType === 'file') {
            innerHTML = `
                <div class="msg-file">
                    <i class="fa-solid fa-file-lines msg-file-icon"></i>
                    <div>
                        <div class="msg-file-name">${content.name}</div>
                        <div style="font-size:10px; opacity:0.7;">${content.size}</div>
                    </div>
                </div>
            `;
        } 
        else if (contentType === 'audio') {
            // АУДИО ПЛЕЕР
            innerHTML = `<audio controls src="${content}" class="msg-audio"></audio>`;
        } 
        else {
            innerHTML = `<div class="msg-text">${content}</div>`;
        }

        msgDiv.innerHTML = `
            ${innerHTML}
            <div class="msg-meta">${time} ${checkIcon}</div>
        `;

        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // ОТКРЫТИЕ ЧАТА
    function openChatInterface(data, uniqueId) {
        emptyState.classList.add('hidden');
        chatView.classList.remove('hidden');
        if (searchBar) searchBar.classList.add('hidden');

        currentActiveChatId = uniqueId;
        headerName.textContent = data.name;
        headerAvatar.textContent = data.initials;

        messagesContainer.innerHTML = '';
        if (chatsData[uniqueId]) {
            chatsData[uniqueId].forEach(msg => {
                renderMessage(msg.content, msg.time, msg.type, msg.contentType || 'text');
            });
        }

        if (messageInput) {
            messageInput.value = '';
            toggleInputButtons();
        }
    }

    function createSidebarItem(data, container, isGroup = false) {
        const uniqueId = isGroup ? `group_${data.id}` : `user_${data.id}`;
        const newItem = document.createElement('div');
        newItem.className = 'list-item';
        const color = isGroup ? '#6EA8DB' : '#004080';

        newItem.innerHTML = `
            <div class="avatar-sq" style="background-color: ${color};">${data.initials}</div>
            <div class="item-info">
                <span class="name">${data.name}</span>
                <span class="desc">${data.desc || (isGroup ? 'Группа' : 'Личный чат')}</span>
            </div>
        `;

        newItem.addEventListener('click', function (e) {
            e.stopPropagation();
            document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
            newItem.classList.add('active');
            openChatInterface(data, uniqueId);
        });

        container.prepend(newItem);
    }

    // 3. ЛОГИКА ВВОДА И ОТПРАВКИ
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    function toggleInputButtons() {
        const text = messageInput.value.trim();
        if (text.length > 0) {
            if (sendBtn.classList.contains('hidden')) {
                sendBtn.classList.remove('hidden');
                sendBtn.classList.add('visible');
            }
        } else {
            sendBtn.classList.remove('visible');
            sendBtn.classList.add('hidden');
        }
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        if (text === '' || !currentActiveChatId) return;

        const time = getCurrentTime();
        renderMessage(text, time, 'sent', 'text');
        
        if (!chatsData[currentActiveChatId]) chatsData[currentActiveChatId] = [];
        chatsData[currentActiveChatId].push({ content: text, time, type: 'sent', contentType: 'text' });

        messageInput.value = '';
        toggleInputButtons();
    }

    // ОТПРАВКА ФАЙЛОВ
    if (attachBtn && hiddenFileInput) {
        attachBtn.addEventListener('click', () => hiddenFileInput.click());

        hiddenFileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                const file = this.files[0];
                const time = getCurrentTime();

                if (!currentActiveChatId) {
                    alert('Сначала выберите чат!');
                    this.value = '';
                    return;
                }
                if (file.size > MAX_FILE_SIZE) {
                    alert('Файл слишком большой! Максимальный размер: 5 МБ');
                    this.value = '';
                    return;
                }

                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const imgData = e.target.result;
                        renderMessage(imgData, time, 'sent', 'image');
                        if (!chatsData[currentActiveChatId]) chatsData[currentActiveChatId] = [];
                        chatsData[currentActiveChatId].push({ content: imgData, time, type: 'sent', contentType: 'image' });
                    }
                    reader.readAsDataURL(file);
                } else {
                    const fileData = { name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' };
                    renderMessage(fileData, time, 'sent', 'file');
                    if (!chatsData[currentActiveChatId]) chatsData[currentActiveChatId] = [];
                    chatsData[currentActiveChatId].push({ content: fileData, time, type: 'sent', contentType: 'file' });
                }
                this.value = '';
            }
        });
    }

    if (messageInput) {
        messageInput.addEventListener('input', toggleInputButtons);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);


    // 4. ЗАПИСЬ ГОЛОСА (РЕАЛЬНАЯ)
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;

    if (micBtn) {
        micBtn.addEventListener('click', async () => {
            // Если чат не выбран, не даем записывать
            if (!currentActiveChatId) {
                alert('Сначала выберите чат!');
                return;
            }

            // 1. ОСТАНОВКА ЗАПИСИ
            if (isRecording) {
                mediaRecorder.stop();
                return;
            }

            // 2. НАЧАЛО ЗАПИСИ
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Ваш браузер не поддерживает запись звука.');
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                
                mediaRecorder.start();
                isRecording = true;
                audioChunks = [];

                // Красная кнопка + иконка Стоп)
                micBtn.classList.add('recording'); 
                micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    isRecording = false;
                    
                    // Возвращаем кнопку
                    micBtn.classList.remove('recording');
                    micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';

                    // Создаем аудиофайл 
                    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const time = getCurrentTime();

                    // Рисуем и сохраняем
                    renderMessage(audioUrl, time, 'sent', 'audio');

                    if (!chatsData[currentActiveChatId]) chatsData[currentActiveChatId] = [];
                    chatsData[currentActiveChatId].push({ content: audioUrl, time, type: 'sent', contentType: 'audio' });

                    // Отключаем микрофон
                    stream.getTracks().forEach(track => track.stop());
                };

            } catch (err) {
                console.error('Ошибка микрофона:', err);
                alert('Ошибка доступа к микрофону. Проверьте настройки.');
            }
        });
    }

    // 5. ИНТЕРФЕЙС (МЕНЮ, ПОИСК, ГРУППЫ)

    if (btnHeaderAudio) btnHeaderAudio.addEventListener('click', () => alert('Аудиозвонок (Демо)'));
    if (btnHeaderVideo) btnHeaderVideo.addEventListener('click', () => alert('Видеозвонок (Демо)'));

    if (chatMenuBtn) {
        chatMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chatDropdown.classList.toggle('hidden');
        });
    }

    // Очистка
    if (menuClearBtn) {
        menuClearBtn.addEventListener('click', () => {
            if (!currentActiveChatId) return;
            if (confirm('Очистить историю?')) {
                messagesContainer.innerHTML = '';
                chatsData[currentActiveChatId] = [];
                const sysMsg = document.createElement('div');
                sysMsg.style.textAlign = 'center'; sysMsg.style.color = '#BDC9D6'; sysMsg.style.fontSize = '12px'; sysMsg.style.marginTop = '20px';
                sysMsg.innerHTML = '<i class="fa-solid fa-eraser"></i> История очищена';
                messagesContainer.appendChild(sysMsg);
                chatDropdown.classList.add('hidden');
            }
        });
    }

    // Удаление
    if (menuDeleteBtn) {
        menuDeleteBtn.addEventListener('click', () => {
            if (confirm('Удалить чат?')) {
                const active = document.querySelector('.list-item.active');
                if (active) active.remove();
                if (currentActiveChatId) delete chatsData[currentActiveChatId];
                chatView.classList.add('hidden');
                emptyState.classList.remove('hidden');
                chatDropdown.classList.add('hidden');
            }
        });
    }

    // Поиск
    const toggleSearch = () => {
        searchBar.classList.toggle('hidden');
        if (!searchBar.classList.contains('hidden')) searchInput.focus();
        chatDropdown.classList.add('hidden');
    };
    if (btnHeaderSearch) btnHeaderSearch.addEventListener('click', toggleSearch);
    if (menuSearchBtn) menuSearchBtn.addEventListener('click', toggleSearch);

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const val = this.value.toLowerCase();
            document.querySelectorAll('.message-bubble').forEach(b => {
                const txt = b.querySelector('.msg-text')?.textContent.toLowerCase() || '';
                b.style.display = txt.includes(val) ? 'flex' : 'none';
            });
        });
    }

    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', () => {
            searchBar.classList.add('hidden');
            searchInput.value = '';
            document.querySelectorAll('.message-bubble').forEach(b => b.style.display = 'flex');
        });
    }

    if (btnCreateGroup) btnCreateGroup.addEventListener('click', () => { modalGroup.classList.add('active'); });

    if (submitCreateGroup) {
        submitCreateGroup.addEventListener('click', () => {
            const name = groupNameInput.value.trim();
            const desc = groupDescInput.value.trim();
            if (!name) return;
            createSidebarItem({ id: Date.now(), name, desc, initials: name.substring(0, 2).toUpperCase() }, groupsListContainer, true);
            modalGroup.classList.remove('active');
            groupNameInput.value = '';
        });
    }

    // Контакты
    function renderContacts() {
        const search = document.getElementById('contactSearch').value.toLowerCase();
        contactsListEl.innerHTML = '';
        const filtered = usersDatabase.filter(u => u.name.toLowerCase().includes(search));

        if (filtered.length === 0) {
            contactsListEl.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Ничего не найдено</div>';
            return;
        }

        filtered.forEach(user => {
            const el = document.createElement('div');
            el.className = 'contact-item';
            el.innerHTML = `
                <div class="avatar-sq" style="background:#D9EEFF; color:#0056B3;">${user.initials}</div>
                <div class="contact-info"><h4>${user.name}</h4><p>${user.role}</p></div>
            `;
            el.addEventListener('click', () => {
                createSidebarItem(user, chatsListContainer, false);
                modalChat.classList.remove('active');
            });
            contactsListEl.appendChild(el);
        });
    }

    document.querySelectorAll('.trigger-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.textContent.includes('группу')) {
                modalChat.classList.add('active');
                renderContacts();
            }
        });
    });

    const contactSearch = document.getElementById('contactSearch');
    if (contactSearch) contactSearch.addEventListener('input', renderContacts);

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function () { this.closest('.modal-overlay').classList.remove('active'); });
    });

    // Глобальный клик
    window.addEventListener('click', (e) => {
        if (e.target === modalChat) modalChat.classList.remove('active');
        if (e.target === modalGroup) modalGroup.classList.remove('active');
        if (chatDropdown) chatDropdown.classList.add('hidden');
        if (emojiWrapper && !emojiWrapper.contains(e.target) && e.target !== emojiBtn) {
            emojiWrapper.classList.add('hidden');
        }
    });

    // 6. ЛОГИКА СМАЙЛИКОВ

    if (emojiBtn && emojiWrapper) {
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiWrapper.classList.toggle('hidden');
        });
    }

    const picker = document.querySelector('emoji-picker');
    if (picker) {
        picker.addEventListener('emoji-click', event => {
            const emoji = event.detail.unicode;
            messageInput.value += emoji;
            toggleInputButtons();
        });
    }
});