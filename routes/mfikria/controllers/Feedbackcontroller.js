const crypto = require('crypto');
const { spreadsheetId, sheets } = require('../config/spreadsheetConfig');
const {
  APP_TIMEZONE,
  ADMIN_SECRET_TOKEN,
  USER_SECRET_TOKEN,
  padDate,
  padTime,
} = require('../utilitis/Common');
const {
  getClientIp,
  readGuestToken,
  getGuestParams,
  checkGuestAccess,
} = require('../utilitis/Mfikriawebcore');

/* ========================= KONFIGURASI ========================= */

const FEEDBACK_SHEET = process.env.FEEDBACK_SHEET_NAME || 'Feedback';
const TYPES = ['saran', 'kritik', 'lainnya'];

const MAX_NAME = 40;
const MIN_MESSAGE = 5;
const MAX_MESSAGE = 1000;
const MAX_REPLIES_PER_THREAD = 100;
const DEFAULT_PAGE_SIZE = 5; // jumlah komentar utama per halaman
const USER_SHEET_RANGE = process.env.USER_SHEET_RANGE || 'Sheet1!A2:H'; // sheet akun login (sama dengan controller login)
const ADMIN_ROLE = 'admin'; // dicocokkan tanpa peduli huruf besar/kecil
const ADMIN_DISPLAY_NAME = process.env.FEEDBACK_ADMIN_NAME || 'mfikria_developer'; // nama yang tampil di balasan admin

const MAX_PER_HOUR_GUEST = Number(process.env.FEEDBACK_MAX_PER_HOUR_GUEST ?? 3);
const MAX_PER_HOUR_IP = Number(process.env.FEEDBACK_MAX_PER_HOUR_IP ?? 10);
const DUPLICATE_MS = 10 * 60 * 1000; // pesan yang sama dari guest yang sama ditolak selama 10 menit
const LIST_CACHE_MS = 30 * 1000;

/*
  Kolom sheet "Feedback" (baris 1 = header):
  A id | B createdAt | C nama | D tipe | E pesan | F rating | G tanggal | H pukul | I guestId | J tampil | K parentId

  Kolom K (parentId) BARU. Kosong = komentar utama. Berisi id komentar lain = balasan.
  Balasan admin: tambahkan baris manual di sheet, isi K dengan id komentar yang dibalas.
*/

/* ========================= HELPER ========================= */

function sheetHint(error, sheetName) {
  const msg = String((error && error.message) || '');
  if (/Unable to parse range/i.test(msg)) return `Tab Google Sheet "${sheetName}" tidak ditemukan. Buat tab dengan nama itu.`;
  if ((error && error.code === 403) || /permission|caller does not have/i.test(msg)) {
    return 'Service account belum punya akses Editor ke spreadsheet.';
  }
  return null;
}

// Buang karakter kontrol; singleLine = jadikan satu baris (untuk nama)
function clean(value, { max, singleLine = false }) {
  let text = String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  text = singleLine ? text.replace(/\s+/g, ' ') : text.replace(/\n{3,}/g, '\n\n');
  return text.trim().slice(0, max);
}

// Tanggal & jam mengikuti APP_TIMEZONE (WIB)
function stampWib(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    tanggal: `${get('day')}-${get('month')}-${get('year')}`, // 14-10-2026
    pukul: `${get('hour')}:${get('minute')}`, // 15:35
  };
}

// Pembatas sederhana per kunci (in-memory, 1 instance server). Return true kalau melewati batas.
function makeLimiter(max, windowMs) {
  const store = new Map();
  return (key) => {
    const now = Date.now();
    if (store.size > 5000) {
      for (const [k, v] of store) if (now > v.resetAt) store.delete(k);
    }
    const entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }
    entry.count += 1;
    return entry.count > max;
  };
}

const guestLimited = makeLimiter(MAX_PER_HOUR_GUEST, 60 * 60 * 1000);
const ipLimited = makeLimiter(MAX_PER_HOUR_IP, 60 * 60 * 1000);

const recentMessages = new Map(); // `${guestId}:${hash}` -> waktu
function isDuplicate(guestId, message) {
  const now = Date.now();
  if (recentMessages.size > 5000) {
    for (const [k, t] of recentMessages) if (now - t > DUPLICATE_MS) recentMessages.delete(k);
  }
  const hash = crypto.createHash('sha1').update(message.toLowerCase()).digest('hex');
  const key = `${guestId}:${hash}`;
  const last = recentMessages.get(key);
  if (last && now - last < DUPLICATE_MS) return { dup: true, key };
  recentMessages.set(key, now);
  return { dup: false, key };
}

