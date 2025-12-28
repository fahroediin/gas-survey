const API_BASE = "/api";

// POIN 2: Hapus memory setiap kali refresh halaman
// Ini memaksa user login ulang setiap kali reload
localStorage.clear();

document.addEventListener('DOMContentLoaded', function() {
    // Karena di-clear di awal, kita langsung tampilkan modal login
    document.getElementById('loginModal').classList.remove('hidden');
});

// --- LOGIN & PRELOAD DATA HANDLER (POIN 1) ---

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');
    const btn = this.querySelector('button');

    // UI Loading State
    btn.disabled = true;
    btn.textContent = "Memuat Data..."; // Indikasi sedang loading data juga
    errorMsg.textContent = "";

    try {
        // LANGKAH 1: Login untuk dapat Token
        const loginResponse = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        const loginResult = await loginResponse.json();

        if (!loginResponse.ok || loginResult.status !== 'success') {
            throw new Error(loginResult.message || "Login gagal.");
        }

        // Simpan Token sementara
        localStorage.setItem('internToken', loginResult.token);
        localStorage.setItem('userData', JSON.stringify(loginResult.user));

        // LANGKAH 2: Langsung Load Config/Pertanyaan (Preload)
        // Kita panggil fungsi fetchConfig internal di sini sebelum menutup modal
        const configData = await fetchConfigInternal(loginResult.token);
        
        if (!configData) {
            throw new Error("Gagal memuat formulir.");
        }

        // LANGKAH 3: Render & Tampilkan UI Utama
        setupUI(configData);
        
        // Sembunyikan Modal Login & Tampilkan Kontainer Utama
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('mainContainer').classList.remove('hidden');

    } catch (err) {
        console.error(err);
        errorMsg.textContent = err.message || "Terjadi kesalahan koneksi.";
        // Jika gagal di tengah jalan, hapus token agar bersih
        localStorage.clear();
    } finally {
        btn.disabled = false;
        btn.textContent = "Masuk";
    }
});

// Fungsi Fetch Config (Dipisahkan agar bisa dipanggil saat login)
async function fetchConfigInternal(token) {
    try {
        const response = await fetch(`${API_BASE}/proxy`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'getConfig' })
        });

        if (!response.ok) return null;
        
        const result = await response.json();
        if (result.status === 'success') {
            return result;
        }
        return null;
    } catch (e) {
        throw e;
    }
}

// Fungsi Setup UI setelah data didapat
function setupUI(result) {
    // 1. Set Info Perusahaan
    document.title = result.settings.pageTitle;
    document.getElementById('pageTitle').textContent = result.settings.pageTitle;
    document.getElementById('companyName').textContent = result.settings.companyName;
    document.getElementById('footerText').textContent = `${result.settings.footerText} @ ${result.settings.companyName}`;

    // 2. Render Pertanyaan
    renderQuestions(result.questions);
}

// --- DYNAMIC FORM ENGINE ---

function renderQuestions(questions) {
    const container = document.getElementById('dynamicFormContainer');
    container.innerHTML = ''; 

    let currentSection = '';
    let sectionDiv = null;
    let questionCounter = 1; // POIN 3: Auto Numbering Variable

    questions.forEach((q, index) => {
        // Buat Section Baru jika berubah
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

        // POIN 3: Logika Penomoran
        // Jika tipe 'header', jangan dikasih nomor. Jika pertanyaan biasa, kasih nomor.
        let labelText = q.label;
        if (q.type.toLowerCase() !== 'header') {
            labelText = `${questionCounter}. ${q.label}`;
            questionCounter++; // Increment nomor
        }

        // Label Pertanyaan
        const label = document.createElement('label');
        label.innerHTML = `${labelText} ${q.required ? '<span class="required">*</span>' : ''}`;
        
        // Jika tipe header, styling beda sedikit (opsional)
        if (q.type.toLowerCase() === 'header') {
            label.style.fontWeight = 'bold';
            label.style.marginTop = '15px';
            label.style.color = '#4a69bd';
        }

        formGroup.appendChild(label);

        // Input Berdasarkan Tipe
        let input;
        const inputName = `q_${index}`; 

        switch (q.type.toLowerCase()) {
            case 'text':
                input = document.createElement('input');
                input.type = 'text';
                input.name = q.label; 
                if (q.required) input.required = true;
                // Auto-fill Nama
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
                q.options.forEach((opt, i) => {
                    // Wrapper label agar bisa diklik area-nya (POIN 4)
                    const labelOpt = document.createElement('label');
                    labelOpt.className = 'radio-option';
                    
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = q.label;
                    radio.value = opt.trim();
                    if (q.required) radio.required = true;

                    // Text Node
                    const textSpan = document.createElement('span');
                    textSpan.textContent = opt.trim();

                    labelOpt.appendChild(radio);
                    labelOpt.appendChild(textSpan);
                    input.appendChild(labelOpt);
                });
                break;
            
            case 'header': 
                // Header sudah ditangani di bagian label di atas
                // Input kosongkan saja atau buat hidden
                input = null;
                break;
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

    const payload = {
        action: 'submit',
        answers: answers
    };

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

// --- HELPER FETCH ---

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