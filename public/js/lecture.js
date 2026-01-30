document.addEventListener('DOMContentLoaded', () => {
    const root = document.querySelector('.lecture-page');
    if (!root) return;

    const lectureId = root.dataset.lectureId;
    if (!lectureId) return;

    const state = {
        lecture: null,
        me: null,
        participants: [],
        localStream: null,
        peers: new Map(),
        participantStates: new Map(),
        activeSpeakerId: null,
        chatGroupId: null,
        chatMessages: [],
        chatMessageIds: new Set(),
        viewMode: 'grid',
    };
    const audioAnalysers = new Map();
    const keyFor = (id) => String(id);
    const getStateFor = (id) => state.participantStates.get(keyFor(id));
    const setStateFor = (id, patch) => {
        const key = keyFor(id);
        const current = state.participantStates.get(key) || { micOff: false, videoOff: false };
        state.participantStates.set(key, { ...current, ...patch });
    };
    const updateMicIndicator = (userId) => {
        const micOff = getStateFor(userId)?.micOff === true;
        const mainUserId = state.lecture?.creator_id;
        if (Number(userId) === Number(mainUserId) && mainMic) {
            mainMic.hidden = !micOff;
            mainMic.style.display = micOff ? 'grid' : 'none';
        }
        const tileMic = gridEl?.querySelector(`[data-user-id="${userId}"] .lecture-mic`);
        if (tileMic) {
            tileMic.hidden = !micOff;
            tileMic.style.display = micOff ? 'grid' : 'none';
        }
    };
    const syncMicIndicators = () => {
        state.participants.forEach((p) => updateMicIndicator(p.id));
    };

    const API_URL = '/api';
    const warningEl = document.getElementById('lectureWarning');
    const titleEl = document.getElementById('lectureTitle');
    const timerEl = document.getElementById('lectureTimer');
    const hostAvatarEl = document.getElementById('lectureHostAvatar');
    const hostNameEl = document.getElementById('lectureHostName');
    const avatarsEl = document.getElementById('lecturePeopleAvatars');
    const countEl = document.getElementById('lecturePeopleCount');
    const mainVideo = document.getElementById('lectureMainVideo');
    const mainLabel = document.getElementById('lectureMainLabel');
    const mainMic = document.getElementById('lectureMainMic');
    const mainRole = document.getElementById('lectureMainRole');
    const gridEl = document.getElementById('lectureGridTiles');
    const moreBtn = document.getElementById('lectureMoreBtn');
    const moreCount = document.getElementById('lectureMoreCount');
    const participantsPanel = document.getElementById('lectureParticipantsPanel');
    const participantsList = document.getElementById('lectureParticipantsList');
    const participantsClose = document.getElementById('lectureParticipantsClose');
    const chatPanel = document.getElementById('lectureChatPanel');
    const chatClose = document.getElementById('lectureChatClose');
    const chatMessages = document.getElementById('lectureChatMessages');
    const chatInput = document.getElementById('lectureChatInput');
    const chatSend = document.getElementById('lectureChatSend');
    const chatInputWrapper = document.querySelector('.lecture-chat-input');

    const backBtn = document.getElementById('lectureBackBtn');
    const shareBtn = document.getElementById('lectureShareBtn');
    const archiveBtn = document.getElementById('lectureArchiveBtn');
    const endBtn = document.getElementById('lectureEndBtn');
    const micBtn = document.getElementById('lectureMicBtn');
    const videoBtn = document.getElementById('lectureVideoBtn');
    const chatBtn = document.getElementById('lectureChatBtn');
    const emojiBtn = document.getElementById('lectureEmojiBtn');
    const leaveBtn = document.getElementById('lectureLeaveBtn');
    const reportBtn = document.getElementById('lectureReportBtn');

    const getToken = () => localStorage.getItem('auth_token');
    const authHeaders = () => ({
        Accept: 'application/json',
        Authorization: `Bearer ${getToken()}`,
    });

    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };

    const formatTime = (value) => {
        if (!value) return '--:--';
        const total = Math.max(0, Math.floor(value));
        const minutes = String(Math.floor(total / 60)).padStart(2, '0');
        const seconds = String(total % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const getFullName = (user) => {
        if (!user) return '—';
        const name = `${user.name || ''} ${user.last_name || ''}`.trim();
        return name || 'Пользователь';
    };

    const resolveAvatar = (avatar) => {
        if (avatar) return avatar;
        return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="%23d8e6fb"/><text x="50%25" y="55%25" text-anchor="middle" font-size="24" fill="%235377a8">+</text></svg>';
    };

    const setMainTile = (user) => {
        const isSelf = user?.id === state.me?.id;
        mainLabel.textContent = isSelf ? 'Вы' : getFullName(user);
        const micOff = getStateFor(user.id)?.micOff === true;
        mainMic.hidden = !micOff;
        if (mainMic) {
            mainMic.style.display = micOff ? 'grid' : 'none';
        }
        const isCreator = user.is_creator;
        const isAdmin = user.global_role === 'admin';
        mainRole.hidden = !(isCreator || isAdmin);
        if (isCreator) {
            mainRole.innerHTML = '<i class="fa-solid fa-crown"></i>';
        } else if (isAdmin) {
            mainRole.innerHTML = '<i class="fa-solid fa-shield"></i>';
        }
    };

    const renderAvatars = () => {
        const list = state.participants.slice(0, 3);
        avatarsEl.innerHTML = '';
        list.forEach((p) => {
            const img = document.createElement('img');
            img.src = resolveAvatar(p.avatar);
            img.alt = getFullName(p);
            avatarsEl.appendChild(img);
        });
        const total = state.participants.length;
        countEl.textContent = `${total} участников`;
    };

    const renderGrid = () => {
        if (!gridEl) return;
        if (state.localStream && state.me?.id) {
            const micOff = !(state.localStream.getAudioTracks()?.[0]?.enabled ?? false);
            const videoOff = !(state.localStream.getVideoTracks()?.[0]?.enabled ?? false);
            setStateFor(state.me.id, { micOff, videoOff });
        }
        const creatorId = state.lecture?.creator_id;
        const others = state.participants.filter((p) => p.id !== creatorId);
        const gridUsers = others.slice(0, 4);
        gridEl.innerHTML = '';
        gridUsers.forEach((user) => {
            ensureParticipantState(user.id);
            const tile = document.createElement('div');
            tile.className = 'lecture-video-shell';
            tile.dataset.userId = user.id;
            const video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            video.dataset.userId = user.id;
            tile.appendChild(video);
            const label = document.createElement('div');
            label.className = 'lecture-nameplate';
            label.textContent = user.id === state.me?.id ? 'Вы' : getFullName(user);
            tile.appendChild(label);
            const mic = document.createElement('div');
            mic.className = 'lecture-mic';
            mic.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
            const micOff = getStateFor(user.id)?.micOff === true;
            mic.hidden = !micOff;
            mic.style.display = micOff ? 'grid' : 'none';
            tile.appendChild(mic);
            const role = document.createElement('div');
            role.className = 'lecture-role';
            role.hidden = !(user.is_creator || user.global_role === 'admin');
            role.innerHTML = user.is_creator ? '<i class="fa-solid fa-crown"></i>' : '<i class="fa-solid fa-shield"></i>';
            tile.appendChild(role);
            gridEl.appendChild(tile);
        });

        const remaining = others.length - gridUsers.length;
        if (remaining > 0) {
            moreBtn.hidden = false;
            moreCount.textContent = `+${remaining}`;
        } else {
            moreBtn.hidden = true;
        }
        attachLocalStreamToGrid();
        reattachPeerStreams();
        syncMicIndicators();
    };

    const renderParticipantsList = () => {
        if (!participantsList) return;
        if (state.localStream && state.me?.id) {
            const micOff = !(state.localStream.getAudioTracks()?.[0]?.enabled ?? false);
            const videoOff = !(state.localStream.getVideoTracks()?.[0]?.enabled ?? false);
            setStateFor(state.me.id, { micOff, videoOff });
        }
        const canManage = state.me?.id === state.lecture?.creator_id || state.me?.global_role === 'admin';
        participantsList.innerHTML = state.participants.map((user) => {
            ensureParticipantState(user.id);
            const isSelf = user.id === state.me?.id;
            const name = isSelf ? 'Вы' : getFullName(user);
            const badge = user.is_creator ? '👑' : (user.global_role === 'admin' ? '🛡️' : '');
            const micOff = getStateFor(user.id)?.micOff === true;
            return `
                <div class="lecture-panel-item">
                    <div class="lecture-panel-user">
                        <img src="${resolveAvatar(user.avatar)}" alt="${name}">
                        <div>
                            <div style="font-weight:600;">${name} ${badge}</div>
                            <div style="font-size:12px; color:#7c9ac2;">${micOff ? 'Микрофон выключен' : ''}</div>
                        </div>
                    </div>
                    <div class="lecture-panel-actions">
                        ${canManage && !user.is_creator && !isSelf ? `<button class="danger" data-kick="${user.id}">⛔</button>` : ''}
                        ${canManage && !user.is_creator && !isSelf ? `<button class="danger" data-ban="${user.id}">🚫</button>` : ''}
                        ${!canManage && !isSelf ? `<button data-report="${user.id}">⚠️</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        participantsList.querySelectorAll('[data-kick]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const userId = btn.dataset.kick;
                if (!confirm('Удалить участника из лекции?')) return;
                await kickUser(userId);
            });
        });
        participantsList.querySelectorAll('[data-ban]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const userId = btn.dataset.ban;
                const reason = prompt('Причина блокировки (необязательно):') || '';
                await banUser(userId, reason);
            });
        });
        participantsList.querySelectorAll('[data-report]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const userId = btn.dataset.report;
                const text = prompt('Опишите жалобу на пользователя:') || '';
                if (!text) return;
                await reportUser(userId, text);
            });
        });
    };

    const ensureEcho = () => {
        if (window.Echo && typeof window.Echo.private === 'function') return window.Echo;
        const token = getToken();
        if (!token) return null;
        const echoKey = window.ECHO_KEY || window.REVERB_CONFIG?.key || 'h81dgta6jqvb3e3mkasl';
        const EchoCtor = window.Echo?.default || (typeof window.Echo === 'function' ? window.Echo : null);
        if (!EchoCtor) return null;
        const host = window.REVERB_CONFIG?.host || window.location.hostname;
        const port = window.REVERB_CONFIG?.port || 8080;
        const scheme = window.REVERB_CONFIG?.scheme || 'http';
        window.Echo = new EchoCtor({
            broadcaster: 'reverb',
            key: echoKey,
            wsHost: host,
            wsPort: port,
            forceTLS: scheme === 'https',
            encrypted: false,
            enabledTransports: ['ws', 'wss'],
            authEndpoint: '/broadcasting/auth',
            auth: { headers: { Authorization: `Bearer ${token}` } },
        });
        return window.Echo;
    };

    const sendSignal = async (type, payload = {}, toUserId = null) => {
        const res = await fetch(`${API_URL}/lectures/${lectureId}/signal`, {
            method: 'POST',
            headers: {
                ...authHeaders(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type,
                to_user_id: toUserId,
                payload,
            }),
        });
        if (!res.ok) return false;
        return res.json();
    };

    const applyVideoStream = (videoEl, stream, muted = false) => {
        if (!videoEl || !stream) return;
        videoEl.srcObject = stream;
        videoEl.muted = muted;
        const playPromise = videoEl.play?.();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
        }
    };

    const encodeSdp = (sdp) => {
        if (!sdp) return null;
        return btoa(sdp);
    };

    const decodeSdp = (b64) => {
        if (!b64) return null;
        try {
            return atob(b64);
        } catch (e) {
            return null;
        }
    };

    const packSessionDescription = (desc) => {
        if (!desc?.sdp || !desc?.type) return desc;
        return {
            type: desc.type,
            sdp_b64: encodeSdp(desc.sdp),
        };
    };

    const sanitizeSdp = (value) => {
        if (typeof value !== 'string') return value;
        let sdp = value;
        sdp = sdp.replace(/\\\\r\\\\n/g, '\n').replace(/\\\\n/g, '\n').replace(/\\\\r/g, '\n');
        sdp = sdp.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\r/g, '\n');
        sdp = sdp.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const start = sdp.indexOf('v=0');
        if (start > 0) {
            sdp = sdp.slice(start);
        }
        sdp = sdp.split('\n').map((line) => line.trimEnd()).filter(Boolean).join('\n');
        sdp = sdp.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
        sdp = sdp.replace(/\n/g, '\r\n');
        if (!sdp.endsWith('\r\n')) {
            sdp += '\r\n';
        }
        return sdp;
    };

    const normalizeSessionDescription = (desc, fallbackType = null) => {
        let parsed = desc;
        if (typeof parsed === 'string') {
            try {
                parsed = JSON.parse(parsed);
            } catch (e) {
                parsed = { type: fallbackType || 'offer', sdp: desc };
            }
        }
        if (parsed && typeof parsed === 'object') {
            if (parsed.payload && !parsed.sdp && (parsed.payload.sdp || parsed.payload.sdp_b64)) {
                parsed = { ...parsed.payload, type: parsed.payload.type || parsed.type || fallbackType };
            }
            if (!parsed.type && fallbackType) {
                parsed = { ...parsed, type: fallbackType };
            }
            if (parsed.sdp_b64 && !parsed.sdp) {
                parsed = { ...parsed, sdp: decodeSdp(parsed.sdp_b64) };
            }
            if (typeof parsed.sdp === 'string') {
                const cleaned = sanitizeSdp(parsed.sdp);
                parsed = { ...parsed, sdp: cleaned };
            }
        }
        return parsed;
    };

    const handleSignal = async (data) => {
        if (!data) return;
        const { from_user_id, to_user_id, payload } = data;
        if (to_user_id && Number(to_user_id) !== Number(state.me?.id)) {
            return;
        }
        if (from_user_id === state.me?.id) return;

        const type = payload?.type || payload?.payload?.type;
        const inner = payload?.payload ?? payload ?? {};

        if (type === 'join') {
            ensureParticipantState(from_user_id);
            await connectToParticipant(from_user_id);
            await refreshParticipants();
            return;
        }
        if (type === 'leave') {
            removePeer(from_user_id);
            await refreshParticipants();
            return;
        }
        if (type === 'state') {
            setStateFor(from_user_id, {
                micOff: inner?.micOff === true || inner?.micOff === 'true' || inner?.micOff === 1,
                videoOff: inner?.videoOff === true || inner?.videoOff === 'true' || inner?.videoOff === 1,
            });
            updateMicIndicator(from_user_id);
            renderGrid();
            renderParticipantsList();
            return;
        }
        if (type === 'offer') {
            const pc = await ensurePeerConnection(from_user_id);
            const desc = normalizeSessionDescription(inner, 'offer');
            window.__lastOfferDebug = {
                from: from_user_id,
                to: to_user_id,
                hasSdp: !!desc?.sdp,
                hasSdpB64: !!desc?.sdp_b64,
                sdpStart: desc?.sdp ? desc.sdp.slice(0, 20) : null,
                sdpEnd: desc?.sdp ? desc.sdp.slice(-20) : null,
                sdpLen: desc?.sdp ? desc.sdp.length : 0,
            };
            if (desc?.type !== 'offer' || !desc?.sdp || !desc.sdp.startsWith('v=0')) return;
            if (pc.signalingState !== 'stable') {
                return;
            }
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(desc));
            } catch (err) {
                window.__lastBadOffer = {
                    error: String(err),
                    sdpLen: desc?.sdp?.length || 0,
                    sdpStart: desc?.sdp?.slice(0, 40),
                    sdpEnd: desc?.sdp?.slice(-40),
                    hasEscapes: desc?.sdp?.includes('\\r') || desc?.sdp?.includes('\\n'),
                };
                throw err;
            }
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal('answer', packSessionDescription(pc.localDescription), from_user_id);
            return;
        }
        if (type === 'answer') {
            const pc = state.peers.get(from_user_id)?.pc;
            if (pc) {
                const desc = normalizeSessionDescription(inner, 'answer');
                window.__lastAnswerDebug = {
                    from: from_user_id,
                    to: to_user_id,
                    hasSdp: !!desc?.sdp,
                    hasSdpB64: !!desc?.sdp_b64,
                    sdpStart: desc?.sdp ? desc.sdp.slice(0, 20) : null,
                    sdpEnd: desc?.sdp ? desc.sdp.slice(-20) : null,
                    sdpLen: desc?.sdp ? desc.sdp.length : 0,
                };
                if (desc?.type !== 'answer' || !desc?.sdp || !desc.sdp.startsWith('v=0')) return;
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(desc));
                } catch (err) {
                    window.__lastBadAnswer = {
                        error: String(err),
                        sdpLen: desc?.sdp?.length || 0,
                        sdpStart: desc?.sdp?.slice(0, 40),
                        sdpEnd: desc?.sdp?.slice(-40),
                        hasEscapes: desc?.sdp?.includes('\\r') || desc?.sdp?.includes('\\n'),
                    };
                    throw err;
                }
            }
            return;
        }
        if (type === 'ice') {
            const pc = state.peers.get(from_user_id)?.pc;
            if (pc && inner) {
                try {
                    const candidate = typeof inner === 'string' ? JSON.parse(inner) : inner;
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    // ignore
                }
            }
        }
    };

    const ensurePeerConnection = async (userId) => {
        if (state.peers.has(userId)) return state.peers.get(userId).pc;
        const pc = new RTCPeerConnection(rtcConfig);
        if (state.localStream) {
            state.localStream.getTracks().forEach((track) => {
                pc.addTrack(track, state.localStream);
            });
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal('ice', event.candidate, userId);
            }
        };
        pc.ontrack = (event) => {
            const stream = event.streams[0];
            attachRemoteStream(userId, stream);
        };

        state.peers.set(userId, { pc, stream: null });
        return pc;
    };

    const attachLocalTracksToPeers = async () => {
        if (!state.localStream || !state.me?.id) return;
        const tracks = state.localStream.getTracks();
        for (const [userId, peer] of state.peers.entries()) {
            const pc = peer?.pc;
            if (!pc) continue;
            const senders = pc.getSenders();
            let added = false;
            tracks.forEach((track) => {
                const hasSender = senders.some((sender) => sender.track && sender.track.kind === track.kind);
                if (!hasSender) {
                    pc.addTrack(track, state.localStream);
                    added = true;
                }
            });
            if (added && Number(state.me.id) < Number(userId)) {
                if (pc.signalingState === 'stable') {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    await sendSignal('offer', packSessionDescription(pc.localDescription), userId);
                }
            }
        }
    };

    const ensureParticipantState = (userId) => {
        const key = keyFor(userId);
        if (!state.participantStates.has(key)) {
            state.participantStates.set(key, { micOff: false, videoOff: false });
        }
    };

    const reattachPeerStreams = () => {
        const creatorId = state.lecture?.creator_id;
        state.peers.forEach((peer, userId) => {
            if (!peer?.stream) return;
            if (creatorId && Number(userId) === Number(creatorId) && Number(state.me?.id) !== Number(creatorId)) {
                if (mainVideo && mainVideo.srcObject !== peer.stream) {
                    applyVideoStream(mainVideo, peer.stream, false);
                }
                return;
            }
            const tile = gridEl.querySelector(`[data-user-id="${userId}"] video`);
            if (tile && tile.srcObject !== peer.stream) {
                applyVideoStream(tile, peer.stream, false);
            }
        });
    };

    const connectToParticipant = async (userId) => {
        if (Number(userId) === Number(state.me?.id)) return;
        const existing = state.peers.get(userId);
        if (existing?.offerSent) {
            return;
        }
        const pc = await ensurePeerConnection(userId);
        if (state.me?.id && state.me.id < userId) {
            if (pc.signalingState !== 'stable') {
                return;
            }
            if (pc.localDescription || pc.remoteDescription) {
                return;
            }
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await sendSignal('offer', packSessionDescription(pc.localDescription), userId);
            const peer = state.peers.get(userId);
            if (peer) {
                peer.offerSent = true;
            }
        }
    };

    const attachRemoteStream = (userId, stream) => {
        const peer = state.peers.get(userId);
        if (peer) peer.stream = stream;
        const creatorId = state.lecture?.creator_id;
        if (creatorId && Number(userId) === Number(creatorId) && Number(state.me?.id) !== Number(creatorId)) {
            if (mainVideo && mainVideo.srcObject !== stream) {
                applyVideoStream(mainVideo, stream, false);
            }
            const creator = state.participants.find((p) => p.id === creatorId);
            if (creator) {
                setMainTile(creator);
            }
            return;
        }
        const tile = gridEl.querySelector(`[data-user-id="${userId}"] video`);
        if (tile && tile.srcObject !== stream) {
            applyVideoStream(tile, stream, false);
        }
        setupAudioAnalyser(userId, stream);
    };

    const attachLocalStreamToGrid = () => {
        if (!state.localStream) return;
        const creatorId = state.lecture?.creator_id;
        if (Number(state.me?.id) === Number(creatorId)) return;
        const tile = gridEl.querySelector(`[data-user-id="${state.me?.id}"] video`);
        if (tile && tile.srcObject !== state.localStream) {
            applyVideoStream(tile, state.localStream, true);
        }
    };

    const removePeer = (userId) => {
        const peer = state.peers.get(userId);
        if (peer?.pc) {
            peer.pc.close();
        }
        state.peers.delete(userId);
        const video = gridEl.querySelector(`[data-user-id="${userId}"] video`);
        if (video) {
            video.srcObject = null;
        }
    };

    const initMedia = async () => {
        try {
            state.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (e) {
            try {
                state.localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                if (videoBtn) {
                    videoBtn.disabled = true;
                    videoBtn.title = 'Camera unavailable';
                }
            } catch (err) {
                alert('Не удалось получить доступ к микрофону.');
                return;
            }
        }

        const isCreator = Number(state.me?.id) === Number(state.lecture?.creator_id);
        if (mainVideo && isCreator) {
            applyVideoStream(mainVideo, state.localStream, true);
        }
        if (!isCreator) {
            attachLocalStreamToGrid();
        }
        if (state.me?.id) {
            setupAudioAnalyser(state.me.id, state.localStream);
        }
        const hasVideo = state.localStream.getVideoTracks().length > 0;
        const micOff = !(state.localStream.getAudioTracks()?.[0]?.enabled ?? false);
        setStateFor(state.me?.id, { videoOff: !hasVideo, micOff });
        await attachLocalTracksToPeers();
    };

    const updateTimer = () => {
        if (!state.lecture?.ends_at) return;
        const now = new Date();
        const ends = new Date(state.lecture.ends_at);
        const diff = Math.floor((ends - now) / 1000);
        timerEl.textContent = `До конца лекции: ${formatTime(diff)}`;
        if (state.me?.id === state.lecture.creator_id && diff <= 300 && diff > 0) {
            warningEl.hidden = false;
        }
    };

    const fetchLecture = async () => {
        const res = await fetch(`${API_URL}/lectures/${lectureId}`, { headers: authHeaders() });
        if (!res.ok) return null;
        return res.json();
    };

    const fetchMe = async () => {
        const res = await fetch(`${API_URL}/me`, { headers: authHeaders() });
        if (!res.ok) return null;
        return res.json();
    };

    const fetchParticipants = async () => {
        const res = await fetch(`${API_URL}/lectures/${lectureId}/participants`, { headers: authHeaders() });
        if (!res.ok) return [];
        return res.json();
    };

    const joinLecture = async () => {
        await fetch(`${API_URL}/lectures/${lectureId}/join`, {
            method: 'POST',
            headers: authHeaders(),
        });
    };

    const kickUser = async (userId) => {
        await fetch(`${API_URL}/lectures/${lectureId}/kick`, {
            method: 'POST',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId }),
        });
        await refreshParticipants();
    };

    const banUser = async (userId, reason) => {
        await fetch(`${API_URL}/lectures/${lectureId}/ban`, {
            method: 'POST',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, reason }),
        });
        await refreshParticipants();
    };

    const reportUser = async (userId, text) => {
        await fetch(`${API_URL}/reports/users`, {
            method: 'POST',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ reported_user_id: userId, lecture_id: Number(lectureId), body: text }),
        });
    };

    const reportLecture = async (text) => {
        await fetch(`${API_URL}/reports/lectures`, {
            method: 'POST',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ lecture_id: Number(lectureId), body: text }),
        });
    };

    const refreshParticipants = async () => {
        state.participants = await fetchParticipants();
        state.participants.forEach((p) => ensureParticipantState(p.id));
        renderAvatars();
        renderGrid();
        renderParticipantsList();
        const creator = state.participants.find((p) => p.id === state.lecture?.creator_id);
        if (creator) {
            setMainTile(creator);
        }
        await connectToAll(false);
        syncMicIndicators();
    };

    const initEcho = () => {
        const echo = ensureEcho();
        if (!echo) return;
        echo.private(`lecture.${lectureId}`).listen('.LectureSignal', (event) => {
            let payload = event;
            if (typeof payload === 'string') {
                try {
                    payload = JSON.parse(payload);
                } catch (e) {
                    return;
                }
            }
            if (payload?.data && typeof payload.data === 'string') {
                try {
                    payload = JSON.parse(payload.data);
                } catch (e) {
                    payload = payload.data;
                }
            }
            handleSignal(payload);
        });
        if (state.chatGroupId) {
            echo.private(`group-chat.${state.chatGroupId}`)
                .listen('.GroupChatMessageSent', (event) => {
                    const message = event?.message ? { ...event.message, sender: event.sender } : event?.message;
                    if (!message || Number(message.chat_group_id) !== Number(state.chatGroupId)) return;
                    if (Number(message.sender_id) === Number(state.me?.id)) return;
                    const exists = state.chatMessages.some((m) => String(m.id) === String(message.id));
                    if (exists) return;
                    state.chatMessages.push(message);
                    if (state.viewMode === 'chat') {
                        appendChatMessage(message);
                    }
                });
        }
    };

    const connectToAll = async (sendJoin = false) => {
        for (const participant of state.participants) {
            if (participant.id === state.me?.id) continue;
            await connectToParticipant(participant.id);
        }
        if (sendJoin) {
            await sendSignal('join', { user_id: state.me?.id });
        }
    };

    const hidePanel = (panel) => {
        if (!panel) return;
        panel.hidden = true;
        panel.classList.add('is-hidden');
    };

    const showPanel = (panel) => {
        if (!panel) return;
        panel.hidden = false;
        panel.classList.remove('is-hidden');
    };

    const toggleView = (mode) => {
        state.viewMode = mode;
        if (mode === 'list') {
            showPanel(participantsPanel);
            hidePanel(chatPanel);
        } else if (mode === 'chat') {
            showPanel(chatPanel);
            hidePanel(participantsPanel);
        } else {
            hidePanel(participantsPanel);
            hidePanel(chatPanel);
        }
    };

    const fetchChatMessages = async () => {
        if (!state.chatGroupId) return [];
        const res = await fetch(`${API_URL}/group-chats/${state.chatGroupId}/messages`, { headers: authHeaders() });
        if (!res.ok) return [];
        return res.json();
    };

    const sendChatMessage = async (text) => {
        if (!state.chatGroupId) return false;
        const res = await fetch(`${API_URL}/group-chats/${state.chatGroupId}/messages`, {
            method: 'POST',
            headers: { ...authHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: text }),
        });
        if (!res.ok) return false;
        return res.json();
    };

    const ensureChatBar = () => {
        if (!chatInputWrapper || chatInputWrapper.classList.contains('lecture-chat-bar')) return;
        chatInputWrapper.classList.remove('lecture-chat-input');
        chatInputWrapper.classList.add('lecture-chat-bar');
        chatInputWrapper.innerHTML = '';

        const makeTool = (icon, title) => {
            const btn = document.createElement('button');
            btn.className = 'lecture-chat-tool';
            btn.type = 'button';
            btn.title = title;
            btn.innerHTML = `<i class="${icon}"></i>`;
            return btn;
        };

        const attachBtn = makeTool('fa-solid fa-paperclip', 'Attach');
        const emojiBtnLocal = makeTool('fa-regular fa-face-smile', 'Emoji');
        const micBtnLocal = makeTool('fa-solid fa-microphone', 'Mic');

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'lectureChatInput';
        input.placeholder = 'Message...';

        const sendBtn = document.createElement('button');
        sendBtn.className = 'lecture-chat-send';
        sendBtn.id = 'lectureChatSend';
        sendBtn.type = 'button';
        sendBtn.title = 'Send';
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';

        chatInputWrapper.append(attachBtn, input, emojiBtnLocal, micBtnLocal, sendBtn);
    };

    const formatChatTime = (value) => {
        if (!value) return '';
        const created = new Date(value);
        if (Number.isNaN(created.getTime())) return '';
        const diffSec = Math.max(0, Math.floor((Date.now() - created.getTime()) / 1000));
        if (diffSec < 60) return `${diffSec} sec`;
        const mins = Math.floor(diffSec / 60);
        return `${mins} min`;
    };

    const buildChatItem = (msg) => {
        const isMine = msg.sender_id === state.me?.id;
        const name = isMine ? 'You' : (msg.sender?.name || 'User');
        const time = formatChatTime(msg.created_at);
        const avatar = resolveAvatar(msg.sender?.avatar);
        const bubble = document.createElement('div');
        bubble.className = `lecture-chat-item ${isMine ? 'is-mine' : 'is-other'}`;

        if (!isMine) {
            const avatarEl = document.createElement('img');
            avatarEl.className = 'lecture-chat-avatar';
            avatarEl.src = avatar;
            avatarEl.alt = name;
            bubble.appendChild(avatarEl);
        }

        const content = document.createElement('div');
        content.className = 'lecture-chat-bubble';
        content.innerHTML = `
            <div class="lecture-chat-meta">
                <span class="lecture-chat-name">${name}</span>
                ${time ? `<span class="lecture-chat-time">${time}</span>` : ''}
            </div>
            <div class="lecture-chat-text">${msg.body || ''}</div>
        `;

        bubble.appendChild(content);
        return bubble;
    };

    const appendChatMessage = (msg) => {
        if (!chatMessages) return;
        if (msg?.id !== undefined && state.chatMessageIds.has(String(msg.id))) {
            return;
        }
        if (msg?.id !== undefined) {
            state.chatMessageIds.add(String(msg.id));
        }
        chatMessages.appendChild(buildChatItem(msg));
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const renderChat = async () => {
        const messages = await fetchChatMessages();
        state.chatMessages = messages || [];
        state.chatMessageIds = new Set();
        chatMessages.innerHTML = '';
        state.chatMessages.forEach((msg) => appendChatMessage(msg));
    };

    const initControls = () => {
        backBtn?.addEventListener('click', () => {
            window.location.href = '/news';
        });
        shareBtn?.addEventListener('click', async () => {
            await navigator.clipboard.writeText(window.location.href);
            alert('Ссылка скопирована');
        });
        moreBtn?.addEventListener('click', () => toggleView('list'));
        participantsClose?.addEventListener('click', () => toggleView('grid'));
        chatBtn?.addEventListener('click', async () => {
            ensureChatBar();
            await renderChat();
            toggleView('chat');
        });
        chatClose?.addEventListener('click', (event) => {
            event.preventDefault();
            toggleView('grid');
        });
        const handleChatSend = async () => {
            const inputEl = document.getElementById('lectureChatInput');
            const text = inputEl?.value.trim() || '';
            if (!text) return;
            if (inputEl) inputEl.value = '';
            const created = await sendChatMessage(text);
            if (created && created.id) {
                const msg = created.sender ? created : { ...created, sender: state.me };
                if (!state.chatMessageIds.has(String(msg.id))) {
                    state.chatMessages.push(msg);
                    appendChatMessage(msg);
                }
                return;
            }
            await renderChat();
        };

        chatSend?.addEventListener('click', handleChatSend);
        chatInputWrapper?.addEventListener('click', (event) => {
            const target = event.target;
            if (target && (target.id === 'lectureChatSend' || target.closest('#lectureChatSend'))) {
                handleChatSend();
            }
        });
        chatInputWrapper?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            const target = event.target;
            if (target && target.id === 'lectureChatInput') {
                event.preventDefault();
                handleChatSend();
            }
        });

        micBtn?.addEventListener('click', async () => {
            if (!state.localStream) return;
            state.localStream.getAudioTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            const micOff = !(state.localStream.getAudioTracks()[0]?.enabled);
            setStateFor(state.me?.id, { micOff });
            mainMic.hidden = !micOff;
            updateMicIndicator(state.me?.id);
            renderGrid();
            renderParticipantsList();
            await sendSignal('state', { micOff });
        });

        videoBtn?.addEventListener('click', async () => {
            if (!state.localStream) return;
            state.localStream.getVideoTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            const videoOff = !(state.localStream.getVideoTracks()[0]?.enabled);
            setStateFor(state.me?.id, { videoOff });
            renderGrid();
            renderParticipantsList();
            await sendSignal('state', { videoOff });
        });

        endBtn?.addEventListener('click', async () => {
            if (!confirm('Завершить трансляцию?')) return;
            await fetch(`${API_URL}/lectures/${lectureId}/end`, {
                method: 'POST',
                headers: authHeaders(),
            });
        });

        archiveBtn?.addEventListener('click', async () => {
            await fetch(`${API_URL}/lectures/${lectureId}`, {
                method: 'PATCH',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'archived' }),
            });
        });

        leaveBtn?.addEventListener('click', async () => {
            if (state.me?.id === state.lecture?.creator_id) {
                const ok = confirm('Вы создатель лекции. При выходе лекция завершится через 5 минут. Продолжить?');
                if (!ok) return;
            }
            await fetch(`${API_URL}/lectures/${lectureId}/leave`, {
                method: 'POST',
                headers: authHeaders(),
            });
            await sendSignal('leave', { user_id: state.me?.id });
            window.location.href = '/news';
        });

        reportBtn?.addEventListener('click', async () => {
            const text = prompt('Опишите жалобу на трансляцию:') || '';
            if (!text) return;
            await reportLecture(text);
            alert('Жалоба отправлена.');
        });

        emojiBtn?.addEventListener('click', () => {
            alert('Эмодзи будут добавлены позже.');
        });
    };

    const init = async () => {
        hidePanel(chatPanel);
        hidePanel(participantsPanel);
        toggleView('grid');
        const token = getToken();
        if (!token) {
            alert('Требуется авторизация.');
            return;
        }

        window.__lectureState = state;
        state.me = await fetchMe();
        state.lecture = await fetchLecture();
        if (!state.lecture) return;

        titleEl.textContent = state.lecture.title || 'Лекция';
        hostAvatarEl.src = resolveAvatar(state.lecture.creator?.avatar);
        hostNameEl.textContent = getFullName(state.lecture.creator);
        state.chatGroupId = state.lecture.chat_group?.id || null;
        const canManage = state.me?.id === state.lecture.creator_id || state.me?.global_role === 'admin';
        if (endBtn) endBtn.disabled = !canManage;
        if (archiveBtn) {
            archiveBtn.disabled = !(canManage && state.lecture.status === 'ended');
        }

        await joinLecture();
        state.participants = await fetchParticipants();
        state.participants.forEach((p) => ensureParticipantState(p.id));
        renderAvatars();
        renderGrid();
        renderParticipantsList();

        const creator = state.participants.find((p) => p.id === state.lecture?.creator_id);
        if (creator) {
            setMainTile(creator);
        }

        await initMedia();
        if (state.me?.id) {
            const micOff = !(state.localStream?.getAudioTracks()?.[0]?.enabled ?? false);
            const videoOff = !(state.localStream?.getVideoTracks()?.[0]?.enabled ?? false);
            setStateFor(state.me.id, { micOff, videoOff });
        }
        initEcho();
        await connectToAll(true);
        initControls();
        updateTimer();
        setInterval(updateTimer, 1000);
        setInterval(updateActiveSpeaker, 2000);
    };

    const setupAudioAnalyser = (userId, stream) => {
        if (!stream || audioAnalysers.has(userId)) return;
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = context.createAnalyser();
            analyser.fftSize = 512;
            const source = context.createMediaStreamSource(stream);
            source.connect(analyser);
            audioAnalysers.set(userId, { context, analyser });
        } catch (e) {
            // ignore
        }
    };

    const updateActiveSpeaker = () => {
        let bestId = null;
        let bestLevel = 0;

        audioAnalysers.forEach((value, userId) => {
            const data = new Uint8Array(value.analyser.frequencyBinCount);
            value.analyser.getByteFrequencyData(data);
            const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
            if (avg > bestLevel) {
                bestLevel = avg;
                bestId = userId;
            }
        });

        if (!bestId) return;
        state.activeSpeakerId = Number(bestId);
        updateActiveSpeakerUI();
    };

    const updateActiveSpeakerUI = () => {
        const mainShell = document.querySelector('#lectureMainTile .lecture-video-shell');
        if (mainShell && state.me?.id === state.activeSpeakerId) {
            mainShell.classList.add('active');
        } else if (mainShell) {
            mainShell.classList.remove('active');
        }
        gridEl.querySelectorAll('.lecture-video-shell').forEach((shell) => {
            const id = Number(shell.dataset.userId);
            if (id === state.activeSpeakerId) {
                shell.classList.add('active');
            } else {
                shell.classList.remove('active');
            }
        });
    };

    init();
});