/* ===== Verifikasi sesi admin: logika yang sama dengan verifySession di controller login ===== */

const keyCache = new Map();
function getSessionKey(secret, userId, username) {
  const material = `${secret}_${userId}_${username}`;
  if (!keyCache.has(material)) {
    keyCache.set(material, crypto.scryptSync(material, 'salt_company', 32));
  }
  return keyCache.get(material);
}

// Format token: iv:tag:data (hex), AES-256-GCM
function decryptSessionToken(token, key) {
  try {
    const parts = String(token).split(':');
    if (parts.length !== 3) return null;
    const [iv, tag, encrypted] = parts.map((p) => Buffer.from(p, 'hex'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    return null;
  }
}

// Return { userId, username, role } kalau: username ada di sheet user, role di sheet = admin,
// status login = true, dan encryptedQueryToken cocok dengan sesi login terakhir. Selain itu null.
async function findAdminSession(req) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const profile = body.profile && typeof body.profile === 'object' ? body.profile : {};
  const sessionTokens = body.sessionTokens && typeof body.sessionTokens === 'object' ? body.sessionTokens : {};

  const username = clean(body.username || profile.username, { max: 50, singleLine: true });
  const token = body.encryptedQueryToken || sessionTokens.encryptedQueryToken || req.headers['x-session-token'];
  if (!username || typeof token !== 'string' || !token) return null;

  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: USER_SHEET_RANGE });
  // Kolom: A userId | B username | C password | D role | E photoId | F status | G tanggal | H pukul
  const row = (response.data.values || []).find((r) => r[1] && r[1].toLowerCase() === username.toLowerCase());
  if (!row) return null;

  // Role dibaca dari sheet, bukan dari data yang dikirim client
  if (String(row[3] || '').trim().toLowerCase() !== ADMIN_ROLE) return null;
  if (!['true', 'online'].includes(String(row[5] || '').trim().toLowerCase())) return null;

  for (const secret of [ADMIN_SECRET_TOKEN, USER_SECRET_TOKEN]) {
    const payload = decryptSessionToken(token, getSessionKey(secret, row[0], row[1]));
    if (
      payload &&
      payload.userId === row[0] &&
      payload.nama === row[1] &&
      String(payload.tgllogin) === padDate(row[6]) &&
      String(payload.pukullogin) === padTime(row[7])
    ) {
      return { userId: row[0], username: row[1], role: row[3] };
    }
  }
  return null;
}

/* ========================= CACHE DAFTAR ========================= */

// roots   : komentar utama yang tampil (terbaru dulu), masing-masing punya .replies (terlama dulu)
// byId    : semua item yang tampil (komentar & balasan) untuk validasi parent
let listCache = { roots: null, byId: null, at: 0 };

function rowToItem(row) {
  const rating = parseInt(row[5], 10);
  return {
    id: String(row[0] || ''),
    createdAt: String(row[1] || ''),
    nama: String(row[2] || 'Anonim'),
    tipe: String(row[3] || 'saran'),
    pesan: String(row[4] || ''),
    rating: Number.isFinite(rating) ? rating : null,
    tanggal: String(row[6] || ''),
    pukul: String(row[7] || ''),
    hidden: String(row[9] || '').trim().toLowerCase() === 'tidak',
    parentId: String(row[10] || '').trim(),
  };
}

function publicItem({ hidden, ...item }) {
  return item;
}

