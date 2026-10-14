const crypto = require('crypto');
const { spreadsheetId, sheets } = require('../config/spreadsheetConfig');
const { defaultFolderId } = require('../config/driveConfig');
const { APP_TIMEZONE, nowStamp, withLock } = require('../utilitis/Common');
const {
  API_BASE_PATH,
  VIDEO_REQUIRE_FETCH_DEST,
  VIEWS_SHEET,
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
  guestTokenStatus,
  getGuestParams,
  checkGuestAccess,
  getViewsMap,
  addView,
  alreadyCounted,
  forgetView,
  streamVideo,
} = require('../utilitis/Mfikriawebcore');
// BARU: kirim video lewat redirect ke Drive (hemat Fast Origin Transfer)
const { sendVideo, fetchThumbnail } = require('../utilitis/Drivedirect');

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

// Acak urutan (Fisher-Yates dengan crypto.randomInt, bukan Math.random)
function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Video pertama tidak boleh sama dengan video pertama yang barusan dikirim ke penonton yang sama
// (guest / IP). In-memory, 1 instance server.
const lastFirstByViewer = new Map();
function pickOrder(files, viewerId) {
  const ordered = shuffle(files);
  if (ordered.length > 1) {
    const last = lastFirstByViewer.get(viewerId);
    if (last && ordered[0].id === last) {
      const j = crypto.randomInt(1, ordered.length);
      [ordered[0], ordered[j]] = [ordered[j], ordered[0]];
    }
    if (lastFirstByViewer.size > 5000) lastFirstByViewer.clear();
    lastFirstByViewer.set(viewerId, ordered[0].id);
  }
  return ordered;
}

/* ========================= GUEST TOKEN (tanpa login, dicatat di Google Sheet) ========================= */
// Kolom tab GuestTokens: A userId | B Access_Token | C tanggal (DDMMYY) | D pukul (HHMM) | E expired (ISO)
// Buat dulu tab bernama "GuestTokens" (header baris 1: userId, Access_Token, tanggal, pukul, expired)
// di spreadsheet yang sama. Tanggal & pukul = waktu user masuk ke website.
//
// Token berlaku 24 jam (diatur di mfikriaWebCore). Lewat 24 jam, backend membalas 401 dengan
// code GUEST_TOKEN_EXPIRED dan frontend membuat token baru lewat POST /guest-token.

const GUEST_SHEET = 'GuestTokens'; // nama tab tetap
const GUEST_TOKEN_MAX_PER_HOUR = Number(process.env.GUEST_TOKEN_MAX_PER_HOUR ?? 10);

// Petunjuk singkat untuk error Google Sheets yang umum
function sheetHint(error, sheetName) {
  const msg = String((error && error.message) || '');
  if (/Unable to parse range/i.test(msg)) return `Tab Google Sheet "${sheetName}" tidak ditemukan. Buat tab dengan nama itu.`;
  if ((error && error.code === 403) || /permission|caller does not have/i.test(msg)) {
    return 'Service account belum punya akses Editor ke spreadsheet.';
  }
  return null;
}

// ID guest urut berdasarkan isi sheet: angka terbesar di kolom A + 1. Contoh: G001, G002, ...
// Dipanggil di dalam withLock.
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

const GUEST_VIEW_CACHE_MS = 30 * 1000;
let guestViewCache = { count: 0, at: 0 };

