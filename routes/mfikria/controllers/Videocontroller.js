const crypto = require('crypto');
const { spreadsheetId, sheets } = require('../config/spreadsheetConfig');
const { drive, defaultFolderId, getFileMetadata } = require('../config/driveConfig');
const {
  ADMIN_SECRET_TOKEN,
  USER_SECRET_TOKEN,
  APP_TIMEZONE,
  IV_LENGTH,
  nowStamp,
  safeEqual,
  padDate,
  withLock,
} = require('../utils/common');

/* ========================= HELPER ========================= */

// Tanggal upload video mengikuti APP_TIMEZONE (WIB), bukan UTC
function formatUploadDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    tanggal: `${get('day')}-${get('month')}-${get('year')}`, // 09-10-2026
    pukul: `${get('hour')}:${get('minute')}`,                // 15:35
  };
}

/* ===== Token URL video: terenkripsi (AES-256-GCM) ===== */

const VIDEO_TOKEN_KEY = crypto
  .createHash('sha256')
  .update(process.env.VIDEO_URL_SECRET || `video|${ADMIN_SECRET_TOKEN}|${USER_SECRET_TOKEN}`)
  .digest();

// Prefix tempat router ini di-mount di app (app.use('/mfikria/v1', router)), dipakai untuk membentuk videoUrl
const API_BASE_PATH = (process.env.API_BASE_PATH || '/mfikria/v1').replace(/\/+$/, '');

// Masa berlaku token video (ms). Set VIDEO_TOKEN_TTL_MS=0 untuk tanpa kedaluwarsa.
const VIDEO_TOKEN_TTL_MS = Number(process.env.VIDEO_TOKEN_TTL_MS ?? 6 * 60 * 60 * 1000);

// true = stream video hanya dilayani untuk request dari elemen <video> (header Sec-Fetch-Dest: video).
// Membuka URL langsung di tab browser / tombol "Save as" / fetch() akan ditolak (404).
// Set VIDEO_REQUIRE_FETCH_DEST=false kalau perlu mendukung browser yang sangat lama.
const VIDEO_REQUIRE_FETCH_DEST = String(process.env.VIDEO_REQUIRE_FETCH_DEST || 'true').toLowerCase() !== 'false';