// Baca seluruh komentar yang tampil. Di-cache 30 detik supaya kuota Sheets API aman.
async function loadVisible() {
  if (listCache.roots && Date.now() - listCache.at < LIST_CACHE_MS) return listCache;
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${FEEDBACK_SHEET}!A2:K`,
    });
    const items = (response.data.values || [])
      .filter((row) => row && row[0] && row[4])
      .map(rowToItem)
      .filter((item) => !item.hidden); // urutan sheet: terlama di atas

    const byId = new Map(items.map((item) => [item.id, item]));
    const roots = [];
    const repliesOf = new Map();

    for (const item of items) {
      // Balasan yang induknya tersembunyi/hilang ikut tidak ditampilkan
      if (item.parentId) {
        if (!byId.has(item.parentId)) continue;
        if (!repliesOf.has(item.parentId)) repliesOf.set(item.parentId, []);
        repliesOf.get(item.parentId).push(item);
      } else {
        roots.push(item);
      }
    }

    for (const root of roots) {
      root.replies = (repliesOf.get(root.id) || []).map(publicItem);
    }
    roots.reverse(); // komentar terbaru dulu, balasan tetap terlama dulu

    listCache = { roots, byId, at: Date.now() };
    return listCache;
  } catch (error) {
    if (listCache.roots) return listCache; // sheet bermasalah: pakai data terakhir
    throw error;
  }
}

/* ========================= ENDPOINT ========================= */

// GET /feedback?page=1&limit=10&tipe=saran|kritik|lainnya
// Publik (tanpa guest token) supaya bisa di-cache CDN. Tidak mengirim guestId / IP.
// Hanya komentar utama yang dipaginasi; setiap komentar membawa array "replies" dan "replyCount".
exports.listFeedback = async (req, res) => {
  try {
    const { roots: all } = await loadVisible();

    const tipe = typeof req.query.tipe === 'string' ? req.query.tipe.toLowerCase() : '';
    const filtered = TYPES.includes(tipe) ? all.filter((item) => item.tipe === tipe) : all;

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, 1), 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const start = (page - 1) * limit;

    const rated = all.filter((item) => item.rating);
    const avgRating = rated.length
      ? Math.round((rated.reduce((sum, item) => sum + item.rating, 0) / rated.length) * 10) / 10
      : null;

    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({
      status: 'success',
      total: filtered.length,
      page,
      limit,
      hasMore: start + limit < filtered.length,
      summary: {
        total: all.length,
        saran: all.filter((i) => i.tipe === 'saran').length,
        kritik: all.filter((i) => i.tipe === 'kritik').length,
        lainnya: all.filter((i) => i.tipe === 'lainnya').length,
        avgRating,
      },
      data: filtered.slice(start, start + limit).map((item) => ({
        ...publicItem(item),
        replyCount: item.replies.length,
      })),
    });
  } catch (error) {
    console.error('listFeedback:', error.message, error.errors || '');
    const hint = sheetHint(error, FEEDBACK_SHEET);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server saat mengambil saran & kritik.',
      ...(hint ? { hint } : {}),
    });
  }
};

// POST /feedback?query=&tgl=   (butuh guest token, sama seperti endpoint video lainnya)
// Body JSON: { nama?, tipe?: "saran"|"kritik"|"lainnya", pesan, rating?: 1-5, website? (honeypot, harus kosong) }
// Pengunjung hanya bisa membuat komentar utama. Balasan hanya lewat replyFeedback (admin).
exports.createFeedback = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (!checkGuestAccess(req, res)) return;

  const body = req.body && typeof req.body === 'object' ? req.body : {};

  // Honeypot: kolom tersembunyi di form. Manusia tidak mengisinya, bot biasanya iya.
  // Dibalas sukses palsu supaya bot tidak tahu ditolak.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return res.status(200).json({ status: 'success', message: 'Terima kasih atas saran dan kritiknya.' });
  }

  const nama = clean(body.nama, { max: MAX_NAME, singleLine: true }) || 'Anonim';
  const pesan = clean(body.pesan, { max: MAX_MESSAGE });
  const tipeRaw = clean(body.tipe, { max: 20, singleLine: true }).toLowerCase();
  const tipe = tipeRaw || 'saran';

  if (!TYPES.includes(tipe)) {
    return res.status(400).json({ status: 'error', message: `Tipe harus salah satu dari: ${TYPES.join(', ')}.` });
  }
  if (pesan.length < MIN_MESSAGE) {
    return res.status(400).json({ status: 'error', message: `Pesan minimal ${MIN_MESSAGE} karakter.` });
  }
  if (String(body.pesan ?? '').trim().length > MAX_MESSAGE) {
    return res.status(400).json({ status: 'error', message: `Pesan maksimal ${MAX_MESSAGE} karakter.` });
  }

  let rating = '';
  if (body.rating !== undefined && body.rating !== null && body.rating !== '') {
    const n = Number(body.rating);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return res.status(400).json({ status: 'error', message: 'Rating harus angka bulat 1 sampai 5.' });
    }
    rating = n;
  }

  const guest = readGuestToken(getGuestParams(req).q);
  const guestId = guest ? guest.u : 'unknown';

  if (guestLimited(guestId) || ipLimited(getClientIp(req))) {
    return res.status(429).json({
      status: 'error',
      message: '429 Too Many Requests: terlalu banyak kiriman, coba lagi nanti.',
    });
  }

  const { dup, key } = isDuplicate(guestId, pesan);
  if (dup) {
    return res.status(409).json({ status: 'error', message: 'Pesan yang sama baru saja dikirim.' });
  }

  try {
    const now = new Date();
    const { tanggal, pukul } = stampWib(now);
    const id = `FB${crypto.randomBytes(4).toString('hex')}`;

    // RAW: teks tidak pernah dibaca sebagai formula (aman dari injeksi rumus "=..." di Google Sheet)
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${FEEDBACK_SHEET}!A:K`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[id, now.toISOString(), nama, tipe, pesan, rating, tanggal, pukul, guestId, 'ya', '']],
      },
    });

    listCache.at = 0; // daftar dibaca ulang pada permintaan berikutnya

    return res.status(201).json({
      status: 'success',
      message: 'Terima kasih atas saran dan kritiknya.',
      data: { id, nama, tipe, pesan, rating: rating || null, tanggal, pukul },
    });
  } catch (error) {
    recentMessages.delete(key); // gagal tulis: boleh dicoba lagi
    console.error('createFeedback:', error.message, error.errors || '');
    const hint = sheetHint(error, FEEDBACK_SHEET);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server saat menyimpan saran & kritik.',
      ...(hint ? { hint } : {}),
    });
  }
};

