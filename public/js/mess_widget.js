const messagesApi = {
    async getInbox() {
        const res = await fetch(`${API_URL}/messages/inbox`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });

        if (!res.ok) throw new Error("Ошибка загрузки чатов");
        return await res.json();
    },
};

const chatsContainer = document.getElementById("chatsListContainer");

function renderChats(chats) {
    if (!chatsContainer) return;

    chatsContainer.innerHTML = "";

    if (!chats.length) {
        chatsContainer.innerHTML = `
            <div style="text-align:center; padding:12px; font-size:12px; color:#8aa3c2;">
                Нет сообщений
            </div>
        `;
        return;
    }

    chats.forEach((chat) => {
        const user = chat.user;
        const last = chat.last_message;

        const item = document.createElement("div");
        item.className = "chat-item";

        item.innerHTML = `
            <div class="chat-avatar"
                 style="background-image:url('${user.avatar || ""}');
                        background-size:cover;
                        background-position:center;">
            </div>

            <div class="chat-content">
                <div class="chat-name">${user.name}</div>
                <div class="chat-last">
                    ${last.body || "📎 Вложение"}
                </div>
            </div>

            <div class="chat-meta">
                <span>
                    ${new Date(last.created_at).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </span>
                <i class="fa-solid fa-arrow-down"></i>
            </div>
        `;

        item.addEventListener("click", () => {
            window.location.href = `/messages/${user.id}`;
        });

        chatsContainer.appendChild(item);
    });
}

async function loadChats() {
    try {
        const data = await messagesApi.getInbox();
        const chats = Array.isArray(data) ? data : data.data || [];
        renderChats(chats);
    } catch (e) {
        console.error(e);
    }
}

initUser();
loadFeed("all");
loadChats();

window.Echo.private(`messages.${currentUserId}`).listen(".MessageSent", () => {
    loadChats();
});
