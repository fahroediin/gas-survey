const API_BASE = "/api";

// 1. Auto Logout saat Refresh
localStorage.clear();

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('loginModal').classList.remove('hidden');
    // 2. Load Judul & Logo (Public) dengan Skeleton
    loadPublicSettings();
});

// --- LOAD PUBLIC SETTINGS (SKELETON HANDLER) ---
async function loadPublicSettings() {
    const titleEl = document.getElementById('loginTitleText');

    try {
        const response = await fetch(`${API_BASE}/proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getSettings' })
        });

        const result = await response.json();

        if (result && result.status === 'success') {
            const s = result.settings;

            // Update Data Halaman Utama
            document.title = s.pageTitle;
            document.getElementById('pageTitle').textContent = s.pageTitle;
            document.getElementById('companyName').textContent = s.companyName;
            document.getElementById('footerText').textContent = `${s.footerText} @ ${s.companyName}`;

            // Update Judul Login
            titleEl.textContent = s.loginTitle || "Login Intern";

            // HAPUS SEMUA SKELETON SETELAH DATA SIAP
            setTimeout(() => {
                const skeletons = document.querySelectorAll('#loginModal .skeleton');
                skeletons.forEach(el => {
                    el.classList.remove('skeleton', 'skeleton-text');
                    // Reset inline width pada label
                    if (el.tagName === 'LABEL') el.style.width = '';
                });
            }, 500);
        }
    } catch (error) {
        console.error("Gagal memuat settings:", error);
        titleEl.textContent = "Survey App";
        // Fallback remove skeleton
        const skeletons = document.querySelectorAll('#loginModal .skeleton');
        skeletons.forEach(el => el.classList.remove('skeleton', 'skeleton-text'));
    }
}

// --- LOGIN HANDLER (PROGRESS BAR) ---
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');
    const btn = this.querySelector('button');
    const progressBar = document.getElementById('loginProgressBar');

    // UI State: Loading
    btn.disabled = true;
    btn.textContent = "Memproses...";
    errorMsg.textContent = "";
    progressBar.classList.remove('hidden'); // Tampilkan Progress Bar

    try {
        // 1. Login
        const loginResponse = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const loginResult = await loginResponse.json();

        if (!loginResponse.ok || loginResult.status !== 'success') {
            throw new Error(loginResult.message || "Login gagal.");
        }

        localStorage.setItem('internToken', loginResult.token);
        localStorage.setItem('userData', JSON.stringify(loginResult.user));

        // 2. Load Questions
        const qData = await fetchQuestionsInternal(loginResult.token);
        if (!qData) throw new Error("Gagal memuat pertanyaan.");

        renderQuestions(qData.questions);

        // Sukses
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('mainContainer').classList.remove('hidden');

    } catch (err) {
        errorMsg.textContent = err.message;
        localStorage.clear();
    } finally {
        btn.disabled = false;
        btn.textContent = "Masuk";
        progressBar.classList.add('hidden'); // Sembunyikan Progress Bar
    }
});

async function fetchQuestionsInternal(token) {
    try {
        const response = await fetch(`${API_BASE}/proxy`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'getQuestions' })
        });
        if (!response.ok) return null;
        const result = await response.json();
        return (result.status === 'success') ? result : null;
    } catch (e) { throw e; }
}

function renderQuestions(questions) {
    const container = document.getElementById('dynamicFormContainer');
    container.innerHTML = '';

    let currentSection = '';
    let sectionDiv = null;
    let questionCounter = 1;

    questions.forEach((q, index) => {
        if (q.section && q.section !== currentSection) {
            currentSection = q.section;
            sectionDiv = document.createElement('div');
            sectionDiv.className = 'section';

            const title = document.createElement('h2');
            title.className = 'section-title';
            title.textContent = currentSection;
            sectionDiv.appendChild(title);
            container.appendChild(sectionDiv);
        }

        const target = sectionDiv || container;
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        let labelText = q.label;
        if (q.type.toLowerCase() !== 'header') {
            labelText = `${questionCounter}. ${q.label}`;
            questionCounter++;
        }

        const label = document.createElement('label');
        label.innerHTML = `${labelText} ${q.required ? '<span class="required">*</span>' : ''}`;

        if (q.type.toLowerCase() === 'header') {
            label.style.fontWeight = 'bold';
            label.style.marginTop = '15px';
            label.style.color = '#4a69bd';
        }
        formGroup.appendChild(label);

        let input;
        const inputName = `q_${index}`;

        switch (q.type.toLowerCase()) {
            case 'text':
                input = document.createElement('input');
                input.type = 'text';
                input.name = q.label;
                if (q.required) input.required = true;
                if (q.label.toLowerCase().includes('nama')) {
                    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                    if (userData.name) {
                        input.value = userData.name;
                        input.readOnly = true;
                    }
                }
                break;
            case 'textarea':
                input = document.createElement('textarea');
                input.name = q.label;
                if (q.required) input.required = true;
                break;
            case 'scale':
                input = document.createElement('div');
                input.className = 'scale-group';
                for (let i = 1; i <= 5; i++) {
                    const optionDiv = document.createElement('div');
                    optionDiv.className = 'scale-option';
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = q.label;
                    radio.value = i;
                    radio.id = `${inputName}_${i}`;
                    if (q.required) radio.required = true;
                    const radioLabel = document.createElement('label');
                    radioLabel.htmlFor = `${inputName}_${i}`;
                    radioLabel.textContent = i;
                    optionDiv.appendChild(radio);
                    optionDiv.appendChild(radioLabel);
                    input.appendChild(optionDiv);
                }
                break;
            case 'radio':
                input = document.createElement('div');
                input.className = 'radio-group';
                q.options.forEach((opt) => {
                    const labelOpt = document.createElement('label');
                    labelOpt.className = 'radio-option';
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = q.label;
                    radio.value = opt.trim();
                    if (q.required) radio.required = true;
                    const textSpan = document.createElement('span');
                    textSpan.textContent = opt.trim();
                    labelOpt.appendChild(radio);
                    labelOpt.appendChild(textSpan);
                    input.appendChild(labelOpt);
                });
                break;
            case 'checkbox':
                input = document.createElement('div');
                input.className = 'checkbox-group';
                q.options.forEach((opt, optIndex) => {
                    const labelOpt = document.createElement('label');
                    labelOpt.className = 'checkbox-option';
                    labelOpt.style.display = 'flex';
                    labelOpt.style.alignItems = 'center';
                    labelOpt.style.gap = '8px';
                    labelOpt.style.marginBottom = '8px';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.name = q.label;
                    checkbox.value = opt.trim();
                    checkbox.id = `${inputName}_${optIndex}`;

                    const textSpan = document.createElement('span');
                    textSpan.textContent = opt.trim();

                    labelOpt.appendChild(checkbox);
                    labelOpt.appendChild(textSpan);
                    input.appendChild(labelOpt);
                });
                break;
            case 'header': input = null; break;
        }

        if (input) formGroup.appendChild(input);
        target.appendChild(formGroup);
    });
}

// --- SUBMIT HANDLER ---
document.getElementById('feedbackForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const globalLoading = document.getElementById('globalLoading');

    btn.disabled = true;
    globalLoading.classList.remove('hidden');

    const formData = new FormData(this);
    const answers = {};
    for (let [key, value] of formData.entries()) {
        if (answers[key]) {
            answers[key] += `, ${value}`;
        } else {
            answers[key] = value;
        }
    }

    const payload = { action: 'submit', answers: answers };

    try {
        const token = localStorage.getItem('internToken');
        const response = await fetch(`${API_BASE}/proxy`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.clear();
            location.reload();
            return;
        }

        const result = await response.json();
        globalLoading.classList.add('hidden');
        if (result && result.status === 'success') {
            alert("Terima kasih! Feedback Anda berhasil disimpan.");
            window.location.reload();
        } else {
            alert("Gagal: " + (result ? result.message : "Unknown error"));
        }
    } catch (err) {
        globalLoading.classList.add('hidden');
        alert("Error jaringan saat mengirim feedback.");
    } finally {
        btn.disabled = false;
    }
});