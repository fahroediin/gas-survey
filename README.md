# 📊 Serverless Survey App

Aplikasi Survey App berbasis web yang modern, aman, dan sepenuhnya dinamis. Aplikasi ini menggunakan **Google Sheets** sebagai database dan CMS (Content Management System), **Google Apps Script** sebagai Backend API, dan **Vercel** sebagai Proxy Serverless & Hosting Frontend.

![App Preview](https://via.placeholder.com/800x400?text=Preview+Aplikasi+Login+dan+Form)
*(Ganti link di atas dengan screenshot halaman login/form aplikasi Anda)*

## 🌟 Fitur Utama

### 🔐 Keamanan & Autentikasi
*   **Secure Login:** Validasi username/password langsung dari Google Sheets.
*   **JWT Authentication:** Menggunakan JSON Web Token untuk manajemen sesi yang aman.
*   **Proxy Protection:** URL Google Apps Script disembunyikan di balik Vercel Serverless Function.
*   **Auto Logout:** Sesi otomatis dihapus saat halaman di-refresh untuk keamanan maksimal.

### ⚙️ Dinamis & Configurable (CMS)
*   **Dynamic Questions:** Tambah, hapus, atau ubah pertanyaan langsung dari Google Sheets tanpa menyentuh kodingan.
*   **Dynamic UI Settings:** Judul halaman, Nama Perusahaan, Footer, dan Judul Login bisa diubah dari Spreadsheet.
*   **Auto Numbering:** Penomoran pertanyaan otomatis (melewati header section).

### 🎨 UI/UX Modern
*   **Skeleton Loading:** Tampilan loading "tulang" (shimmer effect) saat memuat konfigurasi awal.
*   **Progress Bar:** Indikator loading animasi saat proses login.
*   **Glassmorphism:** Desain kartu login yang modern dan transparan.
*   **Responsive:** Tampilan optimal di Desktop dan Mobile.

---

## 🏗️ Arsitektur Sistem

1.  **Frontend (HTML/JS):** User Interface yang berjalan di browser.
2.  **Middleware (Vercel):** Menangani CORS, validasi JWT, dan meneruskan request ke GAS.
3.  **Backend (Google Apps Script):** Logika bisnis dan koneksi ke Spreadsheet.
4.  **Database (Google Sheets):** Menyimpan data user, pertanyaan, konfigurasi, dan jawaban.

---

## 📋 Struktur Database (Google Sheets)

Buatlah Google Spreadsheet baru dengan **4 Tab (Sheet)** berikut. Pastikan nama tab dan urutan kolom **persis** seperti di bawah ini.

### 1. Tab: `Settings`
Mengatur tampilan global aplikasi.

| Baris | A | B | C | D |
| :--- | :--- | :--- | :--- | :--- |
| **1 (Header)** | **Company Name** | **Footer Text** | **Page Title** | **Login Title** |
| **2 (Data)** | PT. Perkasa Pilar Utama | Business Analyst | Feedback Intern BA | Survey App |

### 2. Tab: `Interns`
Data akun untuk login.

| A | B | C | D | E |
| :--- | :--- | :--- | :--- | :--- |
| **Name** | **Start Period** | **End Period** | **username** | **password** |
| Qorina | Des 2025 | Mei 2026 | qorina | magang2025 |
| Azizah | Des 2025 | Mei 2026 | azizah | intern2025 |

### 3. Tab: `Questions`
Daftar pertanyaan yang akan muncul di form.

| A | B | C | D | E |
| :--- | :--- | :--- | :--- | :--- |
| **Section** | **Question** | **Type** | **Options** | **Required** |
| BAGIAN A | Nama Lengkap | text | | TRUE |
| BAGIAN B | Kepuasan? | scale | | TRUE |
| BAGIAN B | Status? | radio | Aktif,Cuti,Alumni | TRUE |
| BAGIAN C | Ceritakan | textarea | | FALSE |

*   **Type Options:** `text`, `textarea`, `scale` (1-5), `radio`, `header` (judul sub-bab).
*   **Options:** Pisahkan dengan koma (`,`) untuk tipe radio.

### 4. Tab: `Responses`
Tempat jawaban tersimpan (Biarkan baris 2 kosong, header saja).

| A | B | C |
| :--- | :--- | :--- |
| **Timestamp** | **Nama** | **Raw Data JSON** |

---

## 🚀 Panduan Instalasi

### Langkah 1: Google Apps Script (Backend)
1.  Buka Spreadsheet Anda -> **Extensions** -> **Apps Script**.
2.  Copy kode dari `Code.gs` ke editor.
3.  Ubah variabel `PROXY_SECRET` dengan password rahasia Anda.
4.  **Deploy:**
    *   Klik **Deploy** > **New Deployment**.
    *   Select type: **Web App**.
    *   Execute as: **Me**.
    *   Who has access: **Anyone**.
    *   Copy **Web App URL**.

### Langkah 2: Vercel (Middleware & Hosting)
1.  Pastikan struktur folder project Anda:
    ```
    /api
      ├── login.js
      └── proxy.js
    /public
      ├── index.html
      ├── style.css
      ├── script.js
      └── favicon.png
    package.json
    vercel.json
    ```
2.  Push project ke **GitHub**.
3.  Import project di **Vercel**.
4.  Masuk ke **Settings** > **Environment Variables** di Vercel, tambahkan:
    *   `GAS_URL`: (URL Web App dari Langkah 1)
    *   `PROXY_SECRET`: (Harus sama persis dengan di Code.gs)
    *   `JWT_SECRET`: (String acak bebas untuk enkripsi token)
5.  Deploy project.

---

## 📸 Screenshots

### 1. Halaman Login (Skeleton Loading & Glassmorphism)
Tampilan awal saat memuat konfigurasi dari Spreadsheet.
![Login Skeleton](https://via.placeholder.com/600x400?text=Screenshot+Login+Skeleton)
*(Tempatkan screenshot halaman login Anda di sini)*

### 2. Halaman Form (Dynamic Rendering)
Form yang digenerate otomatis berdasarkan sheet `Questions`.
![Form UI](https://via.placeholder.com/600x400?text=Screenshot+Form+UI)
*(Tempatkan screenshot halaman form Anda di sini)*

### 3. Konfigurasi Spreadsheet
Tampilan data di Google Sheets.
![Spreadsheet Config](https://via.placeholder.com/600x200?text=Screenshot+Spreadsheet+Tabs)
*(Tempatkan screenshot tab Questions/Settings di sini)*

---

## 🛠️ Teknologi yang Digunakan

*   **Frontend:** HTML5, CSS3 (CSS Variables, Flexbox, Animation), Vanilla JavaScript (ES6+).
*   **Backend:** Node.js (Vercel Serverless Functions).
*   **Database:** Google Sheets API (via Apps Script).
*   **Auth:** JSON Web Token (JWT).

---

## 📝 Catatan Pengembang

*   **Update Pertanyaan:** Cukup edit sheet `Questions`, lalu refresh halaman web. Tidak perlu redeploy.
*   **Update Kode GAS:** Jika mengubah `Code.gs`, jangan lupa **Deploy > Manage Deployments > Edit > New Version**.
*   **Keamanan:** Jangan pernah membagikan `PROXY_SECRET` atau `GAS_URL` secara publik.

---

Made with ❤️ by Fahrudin