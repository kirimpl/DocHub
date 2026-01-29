document.addEventListener('DOMContentLoaded', function () {
    // Берем данные, которые мы прокинули через Blade
    const user = window.userData || {};
    const infoGrid = document.getElementById('userDataGrid');
    const postsList = document.getElementById('postsList');

    // 1. Заполнение блока ИНФОРМАЦИЯ
    if (infoGrid) {
        infoGrid.innerHTML = `
            <div class="details-grid">
                <div class="detail-item">
                    <i class="fa-solid fa-location-dot"></i> Город: <b>${data.user.city || 'Не указан'}</b>
                </div>
                <div class="detail-item">
                    <i class="fa-solid fa-briefcase"></i> Место работы: <b>${user.work_place || 'Не указано'}</b>
                </div>
                <div class="detail-item">
                    <i class="fa-solid fa-medal"></i> Стаж: <b>${user.work_experience || 0} лет</b>
                </div>
                <div class="detail-item">
                    <i class="fa-solid fa-graduation-cap"></i> Образование: <b>${user.education || 'Не указано'}</b>
                </div>
                <div class="detail-item">
                    <i class="fa-solid fa-stethoscope"></i> Специализация: <b>${user.speciality || 'Общая'}</b>
                </div>

                <hr style="border:0; border-top:1px solid #f0f4f8; margin: 15px 0;">
                <h3 style="color: #004080; font-size: 18px; margin-bottom: 15px;">Контакты</h3>

                <div class="detail-item">
                    <i class="fa-solid fa-envelope"></i> Почта: <b>${user.email || 'Не указана'}</b>
                </div>
                <div class="detail-item">
                    <i class="fa-solid fa-phone"></i> Телефон: <b>${user.phone_number || 'Не указан'}</b>
                </div>
            </div>
        `;
    }

    // 2. Отрисовка постов (используем реальное имя пользователя из БД)
    const posts = [
        { time: '10:14', text: 'Уважаемые сотрудники, в среду планируется обход...', initials: 'ИИ' },
        { time: '09:00', text: 'Кто-то видел коробку с перчатками в 104 кабинете?', initials: 'ИИ' }
    ];

    if (postsList) {
        postsList.innerHTML = posts.map(p => `
            <div class="post-card-style" style="background: white; border-radius: 25px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.03); margin-bottom: 20px;">
                <div style="background: #004080; height: 10px;"></div>
                <div style="padding: 20px;">
                    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
                        <div style="background: #004080; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">${p.initials}</div>
                        <strong style="color: #333;">${user.name || 'Доктор'} • ${p.time}</strong>
                    </div>
                    <p style="color: #000; font-size: 15px; line-height: 1.5;">${p.text}</p>
                </div>
            </div>
        `).join('');
    }
});
