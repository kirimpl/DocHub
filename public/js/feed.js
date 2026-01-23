document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.querySelector('.btn-more');
    const card = document.querySelector('.lectures-card');

    // Проверка, что элементы найдены
    if (toggleBtn && card) {
        console.log('Кнопка и карточка найдены, вешаем событие');
        
        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault(); // На всякий случай предотвращаем стандартное поведение
            card.classList.toggle('collapsed');
            console.log('Класс collapsed переключен');
        });
    } else {
        console.error('Ошибка: Не найдена кнопка .btn-more или карточка .lectures-card');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const postsData = [
        {
            id: 1,
            author: "КГП на ПХВ «Городская поликлиника №3»",
            date: "Понедельник, 10:14",
            text: "Уважаемые сотрудники, в среду планируется обход кабинетов.",
            images: ["images/hospital.png", "images/hospital2.png"], 
            category: "organization",
            
            // Новые поля
            likes: 42,
            isLiked: false, // Я лайкнул?
            comments: [
                { user: "Иванова А.А.", text: "Принято." },
                { user: "Петров В.В.", text: "Во сколько точно?" }
            ]
        },
        {
            id: 2,
            author: "Отделение Терапии",
            date: "Вчера, 15:30",
            text: "Коллеги, прошу сдать отчеты до конца недели.",
            images: [], 
            category: "department",
            likes: 12,
            isLiked: true,
            comments: []
        },
        {
            id: 3,
            author: "Министерство Здравоохранения",
            date: "20.01.2026",
            text: "Новые протоколы лечения ОРВИ уже доступны.",
            images: [],
            category: "all",
            likes: 156,
            isLiked: false,
            comments: [{ user: "Admin", text: "Ссылка на портале." }]
        }
    ];

    const feedContainer = document.getElementById('newsFeed');
    const template = document.getElementById('postTemplate');
    const filterTabs = document.querySelectorAll('.filter-tab');

    function renderFeed(filter = 'all') {
        feedContainer.innerHTML = ''; 

        postsData.forEach(post => {
            if (filter !== 'all' && post.category !== filter) return; 

            const clone = template.content.cloneNode(true);
            
            // --- Заполнение текстов ---
            clone.querySelector('.post-author').textContent = post.author;
            clone.querySelector('.post-date').textContent = post.date;
            clone.querySelector('.post-text').textContent = post.text;

            // --- Галерея ---
            const gallery = clone.querySelector('.post-gallery');
            if (post.images.length > 0) {
                post.images.forEach(imgSrc => {
                    const imgDiv = document.createElement('div');
                    imgDiv.classList.add('gallery-item');
                    imgDiv.style.backgroundImage = `url('${imgSrc}')`; 
                    gallery.appendChild(imgDiv);
                });
            } else {
                gallery.style.display = 'none';
            }

            // ============================================
            // === НОВАЯ ЛОГИКА: ЛАЙКИ И КОММЕНТАРИИ ===
            // ============================================

            // 1. ЛАЙКИ
            const likeBtn = clone.querySelector('.like-btn');
            const likeCounter = clone.querySelector('.likes-count');
            
            // Инициализация (ставим число и цвет, если уже лайкнуто)
            likeCounter.textContent = post.likes;
            if (post.isLiked) {
                likeBtn.classList.add('active');
            }

            // Обработчик клика
            likeBtn.addEventListener('click', () => {
                // Переключаем состояние в данных (для правильной логики)
                post.isLiked = !post.isLiked;

                // Меняем визуал
                if (post.isLiked) {
                    likeBtn.classList.add('active');
                    post.likes++; // Увеличиваем
                } else {
                    likeBtn.classList.remove('active');
                    post.likes--; // Уменьшаем
                }
                
                // Обновляем цифру
                likeCounter.textContent = post.likes;
            });


            // 2. КОММЕНТАРИИ
            const commentBtn = clone.querySelector('.comment-btn');
            const commentCounter = clone.querySelector('.comments-count');
            const commentsSection = clone.querySelector('.comments-section');
            const commentsList = clone.querySelector('.comments-list');
            const commentInput = clone.querySelector('.comment-input');

            // Ставим количество комментариев
            commentCounter.textContent = post.comments.length;

            // Заполняем список существующих комментариев
            post.comments.forEach(comment => {
                const p = document.createElement('p');
                p.classList.add('comment-row');
                p.innerHTML = `<span class="comment-author">${comment.user}:</span> ${comment.text}`;
                commentsList.appendChild(p);
            });

            // Обработчик клика (Показать/Скрыть)
            commentBtn.addEventListener('click', () => {
                if (commentsSection.style.display === 'none') {
                    commentsSection.style.display = 'block'; // Показываем
                    commentInput.focus(); // Фокус в поле ввода
                } else {
                    commentsSection.style.display = 'none'; // Скрываем
                }
            });

            feedContainer.appendChild(clone);
        });
    }

    // Обработчики фильтров (без изменений)
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderFeed(tab.dataset.filter);
        });
    });

    renderFeed('all');
});