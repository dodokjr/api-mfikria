<div align="center">

# 🚀 api-mfikria

**REST API untuk GitHub, Anime & Donghua, Video, Ekonomi Dunia, Mata Uang, dan Waktu Dunia.**

[![Dokumentasi](https://img.shields.io/badge/📖%20Dokumentasi-Lihat%20Docs-success?style=for-the-badge)](https://api-mfikria.vercel.app/docs.html)
[![Access Token](https://img.shields.io/badge/🔑%20Access%20Token-Buat%20Token-red?style=for-the-badge)](https://api-mfikria.vercel.app/InputToken.html)

![Version](https://img.shields.io/badge/version-1.9.5-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)

</div>

---

## 📌 Versi

**Current version: `v1.9.5`**

---

## ⚠️ Peringatan

> [!WARNING]
> - **`/v2/public/github`**, **`/v2/anime/otaku`**, **`/v2/donghua/anichi`**, **`/v2/world`**, **`/v2/country`**, **`/v2/currencies`**, dan **`/v2/currency`** → membutuhkan **Access Token** (header `Authorization: Bearer {token}`).
> - **Video** dan **share-info** → membutuhkan **Guest Token** (`?query={Access_Token}&tgl={tanggal}`).
> - **`/v2/anime`**, **`/v2/anime/otaku`**, dan **`/v2/donghua/anichi`** → masih dalam **tahap pengembangan**. Endpoint, respons, dan perilakunya dapat berubah sewaktu-waktu.

---

## 🛠️ Teknologi

| Teknologi | Keterangan |
| --------- | ---------- |
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=nodedotjs&logoColor=white) | Runtime JavaScript |
| ![Express](https://img.shields.io/badge/-Express.js-000000?logo=express&logoColor=white) | Web framework |
| ![Vercel](https://img.shields.io/badge/-Vercel-000000?logo=vercel&logoColor=white) | Hosting & deployment |

---

## 📦 Instalasi

```bash
# 1. Install dependencies
npm install

# 2. Jalankan aplikasi
npm start
```

Aplikasi berjalan di **port `5000`** → `http://localhost:5000`

---

## 📖 Dokumentasi

Dokumentasi lengkap (dengan contoh kode JavaScript, TypeScript, React, Node.js, Python, Go, Java, dan PHP) tersedia di: **https://api-mfikria.vercel.app/docs.html**

---

## 📑 Format Respons

Semua endpoint membalas JSON.

| Bagian | Penanda sukses | Penanda gagal |
| ------ | -------------- | ------------- |
| Umum (GitHub, Video, Akun, Anime, Token) | `"status": "success"` | `"status": "error"` + `"message"` |
| Ekonomi & Mata Uang (World, Country, Currency) dan Time | `"success": true` | `"success": false` + `"message"` |

---

## 🌐 Base URL

| Layanan | Base URL | Auth |
| ------- | -------- | ---- |
| 🔑 Guest token, video, share/embed, akun | `https://api-mfikria.vercel.app/mfikria/v1` | Guest token / token akses |
| 🎟️ Access Token (buat & cek status) | `https://api-mfikria.vercel.app/v2/token` | – |
| 🐙 GitHub | `https://api-mfikria.vercel.app/v2/public/github` | Access Token |
| 🎌 Anime | `https://api-mfikria.vercel.app/v2/anime` | – |
| 🍙 Anime Otakudesu | `https://api-mfikria.vercel.app/v2/anime/otaku` | Access Token |
| 🐉 Donghua Anichin | `https://api-mfikria.vercel.app/v2/donghua/anichi` | Access Token |
| 🌍 World (ekonomi semua negara) | `https://api-mfikria.vercel.app/v2/world` | Access Token |
| 🏳️ Country (satu negara) | `https://api-mfikria.vercel.app/v2/country` | Access Token |
| 💱 Currency (kurs & mata uang) | `https://api-mfikria.vercel.app/v2/currency` | Access Token |
| 🕐 Time (waktu dunia) | `https://api-mfikria.vercel.app/v2/time` | – (tanpa token) |

---

## 🔐 Autentikasi

### 🎟️ Access Token

Dipakai oleh GitHub, Otaku, Anichi, World, Country, dan Currency. Token berlaku **10 hari**. Cara termudah: buat lewat halaman [Access Token](https://api-mfikria.vercel.app/InputToken.html).

| Endpoint | Deskripsi |
| -------- | --------- |
| `POST /v2/token` | Buat access token. Body JSON opsional `{ "name": "..." }` (maks 15 karakter, kosong = nama acak) |
| `GET /v2/token/status` | Cek token masih berlaku atau tidak (header `Authorization: Bearer {token}`) |

```js
const API = 'https://api-mfikria.vercel.app';

const res = await fetch(`${API}/v2/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Budi' })
});
const { data } = await res.json();
localStorage.setItem('access_token', data.token);
```

Pakai token di header:

```js
const res = await fetch(`${API}/v2/donghua/anichi/latest`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
});
```

> Pembuatan token dibatasi **10 permintaan per menit per IP** (lebih dari itu dibalas `429`). Pakai ulang token yang tersimpan sampai kedaluwarsa.

### 👤 Guest Token

Token untuk pengunjung tanpa login, dipakai oleh endpoint video dan share-info.

| Endpoint | Deskripsi |
| -------- | --------- |
| `POST /mfikria/v1/guest-token` | Buat guest token (tanpa body dan tanpa header) |
| `GET /mfikria/v1/guest-view` | Jumlah guest yang pernah masuk (cache 30 detik) |

Kirim sebagai query: `?query={Access_Token}&tgl={tanggal}` (dari respons **yang sama**).

> Maksimal **10 token per IP per jam**, berlaku **24 jam**. Token salah atau kedaluwarsa dibalas `401` dengan `renew: true` → buat token baru lalu ulangi request.

---

## 📚 Daftar Endpoint

### 🐙 GitHub 🔑 *(Access Token)*

Batas **60 request per menit per IP**. Data yang tersedia hanya data publik. Respons di-cache ±60 detik.

| Endpoint | Deskripsi |
| -------- | --------- |
| `/v2/public/github/{nama}` | Profil pengguna |
| `/v2/public/github/{nama}/repos` | Daftar repository |
| `/v2/public/github/{nama}/repos/{repo}` | Detail satu repository |
| `/v2/public/github/{nama}/repos/{repo}/events` | Aktivitas repository |
| `/v2/public/github/{nama}/repos/{repo}/languages` | Bahasa pemrograman yang dipakai |
| `/v2/public/github/l/limit` | Sisa kuota GitHub API (alias `/rate-limit`) |
| `/v2/public/github/search/users?q={query}` | Cari pengguna GitHub |

**Parameter opsional**

- `/repos` & `/events`: `per_page` (1–100), `page` (1–1000)
- `/repos`: `sort` (`created`, `updated`, `pushed`, `full_name`), `direction` (`asc`/`desc`), `type` (`all`, `owner`, `member`)
- `/search/users`: `q` (wajib, maks 256 karakter), `sort` (`followers`, `repositories`, `joined`), `order`, `page`, `per_page`

### 🎌 Anime 🚧 *(dalam pengembangan)*

| Endpoint | Deskripsi |
| -------- | --------- |
| `/v2/anime` | Halaman home |
| `/v2/anime/{query}` | Cari anime, contoh `/v2/anime/naruto` |
| `/v2/anime/full/{id}` | Detail lengkap anime |
| `/v2/anime/popular` | Anime populer (Top Anime) |
| `/v2/anime/populer/page/{id}` | Anime populer per halaman |
| `/v2/anime/character/{id}` | Karakter anime |
| `/v2/anime/character/people/{id}` | Pengisi suara karakter |

### 🍙 Otaku & 🐉 Anichi 🔑 🚧 *(Access Token, dalam pengembangan)*

| Endpoint | Deskripsi |
| -------- | --------- |
| `/v2/anime/otaku` | Anime Otakudesu |
| `/v2/donghua/anichi` | Donghua Anichin |
| `/v2/donghua/anichi/latest` | Donghua terbaru |

### 🌍 World 🔑 *(Access Token)*

Data ekonomi semua negara dari **World Bank**. Setiap negara berisi nama, region, level pendapatan, ibu kota, koordinat, dan indikator `gdp`, `gdpPerCapita`, `gdpGrowth`, `inflation`, `unemployment`, `population` (masing-masing `value` + `year`, atau `null`).

| Endpoint | Deskripsi |
| -------- | --------- |
| `/v2/world` | Semua negara + filter, urutan kaya/miskin, paginasi |
| `/v2/world/{kode}` | Satu negara (sama dengan `/v2/country/{kode}`) |

| Parameter | Keterangan |
| --------- | ---------- |
| `q` | Cari nama negara |
| `region` | Filter region, contoh `East Asia` |
| `incomeLevel` | Filter level pendapatan, contoh `High` |
| `sort` | `richest` atau `poorest` (hasil diberi `rank`) |
| `by` | `gdpPerCapita` (default) atau `gdp` |
| `page` | Nomor halaman (default 1) |
| `limit` | 1–250 (default 20), `?limit=250` untuk semua negara |

### 🏳️ Country 🔑 *(Access Token)*

| Endpoint | Deskripsi |
| -------- | --------- |
| `/v2/country/{kode}` | Data ekonomi satu negara (kode ISO2 atau ISO3, contoh `ID`, `USA`, `JP`, `SGP`) |

### 💱 Currency 🔑 *(Access Token)*

Kurs dan daftar mata uang dari **CurrencyFreaks** (fiat, logam, kripto). Kurs di-cache 15 menit, daftar mata uang 24 jam.

| Endpoint | Deskripsi |
| -------- | --------- |
| `/v2/currencies` | Semua mata uang + kurs terhadap USD (`q`, `limit`) |
| `/v2/currency` | Semua kurs terbaru (`?symbols=IDR,EUR,JPY`) |
| `/v2/currency/{kode}` | Kurs satu mata uang, contoh `/v2/currency/IDR` |
| `/v2/currency/convert` | Konversi (`from` default USD, `to` wajib, `amount` default 1) |

### 🕐 Time *(tanpa token)*

Waktu real time **419 zona waktu** dan negara per zona (contoh Indonesia: WIB, WITA, WIT). Nama hari tersedia dalam **20 bahasa**.

| Endpoint | Deskripsi |
| -------- | --------- |
| `/v2/time/world` | Kota-kota utama dunia |
| `/v2/time/world/regions` | Daftar region + jumlah zona |
| `/v2/time/world/zones` | Nama seluruh zona waktu per region |
| `/v2/time/world/all` | Waktu seluruh zona, paginasi (`page`, `limit` 1–100, `region`, `search`) |
| `/v2/time/world/region/{region}` | Semua zona dalam satu region |
| `/v2/time/world/zone?tz=Asia/Jakarta` | Waktu satu zona |
| `/v2/time/world/stream` | Real time (SSE) tiap 1 detik (`tz`, `region`, `all=true`) |
| `/v2/time/country` | Daftar negara tersedia |
| `/v2/time/country/{kode}` | Semua zona satu negara, contoh `/v2/time/country/ID` |
| `/v2/time/country/{kode}/{zona}` | Satu zona, contoh `/v2/time/country/ID/WIB` |
| `/v2/time/country/{kode}/stream` | Real time (SSE) semua zona negara |
| `/v2/time/country/{kode}/{zona}/stream` | Real time (SSE) satu zona |
| `/v2/time/languages` | Daftar bahasa untuk nama hari |

Parameter `lang` (default `id`) berlaku di semua endpoint, contoh `?lang=ja`. Kode: `id`, `en`, `zh`, `ar`, `ja`, `ko`, `es`, `tl`, `ca`, `fr`, `de`, `pt`, `it`, `nl`, `ru`, `hi`, `tr`, `ms`, `th`, `vi`.

### 🎬 Video 🔑 *(Guest Token)*

`{token}` adalah `videoToken` (10 karakter) dari daftar video.

| Endpoint | Deskripsi |
| -------- | --------- |
| `GET /mfikria/v1/videos` | Daftar video + views, tanggal upload, info share |
| `GET /mfikria/v1/video/{token}` | Stream video (mendukung Range) |
| `GET /mfikria/v1/video-info/{token}` | Info satu video |
| `POST /mfikria/v1/video-view/{token}` | Catat 1 view (satu guest dihitung sekali per video) |

### 🔗 Share & Embed

`{id}` adalah `shareId` (sama dengan `videoToken`). Publik, kecuali `share-info`.

| Endpoint | Deskripsi |
| -------- | --------- |
| `GET /mfikria/v1/share/{id}` | Link share, diarahkan ke halaman nonton |
| `GET /mfikria/v1/embed/{id}` | Player polos untuk `<iframe>` |
| `GET /mfikria/v1/share-info/{id}` | Link share, kode iframe, link media sosial 🔑 |
| `GET /mfikria/v1/s/{id}/stream` | Stream bertanda tangan (`?e=&s=`, berlaku 6 jam) |
| `POST /mfikria/v1/s/{id}/view` | Catat view dari halaman embed |

```html
<iframe src="https://api-mfikria.vercel.app/mfikria/v1/embed/k4n8lSIppy"
        width="640" height="360" frameborder="0"
        allow="fullscreen; autoplay" allowfullscreen loading="lazy"></iframe>
```

### 👥 Akun *(token akses user/admin)*

| Endpoint | Deskripsi |
| -------- | --------- |
| `POST /mfikria/v1/register` | Daftar akun (`username`, `password`, `role`, `photoId`) |
| `POST /mfikria/v1/login` | Masuk (`username`, `password`) |
| `POST /mfikria/v1/logout` | Keluar (`username`, `encryptedQueryToken`) |
| `GET /mfikria/v1/photos` | Daftar foto di Google Drive |
| `GET /mfikria/v1/photoProfile/{token}` | Foto profil dari token terenkripsi |
| `GET /mfikria/v1/assets/photo/{photoId}?q={token}` | Foto profil dengan `photoId` dan token |
| `GET /mfikria/v1/assets/session-photo/{photoId}?query={encryptedQueryToken}` | Validasi sesi / ambil foto |

**Aturan:** username maks 50 karakter, password 6–128 karakter; akun `admin` hanya bisa dibuat dengan token admin; satu akun hanya aktif di satu sesi; password disimpan sebagai hash (scrypt).

---

## 💡 Contoh Penggunaan

```bash
# Buat access token
curl -X POST "https://api-mfikria.vercel.app/v2/token" \
  -H "Content-Type: application/json" -d '{"name":"Budi"}'

# 5 repository GitHub (pakai access token)
curl "https://api-mfikria.vercel.app/v2/public/github/dodokjr/repos?per_page=5" \
  -H "Authorization: Bearer $TOKEN"

# 10 negara terkaya (per kapita)
curl "https://api-mfikria.vercel.app/v2/world?sort=richest&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Konversi 100 USD ke IDR
curl "https://api-mfikria.vercel.app/v2/currency/convert?from=USD&to=IDR&amount=100" \
  -H "Authorization: Bearer $TOKEN"

# Waktu WIB dengan nama hari bahasa Jepang (tanpa token)
curl "https://api-mfikria.vercel.app/v2/time/country/ID/WIB?lang=ja"

# Cari anime
curl "https://api-mfikria.vercel.app/v2/anime/naruto"
```

---

## 🚨 Kode Error

| Kode | Arti |
| ---- | ---- |
| `400` | Parameter atau data tidak valid |
| `401 TOKEN_MISSING` | Header `Authorization` kosong |
| `401 TOKEN_INVALID` | Token salah atau tidak dikenali |
| `401 TOKEN_EXPIRED` | Token lewat 10 hari, buat token baru |
| `401 TOKEN_REVOKED` | Token dicabut admin |
| `401 GUEST_TOKEN_INVALID` | Guest token/tanggal salah atau kedaluwarsa (`renew: true`) |
| `403` | Token akses salah, kredensial salah, atau akun sedang online |
| `404` | Data / negara / video / mata uang tidak ditemukan |
| `429` | Terlalu banyak permintaan (lihat header `Retry-After`) |
| `500` | Kesalahan di server |
| `502` | Gagal mengambil data dari sumber (GitHub, World Bank, CurrencyFreaks) |
| `503` | Validasi token sementara tidak tersedia, coba lagi sebentar |

---

## 🤝 Kontribusi

Pull request dan saran sangat diterima. Silakan buka *issue* untuk diskusi perubahan yang ingin kamu buat.

---

<div align="center">

✨ **Enjoy the application!** ✨

Terima kasih banyak! 🙏

[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://api-mfikria.vercel.app/instagram/fkri.ardn)

</div>