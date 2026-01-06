const API_BASE = "/api";

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

function checkAuth() {
    const token = localStorage.getItem('internToken');
    if (!token) {
        window.location.href = 'index.html'; // Redirect ke login jika belum login
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
            totalLabel.textContent = `Total Respon: ${result.data.length}`;
        } else {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">${result.message}</td></tr>`;
        }

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Gagal memuat data.</td></tr>`;
    }
}

function renderTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Belum ada data respon.</td></tr>`;
        return;
    }

    data.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // Format Tanggal
        const date = new Date(item.timestamp).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'
        });

        // Ambil Divisi dari JSON answers (sesuai key di JSON Anda)
        const divisi = item.answers['Divisi'] || '-';

        row.innerHTML = `
            <td>${date}</td>
            <td><strong>${item.name}</strong></td>
            <td>${divisi}</td>
            <td>
                <button class="btn-detail" onclick="showDetail(${index})">Lihat Detail</button>
            </td>
        `;
        
        // Simpan data full di elemen row untuk akses cepat
        row.dataset.answers = JSON.stringify(item.answers);
        row.dataset.name = item.name;
        
        tableBody.appendChild(row);
    });
}

// --- MODAL DETAIL ---

window.showDetail = function(index) {
    // Ambil data dari row tabel berdasarkan index (karena urutan render sama dengan array data)
    // Atau cara lebih aman: simpan data global. Tapi dataset row sudah cukup.
    const rows = document.querySelectorAll('#tableBody tr');
    const targetRow = rows[index];
    
    if (!targetRow) return;

    const answers = JSON.parse(targetRow.dataset.answers);
    const name = targetRow.dataset.name;

    const contentDiv = document.getElementById('detailContent');
    document.getElementById('detailName').textContent = `Jawaban: ${name}`;
    contentDiv.innerHTML = '';

    // Loop semua key-value di JSON answers
    for (const [question, answer] of Object.entries(answers)) {
        // Skip jika jawaban kosong (opsional)
        if (!answer) continue;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'detail-item';
        
        itemDiv.innerHTML = `
            <div class="detail-question">${question}</div>
            <div class="detail-answer">${answer.replace(/\n/g, '<br>')}</div>
        `;
        contentDiv.appendChild(itemDiv);
    }

    document.getElementById('detailModal').classList.remove('hidden');
}

window.closeModal = function() {
    document.getElementById('detailModal').classList.add('hidden');
}