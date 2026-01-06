const API_BASE = "/api";

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

function checkAuth() {
    const token = localStorage.getItem('internToken');
    if (!token) {
        window.location.href = 'index.html';
    } else {
        loadResponses();
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

async function loadResponses() {
    const tableBody = document.getElementById('tableBody');
    const totalLabel = document.getElementById('totalResponses');

    try {
        const token = localStorage.getItem('internToken');
        
        const response = await fetch(`${API_BASE}/proxy`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'getResponses' })
        });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        const result = await response.json();

        if (result.status === 'success') {
            renderTable(result.data);
            totalLabel.textContent = `Total Respon Masuk: ${result.data.length}`;
        } else {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">${result.message}</td></tr>`;
        }

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Gagal memuat data. Cek koneksi internet.</td></tr>`;
    }
}

function renderTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 30px;">Belum ada data respon.</td></tr>`;
        return;
    }

    data.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // Format Tanggal yang User Friendly
        const dateObj = new Date(item.timestamp);
        const dateStr = dateObj.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit' });

        // Cari Divisi (Coba beberapa kemungkinan key karena JSON dinamis)
        const divisi = item.answers['Divisi'] || item.answers['Divisi/Tim'] || '-';

        row.innerHTML = `
            <td>
                <div style="font-weight:bold;">${dateStr}</div>
                <div style="font-size:12px; color:#666;">${timeStr} WIB</div>
            </td>
            <td>${item.name}</td>
            <td>${divisi}</td>
            <td style="text-align:center;">
                <button class="submit-btn" style="padding: 8px 15px; font-size:12px; width:auto;" onclick="showDetail(${index})">
                    Lihat Detail
                </button>
            </td>
        `;
        
        // Simpan data di elemen untuk akses cepat
        row.dataset.answers = JSON.stringify(item.answers);
        row.dataset.name = item.name;
        row.dataset.time = `${dateStr}, ${timeStr} WIB`;
        
        tableBody.appendChild(row);
    });
}

// --- MODAL DETAIL (MENAMPILKAN SEMUA DATA) ---

window.showDetail = function(index) {
    const rows = document.querySelectorAll('#tableBody tr');
    const targetRow = rows[index];
    if (!targetRow) return;

    const answers = JSON.parse(targetRow.dataset.answers);
    const name = targetRow.dataset.name;
    const time = targetRow.dataset.time;

    const contentDiv = document.getElementById('detailContent');
    document.getElementById('detailName').textContent = name;
    document.getElementById('detailTime').textContent = `Dikirim pada: ${time}`;
    
    contentDiv.innerHTML = '';

    // Loop seluruh key yang ada di JSON answers
    // Kita gunakan Object.entries untuk mendapatkan pasangan [Pertanyaan, Jawaban]
    for (const [question, answer] of Object.entries(answers)) {
        // Filter: Jangan tampilkan jika jawaban kosong atau null
        if (!answer || answer === "") continue;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'detail-item';
        
        // Render HTML
        itemDiv.innerHTML = `
            <span class="detail-question">${question}</span>
            <div class="detail-answer">${answer}</div>
        `;
        contentDiv.appendChild(itemDiv);
    }

    document.getElementById('detailModal').classList.remove('hidden');
}

window.closeModal = function() {
    document.getElementById('detailModal').classList.add('hidden');
}