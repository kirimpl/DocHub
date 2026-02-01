(() => {
    const searchButton = document.querySelector('.sidecard-search');
    const panel = document.getElementById('sidecardSearchPanel');
    const input = document.getElementById('sidecardSearchInput');
    const closeButton = document.getElementById('sidecardSearchClose');

    if (!searchButton || !panel || !input) {
        return;
    }

    const openPanel = () => {
        panel.classList.add('active');
        panel.setAttribute('aria-hidden', 'false');
        input.focus();
        input.select();
    };

    const closePanel = () => {
        panel.classList.remove('active');
        panel.setAttribute('aria-hidden', 'true');
    };

    searchButton.addEventListener('click', (event) => {
        event.preventDefault();
        if (panel.classList.contains('active')) {
            closePanel();
        } else {
            openPanel();
        }
    });

    closeButton?.addEventListener('click', () => {
        closePanel();
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const value = input.value.trim();
            if (value) {
                window.location.href = `/search?q=${encodeURIComponent(value)}`;
            }
        }
        if (event.key === 'Escape') {
            closePanel();
        }
    });

    document.addEventListener('click', (event) => {
        if (!panel.contains(event.target) && !searchButton.contains(event.target)) {
            closePanel();
        }
    });

    if (window.location.pathname.startsWith('/search')) {
        const params = new URLSearchParams(window.location.search);
        const currentQuery = params.get('q');
        if (currentQuery) {
            input.value = currentQuery;
        }
    }
})();
