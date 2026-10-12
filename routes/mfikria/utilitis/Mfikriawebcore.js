/* =====================================================================
   mfikriaWebCore.js — fungsi bersama untuk videoController, shareController & githubController
   (token pendek, cache Drive, streaming Range, view counter, guest check, builder link share)
   ===================================================================== */

   const crypto = require('crypto');
   const { spreadsheetId, sheets } = require('../config/spreadsheetConfig');
   const { drive, defaultFolderId } = require('../config/driveConfig');
   const {
     ADMIN_SECRET_TOKEN,
     USER_SECRET_TOKEN,
     IV_LENGTH,
     nowStamp,
     safeEqual,
     padDate,
     withLock,
   } = require('./Common');
   
   /* ========================= UMUM ========================= */
   
   // Prefix tempat router di-mount di app (app.use('/mfikria/v1', router)), dipakai untuk membentuk URL
   const API_BASE_PATH = (process.env.API_BASE_PATH || '/mfikria/v1').replace(/\/+$/, '');
   
   // Domain publik server ini (untuk link share & kode iframe), contoh: https://api.domainmu.com
   // Kalau kosong, dipakai host dari request (pastikan app.set('trust proxy', 1) kalau di belakang Nginx).
   const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
   
   // true = stream video ditolak kalau request JELAS bukan dari elemen <video>
   // (header Sec-Fetch-Dest ada tapi bukan "video"). Browser lama yang tidak mengirim header tetap boleh.
   // Set VIDEO_REQUIRE_FETCH_DEST=false untuk mematikan pengecekan.
   const VIDEO_REQUIRE_FETCH_DEST = String(process.env.VIDEO_REQUIRE_FETCH_DEST || 'true').toLowerCase() !== 'false';
   
   // Batas ukuran satu respons Range (byte). Mencegah "bytes=0-" menarik seluruh file dari Drive.
   const MAX_CHUNK = Number(process.env.VIDEO_MAX_CHUNK_BYTES ?? 4 * 1024 * 1024);
   
   function escapeHtml(value) {
     return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
   }
   
   function getClientIp(req) {
     // Kalau di belakang proxy/Nginx, set app.set('trust proxy', 1) supaya req.ip benar
     return req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
   }
   
   function getBaseUrl(req) {
     const origin = PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
     return `${origin}${API_BASE_PATH}`;
   }
   
   /* ========================= TOKEN VIDEO PENDEK (10 karakter) =========================
      shortId = 10 karakter pertama dari HMAC-SHA256(videoId). Deterministik (stabil antar refresh & restart),
      tidak bisa dibalik jadi ID Drive. Server memetakan balik lewat daftar video di folder Drive (cache). */
   
   const VIDEO_TOKEN_KEY = crypto
     .createHash('sha256')
     .update(process.env.VIDEO_URL_SECRET || `video|${ADMIN_SECRET_TOKEN}|${USER_SECRET_TOKEN}`)
     .digest();
   
   const SHORT_ID_LENGTH = 10;
   const SHORT_ID_REGEX = new RegExp(`^[A-Za-z0-9_-]{${SHORT_ID_LENGTH}}$`);
   
   function makeShortId(videoId) {
     return crypto.createHmac('sha256', VIDEO_TOKEN_KEY).update(videoId).digest('base64url').slice(0, SHORT_ID_LENGTH);
   }
   
   const shortIndex = new Map(); // shortId -> videoId
   const LIST_TTL_MS = 60 * 1000;
   const INDEX_MISS_REFRESH_MS = 10 * 1000;
   let listCache = { files: null, at: 0 };
   
   // Ambil daftar video dari folder Drive (dengan pagination)
   async function listVideosFromFolder(folderId) {
     const safeFolderId = String(folderId).replace(/['\\]/g, '');
     const files = [];
     let pageToken;
     do {
       const { data } = await drive.files.list({
         q: `'${safeFolderId}' in parents and mimeType contains 'video/' and trashed = false`,
         fields: 'nextPageToken, files(id, name, mimeType, size, createdTime)',
         pageSize: 100,
         pageToken,
         supportsAllDrives: true,
         includeItemsFromAllDrives: true,
         orderBy: 'name',
       });
       files.push(...(data.files || []));
       pageToken = data.nextPageToken;
     } while (pageToken);
     return files;
   }
   
   // Daftar video + index shortId. Di-cache 60 detik supaya Drive tidak dipanggil tiap request.
   async function getVideoList(force = false) {
     if (!force && listCache.files && Date.now() - listCache.at < LIST_TTL_MS) return listCache.files;
     const files = await listVideosFromFolder(defaultFolderId);
     shortIndex.clear();
     for (const f of files) shortIndex.set(makeShortId(f.id), f.id);
     listCache = { files, at: Date.now() };
     return files;
   }
   
   // shortId -> videoId asli (null kalau tidak ada)
   async function resolveVideoId(shortId) {
     if (!SHORT_ID_REGEX.test(String(shortId))) return null;
     if (!defaultFolderId) return null;
     let id = shortIndex.get(shortId);
     if (id) return id;
     // tidak ketemu: mungkin video baru diupload, baca ulang folder (dibatasi 1x per 10 detik)
     if (Date.now() - listCache.at > INDEX_MISS_REFRESH_MS) {
       await getVideoList(true);
       id = shortIndex.get(shortId);
     }
     return id || null;
   }
   
   /* ========================= CACHE METADATA VIDEO ========================= */
   
   const META_TTL_MS = 10 * 60 * 1000;
   const metaCache = new Map(); // videoId -> { meta, at }
   
   async function getVideoMeta(videoId) {
     const now = Date.now();
     const hit = metaCache.get(videoId);
     if (hit && now - hit.at < META_TTL_MS) return hit.meta;
   
     const { data } = await drive.files.get({
       fileId: videoId,
       fields: 'name, mimeType, size, parents, createdTime',
       supportsAllDrives: true,
     });
   
     if (metaCache.size > 2000) {
       for (const [k, v] of metaCache) if (now - v.at > META_TTL_MS) metaCache.delete(k);
     }
     metaCache.set(videoId, { meta: data, at: now });
     return data;
   }
   
   // Harus berupa video dan berada di folder yang diizinkan
   function isAllowedVideo(meta) {
     const inFolder = !defaultFolderId || (meta.parents || []).includes(defaultFolderId);
     return String(meta.mimeType).startsWith('video/') && inFolder;
   }
   
   function videoTitle(meta) {
     return String(meta.name || '').replace(/\.[^.]+$/, '');
   }
   
   /* ========================= GUEST TOKEN (enkripsi + pengecekan akses) =========================
      Frontend menyimpan token di sessionStorage lalu mengirimnya ke backend.
      Backend yang menentukan token masih bisa dipakai atau tidak:
      - 1 token berlaku 24 jam sejak dibuat (dihitung dari waktu pembuatan, bukan aktivitas)
      - lewat 24 jam -> 401 dengan code GUEST_TOKEN_EXPIRED dan renew:true, frontend wajib membuat token baru
      Pembuatan token baru (sheet "GuestTokens") ada di videoController; di sini bagian yang dipakai bersama. */
   
   const GUEST_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 1 token = 24 jam
   
   const GUEST_TOKEN_KEY = crypto
     .createHash('sha256')
     .update(process.env.GUEST_TOKEN_SECRET || `guest|${ADMIN_SECRET_TOKEN}|${USER_SECRET_TOKEN}`)
     .digest();
   
   // payload: u = userId, d = tanggal (DDMMYY), i = waktu dibuat (ms), e = waktu kedaluwarsa (ms)
   // Return: { token, issuedAt, expiresAt }
   function createGuestToken(userId, tanggal, issuedAt = Date.now()) {
     const expiresAt = issuedAt + GUEST_TOKEN_TTL_MS; // selalu 24 jam, tidak bisa diatur dari luar
     const iv = crypto.randomBytes(IV_LENGTH);
     const cipher = crypto.createCipheriv('aes-256-gcm', GUEST_TOKEN_KEY, iv);
     const encrypted = Buffer.concat([
       cipher.update(JSON.stringify({ u: userId, d: tanggal, i: issuedAt, e: expiresAt }), 'utf8'),
       cipher.final(),
     ]);
     const token = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
     return { token, issuedAt, expiresAt };
   }
   
   // Hasil: { state: 'valid' | 'expired' | 'invalid', payload }
   function inspectGuestToken(token) {
     try {
       const raw = Buffer.from(String(token), 'base64url');
       if (raw.length < IV_LENGTH + 16 + 2) return { state: 'invalid' };
       const iv = raw.subarray(0, IV_LENGTH);
       const tag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
       const encrypted = raw.subarray(IV_LENGTH + 16);
       const decipher = crypto.createDecipheriv('aes-256-gcm', GUEST_TOKEN_KEY, iv);
       decipher.setAuthTag(tag);
       const payload = JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'));
   
       if (typeof payload.u !== 'string' || !payload.u) return { state: 'invalid' };
       if (typeof payload.d !== 'string' || !payload.d) return { state: 'invalid' };
       // token lama tanpa i/e dianggap tidak valid -> frontend akan membuat token baru
       if (!Number.isFinite(payload.i) || !Number.isFinite(payload.e)) return { state: 'invalid' };
       if (payload.e - payload.i > GUEST_TOKEN_TTL_MS) return { state: 'invalid' }; // masa berlaku dimanipulasi
   
       const now = Date.now();
       // lebih dari 24 jam sejak dibuat, atau sudah lewat e -> expired
       if (now >= payload.e || now - payload.i >= GUEST_TOKEN_TTL_MS) return { state: 'expired', payload };
   
       return { state: 'valid', payload };
     } catch (error) {
       return { state: 'invalid' };
     }
   }
   
   // Kompatibel dengan kode lama: payload kalau valid, null kalau tidak
   function readGuestToken(token) {
     const r = inspectGuestToken(token);
     return r.state === 'valid' ? r.payload : null;
   }
   
   // Token dari sessionStorage frontend. Prioritas header; fallback query string
   // (tag <video src> / iframe tidak bisa mengirim header).
   //   Header: x-guest-token, x-guest-date
   //   Query : ?query=<token>&tgl=<DDMMYY>
   function getGuestParams(req) {
     const h = (name) => (typeof req.headers[name] === 'string' ? req.headers[name] : '');
     const q = h('x-guest-token') || (typeof req.query.query === 'string' ? req.query.query : '');
     const tgl = h('x-guest-date') || (typeof req.query.tgl === 'string' ? req.query.tgl : '');
     return { q, tgl };
   }
   
   // Kembalikan { ok, state, payload } tanpa menulis response (dipakai juga oleh endpoint status)
   function evaluateGuestAccess(req) {
     const { q, tgl } = getGuestParams(req);
     if (!q) return { ok: false, state: 'missing' };
     const r = inspectGuestToken(q);
     if (r.state !== 'valid') return { ok: false, state: r.state };
     if (!safeEqual(padDate(tgl), padDate(r.payload.d))) return { ok: false, state: 'invalid' };
     return { ok: true, state: 'valid', payload: r.payload };
   }
   
   // Return true kalau boleh lanjut; kalau tidak, langsung balas 401
   function checkGuestAccess(req, res) {
     const r = evaluateGuestAccess(req);
     if (r.ok) return true;
   
     res.setHeader('Cache-Control', 'no-store');
     res.status(401).json({
       status: 'error',
       code: r.state === 'expired' ? 'GUEST_TOKEN_EXPIRED' : 'GUEST_TOKEN_INVALID', // frontend: buat token baru
       renew: true,
       message:
         r.state === 'expired'
           ? '401 Unauthorized: guest token sudah kedaluwarsa (24 jam), buat token baru.'
           : '401 Unauthorized: guest token atau tanggal tidak valid.',
     });
     return false;
   }
   
   // Untuk endpoint GET /guest-token/status (frontend cek sisa waktu token dari sessionStorage)
   function guestTokenStatus(req) {
     const r = evaluateGuestAccess(req);
     if (!r.ok) return { valid: false, state: r.state, renew: true };
     return {
       valid: true,
       state: 'valid',
       renew: false,
       expiresAt: r.payload.e,
       remainingMs: Math.max(r.payload.e - Date.now(), 0),
     };
   }
   
   /* ========================= VIEW COUNTER (Google Sheet tab "VideoViews") ========================= */
   // Kolom: A videoId (ID file Drive) | B judul | C views | D tanggal terakhir ditonton (DDMMYY) | E pukul (HHMM)
   // Buat dulu tab bernama "VideoViews" (header baris 1: videoId, judul, views, tanggal, pukul).
   
   const VIEWS_SHEET = process.env.VIEWS_SHEET_NAME || 'VideoViews';
   const VIEW_DEDUPE_MS = Number(process.env.VIEW_DEDUPE_MS ?? 30 * 60 * 1000);
   const VIEWS_CACHE_MS = 30 * 1000;
   let viewsCache = { map: null, at: 0 };
   
   async function readViewRows() {
     const response = await sheets.spreadsheets.values.get({
       spreadsheetId,
       range: `${VIEWS_SHEET}!A2:E`,
     });
     return response.data.values || [];
   }
   
   // Map videoId -> jumlah view. Di-cache 30 detik supaya library tidak menghabiskan kuota Sheets API.
   async function getViewsMap() {
     if (viewsCache.map && Date.now() - viewsCache.at < VIEWS_CACHE_MS) return viewsCache.map;
     try {
       const rows = await readViewRows();
       const map = new Map();
       for (const row of rows) {
         const n = parseInt(row[2], 10);
         if (row[0]) map.set(row[0], Number.isNaN(n) ? 0 : n);
       }
       viewsCache = { map, at: Date.now() };
       return map;
     } catch (error) {
       console.error('getViewsMap:', error.message);
       return viewsCache.map || new Map(); // daftar video tetap tampil walau sheet bermasalah
     }
   }
   
   // Tambah 1 view. Baca-lalu-tulis diantre lewat withLock (berlaku untuk 1 instance server).
   function addView(videoId, title) {
     return withLock(async () => {
       const rows = await readViewRows();
       const index = rows.findIndex((row) => row[0] === videoId);
       const { tgllogin, pukullogin } = nowStamp();
       let views;
   
       if (index === -1) {
         views = 1;
         await sheets.spreadsheets.values.append({
           spreadsheetId,
           range: `${VIEWS_SHEET}!A:E`,
           valueInputOption: 'RAW',
           requestBody: { values: [[videoId, title, views, tgllogin, pukullogin]] },
         });
       } else {
         views = (parseInt(rows[index][2], 10) || 0) + 1;
         const rowIndex = index + 2;
         await sheets.spreadsheets.values.update({
           spreadsheetId,
           range: `${VIEWS_SHEET}!B${rowIndex}:E${rowIndex}`,
           valueInputOption: 'RAW',
           requestBody: { values: [[title, views, tgllogin, pukullogin]] },
         });
       }
   
       if (viewsCache.map) viewsCache.map.set(videoId, views);
       return views;
     });
   }
   
   // Satu penonton (guest / IP) hanya dihitung 1 view per video dalam rentang VIEW_DEDUPE_MS (in-memory)
   const recentViews = new Map();
   function alreadyCounted(viewerId, videoId) {
     const now = Date.now();
     if (recentViews.size > 5000) {
       for (const [k, t] of recentViews) if (now - t > VIEW_DEDUPE_MS) recentViews.delete(k);
     }
     const key = `${viewerId}:${videoId}`;
     const last = recentViews.get(key);
     if (last && now - last < VIEW_DEDUPE_MS) return true;
     recentViews.set(key, now);
     return false;
   }
   function forgetView(viewerId, videoId) {
     recentViews.delete(`${viewerId}:${videoId}`);
   }
   
   /* ========================= STREAMING (Range / partial content) ========================= */
   
   // Parse header Range: "bytes=0-1023", "bytes=1024-", "bytes=-500"
   // return: null (tidak ada Range), 'invalid', atau { start, end }
   // end dibatasi MAX_CHUNK; server membalas 206 + Content-Range yang benar,
   // browser otomatis meminta potongan berikutnya.
   function parseRange(header, size) {
     if (!header) return null;
     const m = /^bytes=(\d*)-(\d*)$/.exec(header);
     if (!m || (m[1] === '' && m[2] === '')) return 'invalid';
   
     let start;
     let end;
     if (m[1] === '') {
       const suffix = parseInt(m[2], 10);
       start = Math.max(size - suffix, 0);
       end = size - 1;
     } else {
       start = parseInt(m[1], 10);
       end = m[2] === '' ? size - 1 : Math.min(parseInt(m[2], 10), size - 1);
     }
     if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) return 'invalid';
   
     if (MAX_CHUNK > 0) end = Math.min(end, start + MAX_CHUNK - 1);
     return { start, end };
   }
   
   // Stream video dari Drive ke response, mendukung Range (seek/partial content)
   async function streamVideo(req, res, videoId, meta) {
     const size = Number(meta.size);
     const range = parseRange(req.headers.range, size);
   
     if (range === 'invalid') {
       res.setHeader('Content-Range', `bytes */${size}`);
       return res.status(416).end();
     }
   
     const requestOptions = { responseType: 'stream' };
     if (range) requestOptions.headers = { Range: `bytes=${range.start}-${range.end}` };
   
     const fileStream = await drive.files.get(
       { fileId: videoId, alt: 'media', supportsAllDrives: true },
       requestOptions
     );
   
     res.setHeader('Content-Type', meta.mimeType);
     res.setHeader('Accept-Ranges', 'bytes');
     res.setHeader('X-Content-Type-Options', 'nosniff');
     // private = tidak disimpan CDN/proxy, tapi browser boleh cache supaya seek tidak unduh ulang
     res.setHeader('Cache-Control', 'private, max-age=3600');
     // supaya Nginx tidak menahan stream di buffer
     res.setHeader('X-Accel-Buffering', 'no');
     // inline = diputar di browser; nama file asli tidak dibocorkan
     res.setHeader('Content-Disposition', 'inline');
   
     if (range) {
       res.status(206);
       res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
       res.setHeader('Content-Length', range.end - range.start + 1);
     } else {
       res.status(200);
       res.setHeader('Content-Length', size);
     }
   
     // Hentikan download dari Drive kalau client menutup koneksi (misal user seek / pindah halaman)
     res.on('close', () => fileStream.data.destroy());
   
     fileStream.data.on('error', (err) => {
       console.error('streamVideo:', err.message);
       if (!res.headersSent) {
         res.status(500).json({ status: 'error', message: 'Gagal membaca video dari Drive.' });
       } else {
         res.destroy(err);
       }
     });
   
     fileStream.data.pipe(res);
   }
   
   /* ========================= BUILDER LINK SHARE ========================= */
   // Link share, kode iframe, dan link ke media sosial untuk 1 video.
   // Dipakai videoController (menempel di daftar video) dan shareController (halaman share/embed).
   
   function buildShare(base, shortId, title) {
     const shareUrl = `${base}/share/${shortId}`;
     const embedUrl = `${base}/embed/${shortId}`;
     const eu = encodeURIComponent(shareUrl);
     const et = encodeURIComponent(title);
     return {
       shareId: shortId,
       shareUrl,
       embedUrl,
       embedCode: `<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allow="fullscreen; autoplay" allowfullscreen loading="lazy" title="${escapeHtml(title)}"></iframe>`,
       social: {
         whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${shareUrl}`)}`,
         facebook: `https://www.facebook.com/sharer/sharer.php?u=${eu}`,
         twitter: `https://twitter.com/intent/tweet?url=${eu}&text=${et}`,
         telegram: `https://t.me/share/url?url=${eu}&text=${et}`,
         linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${eu}`,
       },
     };
   }
   
   module.exports = {
     API_BASE_PATH,
     VIDEO_REQUIRE_FETCH_DEST,
     VIEWS_SHEET,
     GUEST_TOKEN_TTL_MS,
     escapeHtml,
     getClientIp,
     getBaseUrl,
     buildShare,
     makeShortId,
     getVideoList,
     resolveVideoId,
     getVideoMeta,
     isAllowedVideo,
     videoTitle,
     createGuestToken,
     readGuestToken,
     inspectGuestToken,
     getGuestParams,
     evaluateGuestAccess,
     checkGuestAccess,
     guestTokenStatus,
     getViewsMap,
     addView,
     alreadyCounted,
     forgetView,
     streamVideo,
   };