// POST /feedback/:id/reply   (HANYA ADMIN yang sedang login)
// Body JSON: { pesan, username, encryptedQueryToken }
//   username & encryptedQueryToken diambil dari hasil login (profile.username dan
//   sessionTokens.encryptedQueryToken). Token juga boleh dikirim lewat header "x-session-token".
// Server memverifikasi token ke Google Sheet user dan membaca role dari sheet, bukan dari client.
// Nama pembalas selalu ADMIN_DISPLAY_NAME ("mfikria_developer"), tidak bisa diubah dari body.
exports.replyFeedback = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  let adminProfile;
  try {
    adminProfile = await findAdminSession(req);
  } catch (error) {
    console.error('replyFeedback (auth):', error.message, error.errors || '');
    const hint = sheetHint(error, USER_SHEET_RANGE.split('!')[0]);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server saat memeriksa sesi admin.',
      ...(hint ? { hint } : {}),
    });
  }
  if (!adminProfile) {
    return res.status(403).json({ status: 'error', message: '403 Forbidden: Hanya admin yang sedang login yang bisa membalas.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const targetId = clean(req.params.id, { max: 40, singleLine: true });
  const nama = ADMIN_DISPLAY_NAME;
  const pesan = clean(body.pesan, { max: MAX_MESSAGE });

  if (!targetId) {
    return res.status(400).json({ status: 'error', message: 'Id komentar wajib diisi.' });
  }
  if (pesan.length < MIN_MESSAGE) {
    return res.status(400).json({ status: 'error', message: `Pesan minimal ${MIN_MESSAGE} karakter.` });
  }
  if (String(body.pesan ?? '').trim().length > MAX_MESSAGE) {
    return res.status(400).json({ status: 'error', message: `Pesan maksimal ${MAX_MESSAGE} karakter.` });
  }

  try {
    listCache.at = 0; // pastikan memeriksa data terbaru
    const { roots, byId } = await loadVisible();

    let parent = byId.get(targetId);
    // Membalas sebuah balasan: dikaitkan ke komentar utamanya (thread satu tingkat)
    if (parent && parent.parentId) parent = byId.get(parent.parentId);
    if (!parent) {
      return res.status(404).json({ status: 'error', message: 'Komentar yang dibalas tidak ditemukan.' });
    }

    const root = roots.find((r) => r.id === parent.id);
    if (root && root.replies.length >= MAX_REPLIES_PER_THREAD) {
      return res.status(400).json({ status: 'error', message: 'Balasan pada komentar ini sudah mencapai batas.' });
    }

    const now = new Date();
    const { tanggal, pukul } = stampWib(now);
    const id = `FB${crypto.randomBytes(4).toString('hex')}`;

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${FEEDBACK_SHEET}!A:K`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[id, now.toISOString(), nama, parent.tipe, pesan, '', tanggal, pukul, String(adminProfile.userId || 'admin'), 'ya', parent.id]],
      },
    });

    listCache.at = 0;

    return res.status(201).json({
      status: 'success',
      message: 'Balasan terkirim.',
      data: { id, parentId: parent.id, nama, tipe: parent.tipe, pesan, rating: null, tanggal, pukul },
    });
  } catch (error) {
    console.error('replyFeedback:', error.message, error.errors || '');
    const hint = sheetHint(error, FEEDBACK_SHEET);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server saat menyimpan balasan.',
      ...(hint ? { hint } : {}),
    });
  }
};