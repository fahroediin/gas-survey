const API_BASE = "/api";

// 1. Auto Logout saat Refresh
localStorage.clear();

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loginModal').classList.remove('hidden');
    // 2. Load Judul & Logo (Public)
    loadPublicSettings();
});

// --- LOAD PUBLIC SETTINGS ---
async function loadPublicSettings() {
    try {
        const response = await fetch(`${API_BASE}/proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getSettings' })
        });

        const result = await response.json();
        
        if (result && result.status === 'success') {
            const s = result.settings;
            document.title = s.pageTitle;
            document.getElementById('pageTitle').textContent = s.pageTitle;
            document.getElementById('companyName').textContent = s.companyName;
            document.getElementById('footerText').textContent = `${s.footerText} @ ${s.companyName}`;
            document.getElementById('loginTitleText').textContent = s.loginTitle || "Login Intern";
        }
    } catch (error) {
        console.error("Gagal memuat settings:", error);
        document.getElementById('loginTitleText').textContent = "Survey App";
    }
}

// --- LOGIN HANDLER ---
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');
    const btn = this.querySelector('button');

    btn.disabled = true;
    btn.textContent = "Memuat...";
    errorMsg.textContent = "";

    try {
        // A. Login
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

        // B. Load Questions (Private)
        const qData = await fetchQuestionsInternal(loginResult.token);
        if (!qData) throw new Error("Gagal memuat pertanyaan.");

        renderQuestions(qData.questions);
        
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('mainContainer').classList.remove('hidden');

    } catch (err) {
        errorMsg.textContent = err.message;
        localStorage.clear();
    } finally {
        btn.disabled = false;
        btn.textContent = "Masuk";
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

// --- RENDER FORM ---
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
            case 'header': input = null; break;
        }

        if (input) formGroup.appendChild(input);
        target.appendChild(formGroup);
    });
}

// --- SUBMIT HANDLER ---
document.getElementById('feedbackForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const globalLoading = document.getElementById('globalLoading');
    
    btn.disabled = true;
    globalLoading.classList.remove('hidden');

    const formData = new FormData(this);
    const answers = {};
    for (let [key, value] of formData.entries()) {
        answers[key] = value;
    }

    const payload = { action: 'submit', answers: answers };

    try {
        const result = await fetchWithAuth(payload);
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

async function fetchWithAuth(payload) {
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
        return null;
    }
    return response.json();
}