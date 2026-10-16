<div align="center">

# 🚀 api-mfikria

**REST API untuk data profil & repositori GitHub, serta data Anime.**

[![Dokumentasi](https://img.shields.io/badge/📖%20Dokumentasi-Lihat%20Docs-success?style=for-the-badge)](https://api-mfikria.vercel.app/docs.html)

![Version](https://img.shields.io/badge/version-1.9.1-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)

</div>

---

## 📌 Versi

**Current version: `v1.9.1`**

---

## ⚠️ Peringatan

> [!WARNING]
> - **`/v2/github`** → membutuhkan **Token** (GitHub Personal Access Token) agar dapat digunakan.
> - **`/v2/anime`**, **`/v2/youtube`**, dan **`/v3/lk21`** → masih dalam **tahap pengembangan**. Endpoint, respons, dan perilakunya dapat berubah sewaktu-waktu.

---

## 🛠️ Teknologi

| Teknologi | Keterangan |
| --------- | ---------- |
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=nodedotjs&logoColor=white) | Runtime JavaScript |
| ![Express](https://img.shields.io/badge/-Express.js-000000?logo=express&logoColor=white) | Web framework |

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

Dokumentasi lengkap tersedia di: **https://api-mfikria.vercel.app/docs.html**

---

## 🌐 Base URL

| Layanan | Base URL |
| ------- | -------- |
| 🐙 GitHub (Profil & Repositori) | `https://api-mfikria.vercel.app/v2/github/` |
| 🎌 Anime | `https://api-mfikria.vercel.app/v2/anime/` |
| 🎥 LK21 (Movies & Series) | `https://api-mfikria.vercel.app/v3/lk21/` |

---

## 📚 Daftar Endpoint

### 🐙 GitHub 🔑 *(butuh Token)*

| Endpoint | Deskripsi |
| -------- | --------- |
| `/v2/github/{YourProfile}` | Profil GitHub kamu |
| `/v2/github/{YourProfile}/repos` | Daftar repositori GitHub kamu |
| `/v2/github/{YourProfile}/repos/{repoName}` | Detail repositori GitHub kamu |

### 🎌 Anime 🚧 *(dalam pengembangan)*

| Endpoint | Deskripsi |
| -------- | --------- |
| `/v2/anime?page={page}&limit={limit}` | Daftar anime dengan paginasi (limit maksimal **25**) |
| `/v2/anime/full/{mal_id}` | Detail anime |
| `/v2/anime/search?q={query}` | Cari anime |
| `/v2/anime/popular?page=1` | Anime teratas (top) + paginasi |
| `/v2/anime/character/:mal_id` | Detail karakter |
| `/v2/anime/character/people/:mal_id` | Pengisi suara (people) karakter anime |

### 🎥 LK21 🚧 *(dalam pengembangan)*

| Endpoint | Deskripsi |
| -------- | --------- |
| `/v3/lk21/movies` | Halaman movies |
| `/v3/lk21/movies/populer` | Movies populer |
| `/v3/lk21/movies/d/{judul}` | Detail movie |
| `/v3/lk21/series` | Halaman series |
| `/v3/lk21/series/populer` | Series populer |
| `/v3/lk21/series/d/{judul}` | Detail series |
| `/v3/lk21/s/{judul}` | Cari movie atau series |
| `/v3/lk21/genres` | Daftar genre |
| `/v3/lk21/countries` | Daftar negara |
| `/v3/lk21/years` | Daftar tahun |

### 🎬 YouTube 🚧 *(dalam pengembangan)*

| Endpoint | Deskripsi |
| -------- | --------- |
| `/v2/youtube` | Segera hadir |

---

## 💡 Contoh Penggunaan

```bash
# Cari anime
curl "https://api-mfikria.vercel.app/v2/anime/search?q=naruto"

# Anime populer halaman 1
curl "https://api-mfikria.vercel.app/v2/anime/popular?page=1"

# Daftar anime (halaman 1, 25 data)
curl "https://api-mfikria.vercel.app/v2/anime?page=1&limit=25"

# Movies populer (LK21)
curl "https://api-mfikria.vercel.app/v3/lk21/movies/populer"
```

---

## 🤝 Kontribusi

Pull request dan saran sangat diterima. Silakan buka *issue* untuk diskusi perubahan yang ingin kamu buat.

---

<div align="center">

✨ **Enjoy the application!** ✨

Terima kasih banyak! 🙏

[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://api-mfikria.vercel.app/instagram)

</div>