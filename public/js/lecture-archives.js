document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api';
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    const listEl = document.getElementById('lectureArchivesLectures');
    const titleEl = document.getElementById('lectureArchivesTitle');
    const recEl = document.getElementById('lectureArchivesRecordings');
    const player = document.getElementById('lectureArchivesPlayer');

    const authHeaders = () => ({
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
    });

    const renderLectures = (lectures) => {
        listEl.innerHTML = '';
        lectures.forEach((lecture) => {
            const item = document.createElement('div');
            item.className = 'lecture-archives-item';
            item.textContent = lecture.title || `Lecture #${lecture.id}`;
            item.addEventListener('click', async () => {
                document.querySelectorAll('.lecture-archives-item').forEach((el) => el.classList.remove('active'));
                item.classList.add('active');
                await loadRecordings(lecture);
            });
            listEl.appendChild(item);
        });
    };

    const loadRecordings = async (lecture) => {
        titleEl.textContent = lecture.title || `Lecture #${lecture.id}`;
        recEl.innerHTML = '';
        const res = await fetch(`${API_URL}/lectures/${lecture.id}/recordings`, { headers: authHeaders() });
        if (!res.ok) {
            recEl.textContent = 'No recordings available.';
            return;
        }
        const recordings = await res.json();
        if (!recordings.length) {
            recEl.textContent = 'No recordings available.';
            return;
        }
        recordings.forEach((rec) => {
            const card = document.createElement('div');
            card.className = 'lecture-recording-card';
            const label = document.createElement('div');
            label.textContent = `Recording #${rec.id}`;
            const meta = document.createElement('div');
            meta.textContent = rec.duration_seconds ? `${rec.duration_seconds}s` : '';
            const playBtn = document.createElement('button');
            playBtn.textContent = 'Play';
            playBtn.addEventListener('click', () => {
                fetch(`${API_URL}/lectures/${lecture.id}/recordings/${rec.id}/download`, {
                    headers: authHeaders(),
                })
                    .then((response) => response.blob())
                    .then((blob) => {
                        const url = URL.createObjectURL(blob);
                        player.src = url;
                        player.play().catch(() => {});
                    })
                    .catch(() => {});
            });
            card.append(label, meta, playBtn);
            recEl.appendChild(card);
        });
    };

    const init = async () => {
        const res = await fetch(`${API_URL}/lectures`, { headers: authHeaders() });
        if (!res.ok) {
            listEl.textContent = 'Failed to load lectures.';
            return;
        }
        const lectures = await res.json();
        renderLectures(lectures);
    };

    init();
});