function createVideoToken(videoId) {
  const payload = { v: videoId };
  if (VIDEO_TOKEN_TTL_MS > 0) payload.e = Date.now() + VIDEO_TOKEN_TTL_MS;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', VIDEO_TOKEN_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

function readVideoToken(token) {
  try {
    const raw = Buffer.from(String(token), 'base64url');
    if (raw.length < IV_LENGTH + 16 + 2) return null;
    const iv = raw.subarray(0, IV_LENGTH);
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
    const encrypted = raw.subarray(IV_LENGTH + 16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', VIDEO_TOKEN_KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const payload = JSON.parse(decrypted.toString('utf8'));

    if (typeof payload.v !== 'string' || !payload.v) return null;
    if (payload.e && Date.now() > payload.e) return null; // kedaluwarsa
    return payload;
  } catch (error) {
    return null;
  }
}

/* ===== Guest token: token tanpa login, dicatat di Google Sheet (tab "GuestTokens") ===== */
// Kolom tab GuestTokens: A userId | B Access_Token | C tanggal (DDMMYY) | D pukul (HHMM)
// Buat dulu tab bernama "GuestTokens" (header baris 1: userId, Access_Token, tanggal, pukul)
// di spreadsheet yang sama. Tanggal & pukul = waktu user masuk ke website.

const GUEST_SHEET = process.env.GUEST_SHEET_NAME || 'GuestTokens';
const GUEST_TOKEN_TTL_MS = Number(process.env.GUEST_TOKEN_TTL_MS ?? 24 * 60 * 60 * 1000);
const GUEST_TOKEN_MAX_PER_HOUR = Number(process.env.GUEST_TOKEN_MAX_PER_HOUR ?? 10);
// Endpoint video SELALU wajib menyertakan ?query=<Access_Token guest>&tgl=<tanggal guest>

const GUEST_TOKEN_KEY = crypto
  .createHash('sha256')
  .update(process.env.GUEST_TOKEN_SECRET || `guest|${ADMIN_SECRET_TOKEN}|${USER_SECRET_TOKEN}`)
  .digest();

// ID guest urut berdasarkan isi sheet: angka terbesar di kolom A + 1 (sama dengan jumlah baris
// selama tidak ada baris yang dihapus). Contoh: G001, G002, ... Dipanggil di dalam withLock.
async function nextGuestId() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${GUEST_SHEET}!A2:A`,
  });
  const rows = response.data.values || [];
  const maxNumber = rows.reduce((max, row) => {
    const n = parseInt(String(row[0] || '').replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `G${String(maxNumber + 1).padStart(3, '0')}`;
}

function createGuestToken(userId, tanggal, expiresAt) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', GUEST_TOKEN_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ u: userId, d: tanggal, e: expiresAt }), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

function readGuestToken(token) {
  try {
    const raw = Buffer.from(String(token), 'base64url');
    if (raw.length < IV_LENGTH + 16 + 2) return null;
    const iv = raw.subarray(0, IV_LENGTH);
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
    const encrypted = raw.subarray(IV_LENGTH + 16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', GUEST_TOKEN_KEY, iv);
    decipher.setAuthTag(tag);
    const payload = JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'));
    if (typeof payload.u !== 'string' || !payload.u) return null;
    if (typeof payload.d !== 'string' || !payload.d) return null;
    if (payload.e && Date.now() > payload.e) return null; // kedaluwarsa
    return payload;
  } catch (error) {
    return null;
  }
}

// Guest token dikirim lewat query string (tag <video src> tidak bisa kirim header):
//   ?query=<Access_Token guest>&tgl=<tanggal guest, DDMMYY>
function getGuestParams(req) {
  const q = typeof req.query.query === 'string' ? req.query.query : '';
  const tgl = typeof req.query.tgl === 'string' ? req.query.tgl : '';
  return { q, tgl };
}

// Batasi jumlah token per IP per jam (melindungi kuota Sheets API). In-memory, 1 instance server.
const guestRate = new Map();
function guestRateLimited(ip) {
  const now = Date.now();
  if (guestRate.size > 5000) {
    for (const [k, v] of guestRate) if (now > v.resetAt) guestRate.delete(k);
  }
  const entry = guestRate.get(ip);
  if (!entry || now > entry.resetAt) {
    guestRate.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  entry.count += 1;
  return entry.count > GUEST_TOKEN_MAX_PER_HOUR;
}

function getClientIp(req) {
  // Kalau di belakang proxy/Nginx, set app.set('trust proxy', 1) supaya req.ip benar
  return req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
}

// Dipakai di endpoint video. Token harus valid, belum kedaluwarsa, dan tgl harus sama
// dengan tanggal yang tercatat di token (= tanggal di sheet GuestTokens). Return true jika boleh lanjut.
function checkGuestAccess(req, res) {
  const { q, tgl } = getGuestParams(req);
  const payload = q ? readGuestToken(q) : null;
  if (payload && safeEqual(padDate(tgl), padDate(payload.d))) return true;

  res.status(401).json({
    status: 'error',
    message: '401 Unauthorized: query (guest token) atau tgl tidak valid / kedaluwarsa.',
  });
  return false;
}

/* ===== View counter video: disimpan di Google Sheet (tab "VideoViews") ===== */
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

// Satu guest hanya dihitung 1 view per video dalam rentang VIEW_DEDUPE_MS (in-memory, per instance server)
const recentViews = new Map();
function alreadyCounted(guestId, videoId) {
  const now = Date.now();
  if (recentViews.size > 5000) {
    for (const [k, t] of recentViews) if (now - t > VIEW_DEDUPE_MS) recentViews.delete(k);
  }
  const key = `${guestId}:${videoId}`;
  const last = recentViews.get(key);
  if (last && now - last < VIEW_DEDUPE_MS) return true;
  recentViews.set(key, now);
  return false;
}
function forgetView(guestId, videoId) {
  recentViews.delete(`${guestId}:${videoId}`);
}

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

// Parse header Range: "bytes=0-1023", "bytes=1024-", "bytes=-500"
// return: null (tidak ada Range), 'invalid', atau { start, end }
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
  res.setHeader('Cache-Control', 'private, no-store');
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

/* ========================= GUEST TOKEN (tanpa login, dicatat di Google Sheet) ========================= */
// POST /mfikria/guest-token  (tanpa Bearer token, tanpa body)
// Dipanggil front end saat user pertama kali masuk ke website. Mengembalikan:
// { userId, Access_Token, pukul, tanggal } dan mencatat baris yang sama di tab "GuestTokens".

exports.issueGuestToken = async (req, res) => {
  if (guestRateLimited(getClientIp(req))) {
    return res.status(429).json({ status: 'error', message: '429 Too Many Requests: Terlalu banyak permintaan token, coba lagi nanti.' });
  }

  try {
    // Baca-lalu-tulis diantre lewat withLock supaya dua guest tidak dapat ID yang sama
    const { userId, accessToken, tgllogin, pukullogin } = await withLock(async () => {
      const userId = await nextGuestId();
      const { tgllogin, pukullogin } = nowStamp();
      const expiresAt = GUEST_TOKEN_TTL_MS > 0 ? Date.now() + GUEST_TOKEN_TTL_MS : 0;
      const accessToken = createGuestToken(userId, tgllogin, expiresAt);

      // RAW: "0850" tetap string dan tidak bisa jadi formula
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${GUEST_SHEET}!A:D`,
        valueInputOption: 'RAW',
        requestBody: { values: [[userId, accessToken, tgllogin, pukullogin]] },
      });
      return { userId, accessToken, tgllogin, pukullogin };
    });
    guestViewCache.at = 0; // guest baru masuk: hitungan /guest-view dibaca ulang

    return res.status(200).json({
      status: 'success',
      message: 'Guest token berhasil dibuat.',
      data: {
        userId,
        Access_Token: accessToken,
        pukul: pukullogin,
        tanggal: tgllogin,
      },
    });
  } catch (error) {
    console.error('issueGuestToken:', error.message, error.errors || '');
    const msg = String(error.message || '');
    let hint = null;
    if (/Unable to parse range/i.test(msg)) {
      hint = `Tab Google Sheet "${GUEST_SHEET}" tidak ditemukan. Buat tab dengan nama itu.`;
    } else if (error.code === 403 || /permission|caller does not have/i.test(msg)) {
      hint = 'Service account belum punya akses Editor ke spreadsheet.';
    }
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server saat membuat guest token.',
      ...(hint ? { hint } : {}),
    });
  }
};

