// Gunakan relative path karena satu domain di Vercel
const API_BASE = "/api";

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

function checkAuth() {
    const token = localStorage.getItem('internToken');
    if (!token) {
        document.getElementById('loginModal').classList.remove('hidden');
    } else {
        document.getElementById('loginModal').classList.add('hidden');
        loadInternNames();
    }
}

// Login
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');
    const btn = this.querySelector('button');

    btn.disabled = true;
    btn.textContent = "Memproses...";
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
            document.getElementById('loginModal').classList.add('hidden');
            loadInternNames();
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

// Helper Fetch
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

// Load Nama
async function loadInternNames() {
    const select = document.getElementById('nama');
    try {
        const result = await fetchWithAuth({ action: 'getNames' });
        if (result && result.status === 'success') {
            select.innerHTML = '<option value="">-- Pilih Nama --</option>';
            result.data.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error(error);
        select.innerHTML = '<option value="">Gagal memuat</option>';
    }
}

// Submit Form
document.getElementById('feedbackForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const loading = document.getElementById('loadingDiv');
    const success = document.getElementById('successMsg');
    
    btn.disabled = true;
    loading.classList.add('active');
    
    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => data[key] = value);
    data.action = 'submit';

    try {
        const result = await fetchWithAuth(data);
        loading.classList.remove('active');
        
        if (result && result.status === 'success') {
            success.classList.add('active');
            document.getElementById('feedbackForm').reset();
        } else {
            alert("Gagal: " + (result ? result.message : "Unknown error"));
        }
    } catch (err) {
        loading.classList.remove('active');
        alert("Error jaringan");
    } finally {
        btn.disabled = false;
    }
});