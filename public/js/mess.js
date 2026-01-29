document.addEventListener('DOMContentLoaded', function () {

    const messagesContainer = document.querySelector('.chat-messages');
    const chatsListContainer = document.getElementById('chatsListContainer');
    const groupsListContainer = document.getElementById('groupsListContainer');
    const emptyState = document.getElementById('emptyState');
    const chatView = document.getElementById('chatView');
    const contactsListEl = document.getElementById('contactsList');

    const headerName = document.getElementById('chatHeaderName');
    const headerAvatar = document.getElementById('chatHeaderAvatar');

    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const attachBtn = document.getElementById('attachBtn');
    const hiddenFileInput = document.getElementById('hiddenFileInput');
    const micBtn = document.getElementById('micBtn');

    const modalChat = document.getElementById('createChatModal');
    const modalGroup = document.getElementById('createGroupModal');
    const btnCreateGroup = document.getElementById('btnCreateGroup');
    const groupNameInput = document.getElementById('groupNameInput');
    const groupDescInput = document.getElementById('groupDescInput');
    const submitCreateGroup = document.getElementById('submitCreateGroup');
    const contactSearch = document.getElementById('contactSearch');

    const forwardModal = document.getElementById('forwardModal');
    const closeForwardModal = document.getElementById('closeForwardModal');
    const forwardList = document.getElementById('forwardList');
    const forwardSearch = document.getElementById('forwardSearch');

    const pinnedMessageBar = document.getElementById('pinnedMessageBar');
    const pinnedText = document.getElementById('pinnedText');
    const unpinBtn = document.getElementById('unpinBtn');
    const pinnedContentClick = document.getElementById('pinnedContentClick');

    const replyPanel = document.getElementById('replyPanel');
    const replyTextPreview = document.getElementById('replyTextPreview');
    const closeReplyBtn = document.getElementById('closeReplyBtn');

    const emojiBtn = document.getElementById('emojiBtn');
    const emojiWrapper = document.getElementById('emojiWrapper');

    const ctxMenu = document.getElementById('msgContextMenu');
    const ctxReply = document.getElementById('ctxReply');
    const ctxCopy = document.getElementById('ctxCopy');
    const ctxPin = document.getElementById('ctxPin');
    const ctxDelete = document.getElementById('ctxDelete');
    const ctxForward = document.getElementById('ctxForward');

    const chatMenuBtn = document.getElementById('chatMenuBtn');
    const chatDropdown = document.getElementById('chatDropdown');
    const menuSearchBtn = document.getElementById('menuSearchBtn');
    const menuClearBtn = document.getElementById('menuClearBtn');
    const menuDeleteBtn = document.getElementById('menuDeleteBtn');

    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    const closeSearchBtn = document.getElementById('closeSearchBtn');

    let currentActiveChatId = null;
    let targetMessageElement = null;
    let currentPinnedElement = null;

    let isReplying = false;
    let replyContent = null;
    let messageToForward = null;

    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;

    const chatsData = {};
    const usersDatabase = [
        { id: 1, name: 'Александр Иванов', initials: 'АИ', desc: 'Врач', type: 'user' },
        { id: 2, name: 'Мария Петрова', initials: 'МП', desc: 'Терапевт', type: 'user' },
        { id: 3, name: 'Врачи ГКБ №1', initials: 'ГК', desc: 'Группа', type: 'group' },
        { id: 4, name: 'Дежурство', initials: 'ДЕ', desc: 'Группа', type: 'group' },
        { id: 5, name: 'Дмитрий Сидоров', initials: 'ДС', desc: 'Кардиолог', type: 'user' },
        { id: 6, name: 'Елена Васильева', initials: 'ЕВ', desc: 'Медсестра', type: 'user' },
    ];

    function getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Отрисовка сообщения
    function renderMessage(data) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message-bubble ${data.type}`;

        const { content, contentType, time, type, isForwarded, quote, isPinned } = data;

        let innerHTML = '';

        if (isForwarded) {
            innerHTML += `<div class="forwarded-tag"><i class="fa-solid fa-share"></i> Пересланное сообщение</div>`;
        }

        if (quote) {
            innerHTML += `
                <div class="msg-quote">
                    <span class="quote-name">${quote.author}</span>
                    <span class="quote-text">${quote.text}</span>
                </div>
            `;
        }

        if (contentType === 'image') {
            innerHTML += `<img src="${content}" class="msg-image">`;
        }
        else if (contentType === 'file') {
            innerHTML += `
                <div class="msg-file">
                    <div class="msg-file-icon">
                        <i class="fa-solid fa-arrow-down"></i> 
                    </div>
                    <div class="msg-file-details">
                        <div class="msg-file-name">${content.name}</div>
                        <div class="msg-file-size">${content.size}</div>
                    </div>
                </div>
            `;
        }
        else if (contentType === 'audio') {
            innerHTML += `<audio controls src="${content}" class="msg-audio"></audio>`;
        }
        else {
            innerHTML += `<div class="msg-text">${content}</div>`;
        }

        const checkIcon = type === 'sent' ? '<i class="fa-solid fa-check-double" style="margin-left:5px;"></i>' : '';
        innerHTML += `<div class="msg-meta">${time} ${checkIcon}</div>`;

        msgDiv.innerHTML = innerHTML;
        messagesContainer.appendChild(msgDiv);

        if (isPinned) {
            showPinnedBar(content, msgDiv);
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return msgDiv;
    }

    // Открытие чата
    function openChat(user) {
        emptyState.classList.add('hidden');
        chatView.classList.remove('hidden');
        currentActiveChatId = user.id;

        headerName.textContent = user.name;
        headerAvatar.textContent = user.initials;

        hidePinnedBar();

        messagesContainer.innerHTML = '';
        if (chatsData[user.id]) {
            chatsData[user.id].forEach(msg => renderMessage(msg));
        }

        cancelReply();
    }

    // Создание элемента сайдбара
    function createSidebarItem(u, container) {
        const el = document.createElement('div');
        el.className = 'list-item';
        el.innerHTML = `
            <div class="avatar-sq" style="background-color: ${u.type === 'group' ? '#6EA8DB' : '#004080'}">${u.initials}</div>
            <div class="item-info"><span class="name">${u.name}</span><span class="desc">${u.desc}</span></div>
        `;
        el.addEventListener('click', () => {
            document.querySelectorAll('.list-item').forEach(i => i.classList.remove('active'));
            el.classList.add('active');
            openChat(u);
        });
        container.prepend(el);
    }

    // Инициализация чатов
    usersDatabase.slice(0, 4).forEach(u => {
        const container = u.type === 'group' ? groupsListContainer : chatsListContainer;
        createSidebarItem(u, container);
    });

    // Отправка сообщения
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text === '' || !currentActiveChatId) return;

        const msgData = {
            content: text,
            time: getCurrentTime(),
            type: 'sent',
            contentType: 'text',
            quote: null,
            isForwarded: false,
            isPinned: false
        };

        if (isReplying && replyContent) {
            msgData.quote = { text: replyContent, author: 'Собеседник' };
        }

        if (!chatsData[currentActiveChatId]) chatsData[currentActiveChatId] = [];
        chatsData[currentActiveChatId].push(msgData);

        renderMessage(msgData);

        messageInput.value = '';
        cancelReply();
        toggleSendBtn();
    }

    // Обработка файлов
    if (attachBtn && hiddenFileInput) {
        attachBtn.addEventListener('click', () => hiddenFileInput.click());

        hiddenFileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                const file = this.files[0];
                if (!currentActiveChatId) {
                    alert('Выберите чат!');
                    return;
                }

                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const msgData = {
                            content: e.target.result,
                            time: getCurrentTime(),
                            type: 'sent',
                            contentType: 'image',
                            quote: null, isForwarded: false, isPinned: false
                        };
                        if (!chatsData[currentActiveChatId]) chatsData[currentActiveChatId] = [];
                        chatsData[currentActiveChatId].push(msgData);
                        renderMessage(msgData);
                    }
                    reader.readAsDataURL(file);
                }
                else {
                    const msgData = {
                        content: { name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' },
                        time: getCurrentTime(),
                        type: 'sent',
                        contentType: 'file',
                        quote: null, isForwarded: false, isPinned: false
                    };
                    if (!chatsData[currentActiveChatId]) chatsData[currentActiveChatId] = [];
                    chatsData[currentActiveChatId].push(msgData);
                    renderMessage(msgData);
                }
                this.value = '';
            }
        });
    }

    // Смайлики
    if (emojiBtn && emojiWrapper) {
        emojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiWrapper.classList.toggle('hidden');
        });

        const picker = document.querySelector('emoji-picker');
        if (picker) {
            picker.addEventListener('emoji-click', event => {
                messageInput.value += event.detail.unicode;
                toggleSendBtn();
            });
        }
    }

    // Запись голоса
    if (micBtn) {
        micBtn.addEventListener('click', async () => {
            if (!currentActiveChatId) {
                alert('Выберите чат!');
                return;
            }

            if (isRecording) {
                mediaRecorder.stop();
                return;
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Нет доступа к микрофону');
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.start();
                isRecording = true;

                micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
                micBtn.style.color = 'red';

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                    const audioUrl = URL.createObjectURL(audioBlob);

                    const msgData = {
                        content: audioUrl,
                        time: getCurrentTime(),
                        type: 'sent',
                        contentType: 'audio',
                        quote: null, isForwarded: false, isPinned: false
                    };

                    if (!chatsData[currentActiveChatId]) chatsData[currentActiveChatId] = [];
                    chatsData[currentActiveChatId].push(msgData);
                    renderMessage(msgData);

                    isRecording = false;
                    micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
                    micBtn.style.color = '';

                    stream.getTracks().forEach(track => track.stop());
                };

            } catch (err) {
                console.error('Ошибка микрофона:', err);
            }
        });
    }

    function toggleSendBtn() {
        if (messageInput.value.trim().length > 0) {
            sendBtn.classList.remove('hidden');
            sendBtn.classList.add('visible');
        } else {
            sendBtn.classList.remove('visible');
            sendBtn.classList.add('hidden');
        }
    }

    messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    messageInput.addEventListener('input', toggleSendBtn);
    sendBtn.addEventListener('click', sendMessage);

    // Работа кнопки Троеточие (Меню чата)
    if (chatMenuBtn) {
        chatMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            chatDropdown.classList.toggle('hidden');
        });
    }

    // Кнопки внутри меню (Поиск, Очистить, Удалить)
    if (menuSearchBtn) {
        menuSearchBtn.addEventListener('click', () => {
            searchBar.classList.remove('hidden');
            searchInput.focus();
            chatDropdown.classList.add('hidden');
        });
    }

    if (menuClearBtn) {
        menuClearBtn.addEventListener('click', () => {
            if (confirm('Очистить историю переписки?')) {
                messagesContainer.innerHTML = '';
                if (currentActiveChatId) chatsData[currentActiveChatId] = [];
                chatDropdown.classList.add('hidden');
            }
        });
    }

    if (menuDeleteBtn) {
        menuDeleteBtn.addEventListener('click', () => {
            if (confirm('Удалить этот чат полностью?')) {
                messagesContainer.innerHTML = '';
                chatView.classList.add('hidden');
                emptyState.classList.remove('hidden');
                if (currentActiveChatId) delete chatsData[currentActiveChatId];

                // Удаляем активный элемент из сайдбара
                const activeItem = document.querySelector('.list-item.active');
                if (activeItem) activeItem.remove();

                chatDropdown.classList.add('hidden');
            }
        });
    }

    // Закрытие поиска
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', () => {
            searchBar.classList.add('hidden');
            searchInput.value = '';
            // Сбрасываем фильтр поиска
            document.querySelectorAll('.message-bubble').forEach(el => el.style.display = 'flex');
        });
    }

    // Поиск по сообщениям
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            document.querySelectorAll('.message-bubble').forEach(el => {
                const text = el.querySelector('.msg-text')?.innerText.toLowerCase() || '';
                el.style.display = text.includes(val) ? 'flex' : 'none';
            });
        });
    }

    // Контекстное меню (ПКМ)
    messagesContainer.addEventListener('contextmenu', (e) => {
        const bubble = e.target.closest('.message-bubble');
        if (bubble) {
            e.preventDefault();
            targetMessageElement = bubble;

            let x = e.clientX;
            let y = e.clientY;
            if (x + 220 > window.innerWidth) x = window.innerWidth - 220;
            if (y + 200 > window.innerHeight) y = window.innerHeight - 200;

            ctxMenu.style.left = `${x}px`;
            ctxMenu.style.top = `${y}px`;
            ctxMenu.classList.remove('hidden');
        }
    });

    // Глобальное закрытие менюшек
    window.addEventListener('click', (e) => {
        if (ctxMenu) ctxMenu.classList.add('hidden');
        if (emojiWrapper && !emojiWrapper.contains(e.target) && e.target !== emojiBtn) {
            emojiWrapper.classList.add('hidden');
        }
        if (chatDropdown && !chatMenuBtn.contains(e.target)) {
            chatDropdown.classList.add('hidden');
        }
        if (e.target === forwardModal) forwardModal.classList.remove('active');
        if (e.target === modalChat) modalChat.classList.remove('active');
        if (e.target === modalGroup) modalGroup.classList.remove('active');
    });

    // Закрепление
    ctxPin.addEventListener('click', () => {
        if (targetMessageElement) {
            const text = targetMessageElement.querySelector('.msg-text')?.innerText || '[Медиа]';
            showPinnedBar(text, targetMessageElement);
        }
    });

    function showPinnedBar(text, element) {
        pinnedMessageBar.classList.remove('hidden');
        pinnedText.textContent = text;
        currentPinnedElement = element;
    }

    function hidePinnedBar() {
        pinnedMessageBar.classList.add('hidden');
        currentPinnedElement = null;
    }

    unpinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hidePinnedBar();
    });

    pinnedContentClick.addEventListener('click', () => {
        if (currentPinnedElement) {
            currentPinnedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            currentPinnedElement.style.transition = 'background 0.3s';
            const originalBg = currentPinnedElement.style.background;
            currentPinnedElement.style.background = '#FFF3CD';
            setTimeout(() => {
                currentPinnedElement.style.background = originalBg;
            }, 500);
        }
    });

    // Ответ
    ctxReply.addEventListener('click', () => {
        if (targetMessageElement) {
            const text = targetMessageElement.querySelector('.msg-text')?.innerText || '[Медиа]';
            startReply(text);
        }
    });

    function startReply(text) {
        isReplying = true;
        replyContent = text;
        replyPanel.classList.remove('hidden');
        replyTextPreview.textContent = text;
        messageInput.focus();
    }

    function cancelReply() {
        isReplying = false;
        replyContent = null;
        replyPanel.classList.add('hidden');
    }
    closeReplyBtn.addEventListener('click', cancelReply);

    // Пересылка
    ctxForward.addEventListener('click', () => {
        if (targetMessageElement) {
            const text = targetMessageElement.querySelector('.msg-text')?.innerText || '[Медиа]';
            messageToForward = text;
            forwardModal.classList.add('active');
            renderForwardList();
        }
    });

    function renderForwardList() {
        forwardList.innerHTML = '';
        usersDatabase.forEach(u => {
            const el = document.createElement('div');
            el.className = 'contact-item';
            el.innerHTML = `
                <div class="avatar-sq" style="background:#D9EEFF; color:#0056B3;">${u.initials}</div>
                <div class="contact-info"><h4>${u.name}</h4><p>${u.type === 'group' ? 'Группа' : 'Чат'}</p></div>
            `;
            el.addEventListener('click', () => performForward(u));
            forwardList.appendChild(el);
        });
    }

    function performForward(targetUser) {
        forwardModal.classList.remove('active');
        document.querySelectorAll('.list-item').forEach(item => item.classList.remove('active'));
        openChat(targetUser);

        const msgData = {
            content: messageToForward,
            time: getCurrentTime(),
            type: 'sent',
            contentType: 'text',
            isForwarded: true
        };

        if (!chatsData[targetUser.id]) chatsData[targetUser.id] = [];
        chatsData[targetUser.id].push(msgData);
        renderMessage(msgData);
        messageToForward = null;
    }

    forwardSearch.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        forwardList.querySelectorAll('.contact-item').forEach(item => {
            item.style.display = item.innerText.toLowerCase().includes(val) ? 'flex' : 'none';
        });
    });

    closeForwardModal.addEventListener('click', () => forwardModal.classList.remove('active'));

    // Копирование
    ctxCopy.addEventListener('click', () => {
        const text = targetMessageElement?.querySelector('.msg-text')?.innerText;
        if (text) navigator.clipboard.writeText(text);
    });

    // Удаление
    ctxDelete.addEventListener('click', () => {
        if (confirm('Удалить сообщение?')) {
            if (targetMessageElement === currentPinnedElement) hidePinnedBar();
            targetMessageElement?.remove();
        }
    });

    // Рендер контактов в модалке
    function renderContacts() {
        const search = contactSearch.value.toLowerCase();
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
                <div class="contact-info"><h4>${user.name}</h4><p>${user.desc}</p></div>
            `;
            el.addEventListener('click', () => {
                createSidebarItem(user, chatsListContainer);
                modalChat.classList.remove('active');
                openChat(user);
            });
            contactsListEl.appendChild(el);
        });
    }

    // Кнопка Создать чат
    document.querySelectorAll('.trigger-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.textContent.includes('группу')) {
                modalChat.classList.add('active');
                renderContacts();
            }
        });
    });

    if (contactSearch) contactSearch.addEventListener('input', renderContacts);

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.modal-overlay').classList.remove('active');
        });
    });

    // Кнопка Создать группу
    if (btnCreateGroup) {
        btnCreateGroup.addEventListener('click', (e) => {
            e.stopPropagation();
            modalGroup.classList.add('active');
        });
    }

    if (submitCreateGroup) {
        submitCreateGroup.addEventListener('click', () => {
            const name = groupNameInput.value.trim();
            const desc = groupDescInput.value.trim();
            if (!name) return;
            const newGroup = {
                id: Date.now(),
                name,
                desc,
                initials: name.substring(0, 2).toUpperCase(),
                type: 'group'
            };
            usersDatabase.push(newGroup);
            createSidebarItem(newGroup, groupsListContainer);

            modalGroup.classList.remove('active');
            groupNameInput.value = '';
        });
    }

});