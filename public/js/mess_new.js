document.addEventListener('DOMContentLoaded', () => {
    // Находим все элементы списка чатов
    const chatItems = document.querySelectorAll('.list-item');

    chatItems.forEach(item => {
        item.addEventListener('click', function() {
            // 1. Удаляем класс 'active' у всех чатов
            chatItems.forEach(el => el.classList.remove('active'));

            // 2. Добавляем класс 'active' тому, по которому кликнули
            this.classList.add('active');

            // 3. Микро-взаимодействие: небольшая вибрация или лог в консоль
            console.log('Выбран чат:', this.querySelector('.name').innerText);
        });
    });

    // Дополнительно: логика для кнопок "назад" и поиска
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }
});
