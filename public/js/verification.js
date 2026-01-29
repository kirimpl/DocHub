document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api';
    const statusLabel = document.getElementById('verificationStatusLabel');
    const adminPanel = document.getElementById('adminPanel');
    const adminList = document.getElementById('adminRequestsList');
    const btnSupport = document.getElementById('btnOpenSupport');
    const btnUpload = document.getElementById('btnUploadDocs');
    const fileInput = document.getElementById('verificationFileInput');

    const getAuthToken = () => localStorage.getItem('auth_token');

    const authHeaders = () => ({
        Accept: 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
    });

    const setStatus = (value) => {
        if (statusLabel) statusLabel.textContent = value;
    };

    const fetchStatus = async () => {
        const res = await fetch(`${API_URL}/verification/status`, {
            headers: authHeaders(),
        });
        if (!res.ok) return null;
        return res.json();
    };

    const fetchPending = async () => {
        const res = await fetch(`${API_URL}/verification/pending`, {
            headers: authHeaders(),
        });
        if (!res.ok) return [];
        return res.json();
    };

    const approveUser = async (id) => {
        await fetch(`${API_URL}/verification/${id}/approve`, {
            method: 'POST',
            headers: authHeaders(),
        });
    };

    const rejectUser = async (id) => {
        await fetch(`${API_URL}/verification/${id}/reject`, {
            method: 'POST',
            headers: authHeaders(),
        });
    };

    const uploadDocument = async (file) => {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`${API_URL}/verification/documents`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: form,
        });
        return res.ok;
    };

    const renderAdminRequests = (items) => {
        if (!adminList) return;
        if (!items.length) {
            adminList.innerHTML = '<p style="color:#999;">Нет заявок</p>';
            return;
        }
        adminList.innerHTML = items.map((item) => `
            <div class="admin-request" style="padding: 10px 0; border-bottom: 1px solid #eef2f7;">
                <div style="font-weight: 600;">${item.name || 'Пользователь'} (${item.email || '-'})</div>
                <div style="color:#6b7280; font-size: 13px;">${item.work_place || 'Без места работы'}</div>
                <div style="margin-top: 8px; display:flex; gap:8px;">
                    <button class="btn-primary" data-approve="${item.id}">Подтвердить</button>
                    <button class="btn-secondary" data-reject="${item.id}">Отклонить</button>
                </div>
            </div>
        `).join('');

        adminList.querySelectorAll('[data-approve]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                await approveUser(btn.dataset.approve);
                const pending = await fetchPending();
                renderAdminRequests(pending);
            });
        });
        adminList.querySelectorAll('[data-reject]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                await rejectUser(btn.dataset.reject);
                const pending = await fetchPending();
                renderAdminRequests(pending);
            });
        });
    };

    const init = async () => {
        const statusData = await fetchStatus();
        if (statusData && statusData.status) {
            setStatus(statusData.status);
        } else {
            setStatus('неизвестно');
        }

        if (window.userData && window.userData.global_role === 'admin') {
            if (adminPanel) adminPanel.style.display = 'block';
            const pending = await fetchPending();
            renderAdminRequests(pending);
        }
    };

    if (btnSupport) {
        btnSupport.addEventListener('click', async () => {
            const res = await fetch(`${API_URL}/verification/support`, {
                headers: authHeaders(),
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data && data.chat_id) {
                window.location.href = `/messages?chat=${data.chat_id}`;
            }
        });
    }

    if (btnUpload && fileInput) {
        btnUpload.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;
            const ok = await uploadDocument(file);
            if (ok) {
                alert('Документ отправлен. Ожидайте проверки.');
            } else {
                alert('Не удалось отправить документ.');
            }
            fileInput.value = '';
        });
    }

    init();
});
