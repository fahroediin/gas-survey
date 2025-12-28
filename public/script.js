const API_BASE = "/api";

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

// --- AUTHENTICATION ---

function checkAuth() {
    const token = localStorage.getItem('internToken');
    if (!token) {
        document.getElementById('loginModal').classList.remove('hidden');
    } else {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('mainContainer').classList.remove('hidden');
        loadConfiguration(); // Load form setelah login
    }
}

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');
    const btn = this.querySelector('button');

    btn.disabled = true;
    btn.textContent = "Memverifikasi...";
    errorMsg.textContent = "";

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            localStorage.setItem('internToken', result.token);
            // Simpan info user untuk pre-fill form nanti jika perlu
            localStorage.setItem('userData', JSON.stringify(result.user));
            
            document.getElementById('loginModal').classList.add('hidden');
            document.getElementById('mainContainer').classList.remove('hidden');
            loadConfiguration();
        } else {
            errorMsg.textContent = result.message || "Login gagal.";
        }
    } catch (err) {
        errorMsg.textContent = "Gagal terhubung ke server.";
    } finally {
        btn.disabled = false;
        btn.textContent = "Masuk";
    }
});

// --- DYNAMIC FORM ENGINE ---

async function loadConfiguration() {
    const container = document.getElementById('dynamicFormContainer');
    
    try {
        const result = await fetchWithAuth({ action: 'getConfig' });
        
        if (result && result.status === 'success') {
            // 1. Set Info Perusahaan
            document.title = result.settings.pageTitle;
            document.getElementById('pageTitle').textContent = result.settings.pageTitle;
            document.getElementById('companyName').textContent = result.settings.companyName;
            
            // --- PERUBAHAN DI SINI ---
            // Menggabungkan Footer Text + @ + Company Name
            document.getElementById('footerText').textContent = `${result.settings.footerText} @ ${result.settings.companyName}`;
            // -------------------------

            // 2. Render Pertanyaan
            renderQuestions(result.questions);
        } else {
            container.innerHTML = '<p class="error-text">Gagal memuat konfigurasi form.</p>';
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="error-text">Terjadi kesalahan jaringan.</p>';
    }
}

function renderQuestions(questions) {
    const container = document.getElementById('dynamicFormContainer');
    container.innerHTML = ''; // Bersihkan loading

    let currentSection = '';
    let sectionDiv = null;

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

        // Jika tidak ada section, masukkan ke container langsung (atau section terakhir)
        const target = sectionDiv || container;
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        // Label Pertanyaan
        const label = document.createElement('label');
        label.innerHTML = `${q.label} ${q.required ? '<span class="required">*</span>' : ''}`;
        formGroup.appendChild(label);

        // Input Berdasarkan Tipe
        let input;
        const inputName = `q_${index}`; // ID unik untuk setiap jawaban

        switch (q.type.toLowerCase()) {
            case 'text':
                input = document.createElement('input');
                input.type = 'text';
                input.name = q.label; // Gunakan label sebagai key JSON nanti
                if (q.required) input.required = true;
                // Auto-fill Nama jika labelnya "Nama"
                if (q.label.toLowerCase().includes('nama')) {
                    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                    if (userData.name) {
                        input.value = userData.name;
                        input.readOnly = true; // Opsional: Kunci agar tidak diubah
                    }
                }
                break;

            case 'textarea':
                input = document.createElement('textarea');
                input.name = q.label;
                if (q.required) input.required = true;
                break;

            case 'scale': // Skala 1-5
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

            case 'radio': // Pilihan Ganda dari kolom Options
                input = document.createElement('div');
                input.className = 'radio-group';
                q.options.forEach((opt, i) => {
                    const labelOpt = document.createElement('label');
                    labelOpt.className = 'radio-option';
                    
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = q.label;
                    radio.value = opt.trim();
                    if (q.required) radio.required = true;

                    labelOpt.appendChild(radio);
                    labelOpt.appendChild(document.createTextNode(opt.trim()));
                    input.appendChild(labelOpt);
                });
                break;
            
            case 'header': // Hanya teks penjelasan/header sub-section
                input = document.createElement('p');
                input.className = 'sub-label';
                input.textContent = q.options[0] || ''; // Ambil text dari options jika ada
                label.style.display = 'none'; // Sembunyikan label utama
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

    // Kumpulkan Data Dinamis
    const formData = new FormData(this);
    const answers = {};
    
    // Convert FormData ke Object JSON
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
            window.location.reload(); // Refresh untuk reset
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

// --- HELPER ---

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
        localStorage.removeItem('internToken');
        location.reload();
        return null;
    }

    return response.json();
}