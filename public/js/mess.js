document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('createChatModal');
    const chatsListContainer = document.getElementById('chatsListContainer');
    const emptyState = document.getElementById('emptyState');
    const chatView = document.getElementById('chatView');
    const contactsListEl = document.getElementById('contactsList');
    const headerName = document.getElementById('chatHeaderName');
    const headerRole = document.getElementById('chatHeaderRole');
    const headerAvatar = document.getElementById('chatHeaderAvatar');

    const usersDatabase = [
        { id: 1, name: 'Александр Иванов', role: 'Врач', hospital: 'ГКБ №1', dept: 'Хирургия', initials: 'АИ' },
        { id: 2, name: 'Мария Петрова', role: 'Врач', hospital: 'ЦКБ РАН', dept: 'Терапия', initials: 'МП' },
        { id: 3, name: 'Дмитрий Сидоров', role: 'Кардиолог', hospital: 'ГКБ №1', dept: 'Кардиология', initials: 'ДС' },
        { id: 4, name: 'Елена Васильева', role: 'Медсестра', hospital: 'ГКБ №1', dept: 'Терапия', initials: 'ЕВ' },
        { id: 5, name: 'Сергей Волков', role: 'Главврач', hospital: 'ЦКБ РАН', dept: 'Администрация', initials: 'СВ' },
    ];

    function openChatInterface(user) {
        emptyState.classList.add('hidden');
        chatView.classList.remove('hidden');
        headerName.textContent = user.name;
        headerRole.textContent = `${user.role} • ${user.hospital}`;
        headerAvatar.textContent = user.initials;
    }

    function createSidebarChat(user) {
        document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
        const newItem = document.createElement('div');
        newItem.className = 'list-item active';
        newItem.innerHTML = `
            <div class="avatar-sq">${user.initials}</div>
            <div class="item-info">
                <span class="name">${user.name}</span>
                <span class="desc">Нажмите, чтобы написать...</span>
            </div>
            <div class="item-meta"><span class="time">Сейчас</span></div>
        `;
        newItem.addEventListener('click', () => {
            document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
            newItem.classList.add('active');
            openChatInterface(user);
        });
        chatsListContainer.prepend(newItem);
        openChatInterface(user);
    }

    function renderContacts() {
        const search = document.getElementById('contactSearch').value.toLowerCase();
        const hosp = document.getElementById('filterHospital').value;
        const dept = document.getElementById('filterDept').value;
        const role = document.getElementById('filterRole').value;
        contactsListEl.innerHTML = '';
        const filtered = usersDatabase.filter(u => {
            return u.name.toLowerCase().includes(search) && (hosp === '' || u.hospital === hosp) &&   (dept === '' || u.dept === dept) && (role === '' || u.role === role);
        });
        if(filtered.length === 0) {
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
                createSidebarChat(user);
                modal.classList.remove('active');
            });
            contactsListEl.appendChild(el);
        });
    }

    document.querySelectorAll('.trigger-modal').forEach(btn => {
        btn.addEventListener('click', () => { modal.classList.add('active'); renderContacts(); });
    });
    document.querySelector('.close-modal').addEventListener('click', () => modal.classList.remove('active'));
    window.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('active'); });
    ['contactSearch', 'filterHospital', 'filterDept', 'filterRole'].forEach(id => {
        document.getElementById(id).addEventListener('input', renderContacts);
    });
    const staticChat = document.querySelector('#chatsListContainer .list-item');
    if(staticChat) {
        staticChat.addEventListener('click', function() {
            document.querySelectorAll('.list-item').forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            openChatInterface({ name: 'Иван Иванов', role: 'Коллега', hospital: 'Офис', initials: 'ИИ' });
        });
    }
});