/* ========================= GUEST VIEW (jumlah guest di Google Sheet) ========================= */
// GET /guest-view  -> { status, view } : jumlah baris di tab "GuestTokens" yang kolom A (userId) terisi.
// Di-cache 30 detik supaya endpoint publik ini tidak menghabiskan kuota Sheets API.

const GUEST_VIEW_CACHE_MS = 30 * 1000;
let guestViewCache = { count: 0, at: 0 };

exports.getGuestView = async (req, res) => {
  try {
    if (guestViewCache.at && Date.now() - guestViewCache.at < GUEST_VIEW_CACHE_MS) {
      return res.status(200).json({ status: 'success', view: guestViewCache.count });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${GUEST_SHEET}!A2:A`, // lewati header baris 1
    });
    const rows = response.data.values || [];
    const count = rows.filter((row) => row[0] && String(row[0]).trim() !== '').length;

    guestViewCache = { count, at: Date.now() };
    return res.status(200).json({ status: 'success', view: count });
  } catch (error) {
    console.error('getGuestView:', error.message, error.errors || '');
    const hint = /Unable to parse range/i.test(String(error.message))
      ? `Tab Google Sheet "${GUEST_SHEET}" tidak ditemukan. Buat tab dengan nama itu.`
      : null;
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server saat mengambil jumlah view.',
      ...(hint ? { hint } : {}),
    });
  }
};

/* ========================= VIDEO (akses lewat guest token, URL terenkripsi) ========================= */

// GET /videos?query=&tgl=  -> daftar video + URL terenkripsi + tanggal upload + views
exports.getFolderVideos = async (req, res) => {
  if (!checkGuestAccess(req, res)) return;

  if (!defaultFolderId) {
    return res.status(500).json({ status: 'error', message: 'Folder Drive belum dikonfigurasi.' });
  }

  try {
    const files = await listVideosFromFolder(defaultFolderId);
    const viewsMap = await getViewsMap(); // views dari tab "VideoViews"
    // URL video langsung bisa diputar: query & tgl milik guest yang memanggil ikut ditempel
    const { q, tgl } = getGuestParams(req);
    const guestSuffix = `?query=${encodeURIComponent(q)}&tgl=${encodeURIComponent(tgl)}`;

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil daftar video.',
      totalVideos: files.length,
      data: files.map((file) => {
        const token = createVideoToken(file.id);
        return {
          title: file.name.replace(/\.[^.]+$/, ''), // tanpa ekstensi
          mimeType: file.mimeType,
          size: Number(file.size) || null,
          videoToken: token, // token terenkripsi tiap video
          views: viewsMap.get(file.id) || 0,
          uploadedAt: file.createdTime || null, // tanggal upload ke Drive (ISO UTC)
          uploadedAtLocal: formatUploadDate(file.createdTime), // { tanggal, pukul } WIB
          videoUrl: `${API_BASE_PATH}/video/${token}${guestSuffix}`, // videoId asli tidak terlihat
          expiresAt: VIDEO_TOKEN_TTL_MS > 0 ? new Date(Date.now() + VIDEO_TOKEN_TTL_MS).toISOString() : null,
        };
      }),
    });
  } catch (error) {
    console.error('getFolderVideos:', error);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mengambil daftar video.' });
  }
};

// GET /video/:token?query=&tgl=  -> stream video
exports.getVideo = async (req, res) => {
  const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });

  if (!checkGuestAccess(req, res)) return;

  try {
    const data = readVideoToken(req.params.token);
    if (!data) return notFound();

    // Hanya boleh diputar lewat elemen <video>, bukan dibuka/diunduh langsung
    if (VIDEO_REQUIRE_FETCH_DEST && req.headers['sec-fetch-dest'] !== 'video') return notFound();

    let meta;
    try {
      meta = await getFileMetadata(data.v);
    } catch (err) {
      return notFound();
    }

    // Harus berupa video dan berada di folder yang diizinkan
    const inFolder = !defaultFolderId || (meta.parents || []).includes(defaultFolderId);
    if (!String(meta.mimeType).startsWith('video/') || !inFolder) return notFound();

    // Pastikan size tersedia (getFileMetadata kadang tidak mengembalikannya)
    if (meta.size === undefined) {
      const full = await drive.files.get({
        fileId: data.v,
        fields: 'size, mimeType',
        supportsAllDrives: true,
      });
      meta = { ...meta, size: full.data.size, mimeType: full.data.mimeType };
    }

    return await streamVideo(req, res, data.v, meta);
  } catch (error) {
    console.error('getVideo:', error);
    const code = error.code || (error.response && error.response.status);
    if (code === 404) return notFound();
    if (!res.headersSent) {
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mengambil video.' });
    }
  }
};

// GET /video-info/:token?query=&tgl=  -> info video (judul, ukuran, views, tanggal upload)
exports.getVideoInfo = async (req, res) => {
  const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });

  if (!checkGuestAccess(req, res)) return;

  try {
    const data = readVideoToken(req.params.token);
    if (!data) return notFound();

    let file;
    try {
      const result = await drive.files.get({
        fileId: data.v,
        fields: 'name, mimeType, size, parents, createdTime',
        supportsAllDrives: true,
      });
      file = result.data;
    } catch (err) {
      return notFound();
    }

    const inFolder = !defaultFolderId || (file.parents || []).includes(defaultFolderId);
    if (!String(file.mimeType).startsWith('video/') || !inFolder) return notFound();

    const viewsMap = await getViewsMap();

    return res.status(200).json({
      status: 'success',
      data: {
        title: String(file.name || '').replace(/\.[^.]+$/, ''),
        mimeType: file.mimeType,
        size: Number(file.size) || null,
        views: viewsMap.get(data.v) || 0,
        uploadedAt: file.createdTime || null,
        uploadedAtLocal: formatUploadDate(file.createdTime),
        expiresAt: data.e ? new Date(data.e).toISOString() : null,
      },
    });
  } catch (error) {
    console.error('getVideoInfo:', error);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mengambil info video.' });
  }
};

// POST /video-view/:token?query=&tgl=  -> catat 1 view ke Google Sheet (tab "VideoViews")
// Dipanggil front end SEKALI setelah video benar-benar diputar beberapa detik (bukan tiap request stream).
exports.registerVideoView = async (req, res) => {
  const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });

  if (!checkGuestAccess(req, res)) return;

  let guestId = null;
  let videoId = null;
  try {
    const data = readVideoToken(req.params.token);
    if (!data) return notFound();
    videoId = data.v;

    let file;
    try {
      const result = await drive.files.get({
        fileId: videoId,
        fields: 'name, mimeType, parents',
        supportsAllDrives: true,
      });
      file = result.data;
    } catch (err) {
      return notFound();
    }

    const inFolder = !defaultFolderId || (file.parents || []).includes(defaultFolderId);
    if (!String(file.mimeType).startsWith('video/') || !inFolder) return notFound();

    const guest = readGuestToken(getGuestParams(req).q);
    guestId = guest.u;

    if (alreadyCounted(guestId, videoId)) {
      const map = await getViewsMap();
      return res.status(200).json({ status: 'success', data: { views: map.get(videoId) || 0, counted: false } });
    }

    const title = String(file.name || '').replace(/\.[^.]+$/, '');
    const views = await addView(videoId, title);
    return res.status(200).json({ status: 'success', data: { views, counted: true } });
  } catch (error) {
    if (guestId && videoId) forgetView(guestId, videoId); // gagal tulis: boleh dicoba lagi
    console.error('registerVideoView:', error.message, error.errors || '');
    const hint = /Unable to parse range/i.test(String(error.message))
      ? `Tab Google Sheet "${VIEWS_SHEET}" tidak ditemukan. Buat tab dengan nama itu.`
      : null;
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server saat mencatat view.',
      ...(hint ? { hint } : {}),
    });
  }
};