document.addEventListener('DOMContentLoaded', () => {
    const daysContainer = document.getElementById('daysGrid');
    const monthYearLabel = document.getElementById('monthYearLabel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Элементы модального окна
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalDateTitle');
    const eventInput = document.getElementById('eventInput');
    const saveBtn = document.getElementById('saveEventBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeXBtn = document.querySelector('.close-modal-btn');

    let currentDate = new Date();
    let activeMonth = currentDate.getMonth();
    let activeYear = currentDate.getFullYear();
    let selectedDateStr = null;

    // MOCK DATA: Список событий (Пока храним в памяти)
    let events = [
        '2026-01-25',
        '2026-02-14'
    ];

    // === ЛОГИКА КАЛЕНДАРЯ ===
    function renderCalendar(year, month) {
        daysContainer.innerHTML = '';
        const monthName = new Date(year, month).toLocaleString('ru-RU', { month: 'long' });
        monthYearLabel.textContent = `${monthName} ${year}`;
        
        let firstDay = new Date(year, month, 1).getDay();
        let adjustDay = firstDay === 0 ? 6 : firstDay - 1;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // 1. Дни ПРОШЛОГО месяца
        for (let i = 0; i < adjustDay; i++) {
            const span = document.createElement('span');
            span.textContent = daysInPrevMonth - adjustDay + i + 1; 
            span.classList.add('prev-month');
            daysContainer.appendChild(span);
        }

        // 2. Дни ТЕКУЩЕГО месяца
        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const span = document.createElement('span');
            span.textContent = i;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                span.classList.add('today');
            }

            if (events.includes(dateStr)) {
                span.classList.add('has-event');
            }

            span.addEventListener('click', () => {
                openModal(dateStr, i, monthName);
            });

            daysContainer.appendChild(span);
        }

        // 3. Дни СЛЕДУЮЩЕГО месяца
        const totalCells = adjustDay + daysInMonth;
        const rowsNeeded = totalCells > 35 ? 42 : 35; 
        const remainingCells = rowsNeeded - totalCells;

        for (let i = 1; i <= remainingCells; i++) {
            const span = document.createElement('span');
            span.textContent = i;
            span.classList.add('next-month');
            daysContainer.appendChild(span);
        }
    }

    // === ЛОГИКА МОДАЛЬНОГО ОКНА ===
    function openModal(dateStr, dayNum, monthName) {
        selectedDateStr = dateStr;
        modalTitle.textContent = `Событие на ${dayNum} ${monthName}`;
        eventInput.value = '';
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
        selectedDateStr = null;
    }

    function saveEvent() {
        if (selectedDateStr && eventInput.value.trim() !== '') {
            if (!events.includes(selectedDateStr)) {
                events.push(selectedDateStr);
            }

            console.log(`Сохранено: ${eventInput.value} на дату ${selectedDateStr}`);

            // Перерисовываем календарь, чтобы появилась красная точка
            renderCalendar(activeYear, activeMonth);
            closeModal();
        }
    }

    saveBtn.addEventListener('click', saveEvent);
    cancelBtn.addEventListener('click', closeModal);
    closeXBtn.addEventListener('click', closeModal);

    // Закрытие при клике на затемненный фон
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Листание месяцев
    prevBtn.addEventListener('click', () => {
        activeMonth--;
        if (activeMonth < 0) { activeMonth = 11; activeYear--; }
        renderCalendar(activeYear, activeMonth);
    });

    nextBtn.addEventListener('click', () => {
        activeMonth++;
        if (activeMonth > 11) { activeMonth = 0; activeYear++; }
        renderCalendar(activeYear, activeMonth);
    });

    renderCalendar(activeYear, activeMonth);
});