// POST /guest-token  (tanpa Bearer token, tanpa body)
// Dipanggil front end saat user pertama kali masuk ke website, atau saat token lama sudah expired (24 jam).
// Mengembalikan { userId, Access_Token, tanggal, pukul, expiresAt, ... } dan mencatat baris di tab "GuestTokens".
// Kegagalan menulis ke sheet TIDAK membuat endpoint ini 500: token tetap diberikan, error dicatat di log.
exports.issueGuestToken = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (guestRateLimited(getClientIp(req))) {
    return res.status(429).json({ status: 'error', message: '429 Too Many Requests: Terlalu banyak permintaan token, coba lagi nanti.' });
  }

  try {
    // Baca-lalu-tulis diantre lewat withLock supaya dua guest tidak dapat ID yang sama
    const result = await withLock(async () => {
      const { tgllogin, pukullogin } = nowStamp();

      let userId;
      try {
        userId = await nextGuestId();
      } catch (error) {
        // sheet tidak bisa dibaca: pakai ID acak supaya guest tetap mendapat token
        userId = `G${crypto.randomBytes(4).toString('hex')}`;
        console.error('issueGuestToken nextGuestId:', error.message, sheetHint(error, GUEST_SHEET) || '');
      }

      // createGuestToken mengembalikan OBJEK { token, issuedAt, expiresAt } (masa berlaku 24 jam)
      const issued = createGuestToken(userId, tgllogin);

      try {
        // RAW: "0850" tetap string dan tidak bisa jadi formula. Semua nilai harus string/angka, bukan objek.
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${GUEST_SHEET}!A:E`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[userId, issued.token, tgllogin, pukullogin, new Date(issued.expiresAt).toISOString()]],
          },
        });
      } catch (error) {
        console.error('issueGuestToken append:', error.message, sheetHint(error, GUEST_SHEET) || '');
      }

      return { userId, issued, tgllogin, pukullogin };
    });

    guestViewCache.at = 0; // guest baru masuk: hitungan /guest-view dibaca ulang

    return res.status(200).json({
      status: 'success',
      message: 'Guest token berhasil dibuat.',
      data: {
        userId: result.userId,
        Access_Token: result.issued.token,
        token: result.issued.token, // alias, dibaca frontend baru
        tanggal: result.tgllogin,
        tgl: result.tgllogin, // alias, dibaca frontend baru
        pukul: result.pukullogin,
        expiresAt: result.issued.expiresAt,
        expiresInMs: Math.max(result.issued.expiresAt - Date.now(), 0),
      },
    });
  } catch (error) {
    console.error('issueGuestToken:', error.message, error.errors || '');
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server saat membuat guest token.',
      ...(process.env.APP_DEBUG === '1' ? { reason: String(error.message || error) } : {}),
    });
  }
};

// GET /guest-token/status?query=&tgl=  (atau header x-guest-token / x-guest-date)
// Frontend mengirim token dari sessionStorage; backend menjawab masih bisa dipakai atau tidak.
// Selalu 200; baca data.valid. Kalau valid:false (atau expired) -> frontend membuat token baru.
exports.guestTokenStatus = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    return res.status(200).json({ status: 'success', data: guestTokenStatus(req) });
  } catch (error) {
    console.error('guestTokenStatus:', error.message);
    return res.status(500).json({ status: 'error', message: 'Gagal memeriksa guest token.' });
  }
};

// GET /guest-view  -> { status, view } : jumlah baris di tab "GuestTokens" yang kolom A (userId) terisi.
// Di-cache 30 detik supaya endpoint publik ini tidak menghabiskan kuota Sheets API.
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
    const hint = sheetHint(error, GUEST_SHEET);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server saat mengambil jumlah view.',
      ...(hint ? { hint } : {}),
    });
  }
};

/* ========================= VIDEO (akses lewat guest token, token pendek 10 karakter) ========================= */

// GET /videos?query=&tgl=  -> daftar video + token pendek + tanggal upload + views + info share
// Urutan DIACAK di setiap request, dan video pertama tidak sama dengan video pertama sebelumnya
// untuk penonton yang sama. Tambahkan &shuffle=0 untuk urutan asli (nama A-Z).
exports.getFolderVideos = async (req, res) => {
  if (!checkGuestAccess(req, res)) return;

  if (!defaultFolderId) {
    return res.status(500).json({ status: 'error', message: 'Folder Drive belum dikonfigurasi.' });
  }

  try {
    const files = await getVideoList(); // di-cache 60 detik + mengisi index token pendek
    const viewsMap = await getViewsMap(); // views dari tab "VideoViews"
    // URL video langsung bisa diputar: query & tgl milik guest yang memanggil ikut ditempel
    const { q, tgl } = getGuestParams(req);
    const guestSuffix = `?query=${encodeURIComponent(q)}&tgl=${encodeURIComponent(tgl)}`;
    const base = getBaseUrl(req);

    // Penonton = guest (dari token); cadangan: IP
    const guest = readGuestToken(q);
    const viewerId = guest ? guest.u : getClientIp(req);
    const ordered = req.query.shuffle === '0' ? files : pickOrder(files, viewerId);

    res.setHeader('Cache-Control', 'no-store'); // urutan acak, jangan di-cache browser/CDN

    // ?compact=1 -> JSON ramping (tanpa share/videoUrl/mimeType/uploadedAt) supaya hemat transfer.
    // Frontend membangun URL video sendiri: `${API}/video/${videoToken}?query=..&tgl=..`
    // dan memanggil /share-info/:token hanya saat tombol Share ditekan.
    const compact = req.query.compact === '1';

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil daftar video.',
      totalVideos: ordered.length,
      data: ordered.map((file) => {
        const token = makeShortId(file.id); // 10 karakter, stabil
        const title = file.name.replace(/\.[^.]+$/, ''); // tanpa ekstensi
        const item = {
          title,
          size: Number(file.size) || null,
          videoToken: token,
          views: viewsMap.get(file.id) || 0,
          uploadedAtLocal: formatUploadDate(file.createdTime), // { tanggal, pukul } WIB
        };
        if (!compact) {
          // format lengkap (lama), untuk frontend yang belum diubah
          item.mimeType = file.mimeType;
          item.uploadedAt = file.createdTime || null; // ISO UTC
          item.videoUrl = `${API_BASE_PATH}/video/${token}${guestSuffix}`;
          item.share = buildShare(base, token, title);
          item.expiresAt = null;
        }
        return item;
      }),
    });
  } catch (error) {
    console.error('getFolderVideos:', error);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mengambil daftar video.' });
  }
};

// GET /video/:token?query=&tgl=  -> redirect 302 ke Drive (video tidak lewat server Vercel)
exports.getVideo = async (req, res) => {
  const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });

  if (!checkGuestAccess(req, res)) return;

  try {
    // Tolak hanya kalau header ada dan jelas bukan dari elemen <video>
    const dest = req.headers['sec-fetch-dest'];
    if (VIDEO_REQUIRE_FETCH_DEST && dest && dest !== 'video') return notFound();

    const videoId = await resolveVideoId(req.params.token);
    if (!videoId) return notFound();

    let meta;
    try {
      meta = await getVideoMeta(videoId); // di-cache, tidak memanggil Drive tiap request Range
    } catch (err) {
      return notFound();
    }

    if (!isAllowedVideo(meta) || meta.size === undefined) return notFound();

    // BERUBAH: sebelumnya `return await streamVideo(req, res, videoId, meta);`
    return await sendVideo(req, res, videoId, meta, streamVideo);
  } catch (error) {
    console.error('getVideo:', error);
    const code = error.code || (error.response && error.response.status);
    if (code === 404) return notFound();
    if (!res.headersSent) {
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mengambil video.' });
    }
  }
};

// GET /video-info/:token?query=&tgl=  -> info video (judul, ukuran, views, tanggal upload, share)
exports.getVideoInfo = async (req, res) => {
  const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });

  if (!checkGuestAccess(req, res)) return;

  try {
    const videoId = await resolveVideoId(req.params.token);
    if (!videoId) return notFound();

    let file;
    try {
      file = await getVideoMeta(videoId);
    } catch (err) {
      return notFound();
    }

    if (!isAllowedVideo(file)) return notFound();

    const viewsMap = await getViewsMap();
    const title = videoTitle(file);

    res.setHeader('Cache-Control', 'private, max-age=60'); // hemat transfer: browser boleh simpan 1 menit
    return res.status(200).json({
      status: 'success',
      data: {
        title,
        mimeType: file.mimeType,
        size: Number(file.size) || null,
        views: viewsMap.get(videoId) || 0,
        uploadedAt: file.createdTime || null,
        uploadedAtLocal: formatUploadDate(file.createdTime),
        share: buildShare(getBaseUrl(req), req.params.token, title),
        expiresAt: null,
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
    videoId = await resolveVideoId(req.params.token);
    if (!videoId) return notFound();

    let file;
    try {
      file = await getVideoMeta(videoId);
    } catch (err) {
      return notFound();
    }

    if (!isAllowedVideo(file)) return notFound();

    const guest = readGuestToken(getGuestParams(req).q);
    guestId = guest.u;

    if (alreadyCounted(guestId, videoId)) {
      const map = await getViewsMap();
      return res.status(200).json({ status: 'success', data: { views: map.get(videoId) || 0, counted: false } });
    }

    const views = await addView(videoId, videoTitle(file));
    return res.status(200).json({ status: 'success', data: { views, counted: true } });
  } catch (error) {
    if (guestId && videoId) forgetView(guestId, videoId); // gagal tulis: boleh dicoba lagi
    console.error('registerVideoView:', error.message, error.errors || '');
    const hint = sheetHint(error, VIEWS_SHEET);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server saat mencatat view.',
      ...(hint ? { hint } : {}),
    });
  }
};

// GET /thumb/:token  -> gambar cuplikan video (tanpa guest token, supaya URL-nya stabil dan bisa di-cache CDN).
// Aman karena token pendek 10 karakter tidak bisa ditebak. Gambar kecil (puluhan KB), bukan video.
exports.getThumb = async (req, res) => {
  const notFound = () => {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ status: 'error', message: '404 Not Found' });
  };

  try {
    const videoId = await resolveVideoId(req.params.token);
    if (!videoId) return notFound();

    let meta;
    try {
      meta = await getVideoMeta(videoId);
    } catch (err) {
      return notFound();
    }
    if (!isAllowedVideo(meta)) return notFound();

    const thumb = await fetchThumbnail(videoId);
    if (!thumb) return notFound();

    res.setHeader('Content-Type', thumb.type);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // frontend & API beda domain: izinkan <img> lintas origin (kalau memakai helmet)
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // Browser 1 hari, CDN Vercel 7 hari -> function hanya jalan sekali per gambar
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(thumb.buf);
  } catch (error) {
    console.error('getThumb:', error.message);
    return notFound();
  }
};