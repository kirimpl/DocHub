document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api';
    const supportLink = document.getElementById('supportLink');
    const adminLink = document.getElementById('adminPanelLink');

    const getToken = () => localStorage.getItem('auth_token');

    const checkAdminAccess = async () => {
        const token = getToken();
        if (!token) return false;
        const res = await fetch(`${API_URL}/verification/pending`, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        return res.ok;
    };

    if (supportLink) {
        supportLink.addEventListener('click', async (event) => {
            event.preventDefault();
            window.location.href = '/verification';
        });
    }

    if (adminLink) {
        checkAdminAccess().then((ok) => {
            if (ok) {
                adminLink.style.display = 'flex';
            }
        }).catch(() => {});
    }
});
