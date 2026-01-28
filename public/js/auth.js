// public/js/auth.js

const API_URL = "/api";

function switchTab(target) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach((f) => f.classList.remove("active"));

    if (target === "login") {
        document.querySelectorAll(".tab")[0].classList.add("active");
        document.getElementById("loginForm").classList.add("active");
    } else {
        document.querySelectorAll(".tab")[1].classList.add("active");
        document.getElementById("registerForm").classList.add("active");
    }
}

function setFormError(form, message) {
    const box = form.querySelector(".auth-error");
    if (!box) return;
    if (!message) {
        box.textContent = "";
        box.style.display = "none";
        return;
    }
    box.textContent = message;
    box.style.display = "block";
}

function fillDatalist(id, items) {
    const list = document.getElementById(id);
    if (!list) return;
    list.innerHTML = "";
    (items || []).forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        list.appendChild(option);
    });
}

function fillSelect(id, items, placeholder, enabled = true) {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.disabled = true;
    empty.selected = true;
    empty.textContent = placeholder;
    select.appendChild(empty);
    (items || []).forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
    select.disabled = !enabled;
}

async function loadDirectoryLists() {
    try {
        const [citiesRes, eduRes, specRes, posRes, catRes] = await Promise.all([
            fetch(`${API_URL}/directory/cities`),
            fetch(`${API_URL}/directory/educations`),
            fetch(`${API_URL}/directory/departments`),
            fetch(`${API_URL}/directory/positions`),
            fetch(`${API_URL}/directory/categories`),
        ]);

        if (citiesRes.ok) fillSelect("citySelect", await citiesRes.json(), "Город", true);
        if (eduRes.ok) fillSelect("educationSelect", await eduRes.json(), "ВУЗ / образование *", true);
        if (specRes.ok) {
            const items = await specRes.json();
            fillSelect("specialitySelect", items, "Специальность *", true);
            fillDatalist("specialityList", items);
        }
        if (posRes.ok) fillSelect("positionSelect", await posRes.json(), "Должность", true);
        if (catRes.ok) fillSelect("categorySelect", await catRes.json(), "Категория", true);

        fillSelect("workPlaceSelect", [], "Сначала выберите город", false);
        fillSelect("secondaryWorkPlaceSelect", [], "Сначала выберите город", false);
    } catch (e) {
        // ignore directory load errors
    }
}

async function loadWorkPlacesByCity(city) {
    if (!city) {
        fillSelect("workPlaceSelect", [], "Сначала выберите город", false);
        fillSelect("secondaryWorkPlaceSelect", [], "Сначала выберите город", false);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/directory/work-places?city=${encodeURIComponent(city)}`);
        if (!res.ok) return;
        const items = await res.json();
        fillSelect("workPlaceSelect", items, "Место работы *", true);
        fillSelect("secondaryWorkPlaceSelect", items, "Доп. место работы", true);
    } catch (e) {
        // ignore
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadDirectoryLists();
    const citySelect = document.getElementById("citySelect");
    if (citySelect) {
        citySelect.addEventListener("change", () => {
            loadWorkPlacesByCity(citySelect.value);
        });
    }

    const toggle = document.getElementById("toggleSecondaryWork");
    const fields = document.getElementById("secondaryWorkFields");
    if (toggle && fields) {
        const sync = () => {
            if (toggle.checked) {
                fields.style.display = "block";
            } else {
                fields.style.display = "none";
                const sel = fields.querySelector("#secondaryWorkPlaceSelect");
                if (sel) sel.value = "";
                const spec = fields.querySelector("input[name=\"secondary_speciality\"]");
                if (spec) spec.value = "";
            }
        };
        toggle.addEventListener("change", sync);
        sync();
    }
});

async function handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    const originalText = btn.innerText;

    setFormError(e.target, "");
    btn.disabled = true;
    btn.innerText = "Вход...";

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem("auth_token", result.token);
            window.location.href = "/news";
        } else {
            setFormError(e.target, result.message || "Ошибка входа");
        }
    } catch (error) {
        setFormError(e.target, "Ошибка соединения с сервером");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    const originalText = btn.innerText;

    setFormError(e.target, "");
    btn.disabled = true;
    btn.innerText = "Создание аккаунта...";

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    for (const key in data) {
        if (data[key] === "") data[key] = null;
    }

    if (data.work_experience) {
        data.work_experience = Number(data.work_experience);
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem("auth_token", result.token);
            alert("Регистрация успешна!");
            window.location.href = "/news";
        } else {
            if (result.errors) {
                let msg = "Ошибки заполнения:\n";
                for (let key in result.errors) {
                    msg += `- ${result.errors[key][0]}\n`;
                }
                setFormError(e.target, msg.trim());
            } else {
                setFormError(e.target, result.message || "Ошибка регистрации");
            }
        }
    } catch (error) {
        setFormError(e.target, "Ошибка соединения с сервером");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}
