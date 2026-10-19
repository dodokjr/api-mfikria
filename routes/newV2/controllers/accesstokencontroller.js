// controllers/accessTokenController.js
//
// Token dibuat dari: ADMIN_KEY (rahasia server) + teks acak + nama dari pengguna (maks 15 karakter).
// Semua token dicatat di Google Sheet (tab "AccessTokens") dan divalidasi dari sana.
//
//   session = access token 10 hari (ACCESS_TOKEN_DAYS). Dibuat siapa saja; nama bebas maks 15 karakter,
//             kalau dikosongkan server membuat string acak 15 karakter.
//   master  = access token admin, tanpa kedaluwarsa. Dibuat admin: header x-admin-key + nama (default "Admin").
//             Master token juga bisa dipakai untuk memanggil endpoint v2.
//
// Format token:  <mfa|mfm>_<nama>_<acak24hex>_<tanda tangan>
//   tanda tangan = HMAC-SHA256(ADMIN_KEY, tipe|nama|acak). ADMIN_KEY TIDAK ikut tertulis di token,
//   hanya dipakai sebagai kunci tanda tangan, jadi token tidak bisa dipalsukan tanpa ADMIN_KEY.
//   Kalau ADMIN_KEY diganti, semua token lama otomatis tidak valid.
//
// Endpoint (routes/newV2/routes/accessTokenRoute.js):
//   router.post('/', access.rateLimit, access.createToken);                         // buat token sesi (body: { name })
//   router.get('/status', access.status);                                           // cek token
//   router.post('/master', access.requireAdmin, access.createMasterToken);          // buat master (admin, body: { name })
//   router.post('/revoke', access.requireAdmin, access.revoke);                     // cabut token by id (admin)
//
// Tab Google Sheet "AccessTokens", baris 1 = header, kolom A..J:
//   id | type | name | tokenHash | tanggal | pukul | expiresAt | status | ip | parentId
//
// .env: ADMIN_KEY (wajib), ACCESS_TOKEN_DAYS=10, ACCESS_TOKEN_RATE_PER_MIN=10, ACCESS_TOKEN_CACHE_SECONDS=30

const crypto = require('crypto');
const core = require('../../mfikria/utilitis/Mfikriawebcore'); // samakan huruf besar/kecil dengan nama file asli (Vercel = Linux)
const { spreadsheetId, sheets } = require('../../mfikria/config/spreadsheetConfig');
const { nowStamp, withLock } = require('../../mfikria/utilitis/Common');

const ACCESS_SHEET = 'AccessTokens'; // nama tab tetap
const DAY_MS = 24 * 60 * 60 * 1000;
const NAME_MAX = 15;
const RANDOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const USABLE_TYPES = ['session', 'master']; // tipe yang boleh memanggil endpoint v2

function numEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const SESSION_DAYS = Math.max(1, Math.floor(numEnv('ACCESS_TOKEN_DAYS', 10))); // total hari token sesi
const RATE_PER_MIN = numEnv('ACCESS_TOKEN_RATE_PER_MIN', 10);
const CACHE_MS = Math.max(5, numEnv('ACCESS_TOKEN_CACHE_SECONDS', 30)) * 1000;
const MISS_REFRESH_MS = 5000; // token tidak ketemu di cache -> baca ulang sheet, paling sering sekali per 5 detik

const MESSAGES = {
  TOKEN_MISSING: 'Token wajib diisi (header Authorization: Bearer <token>)',
  TOKEN_INVALID: 'Token tidak valid',
  TOKEN_EXPIRED: 'Token sudah kedaluwarsa, buat access token baru',
  TOKEN_REVOKED: 'Token sudah dicabut',
};

/* ========================= Helper ========================= */

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

const getAdminKey = () => process.env.ADMIN_KEY || '';

// Token dibaca dari Authorization: Bearer <token> atau header x-access-token
function readToken(req, extraHeader) {
  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return String(bearer || req.headers[extraHeader] || '').trim();
}

// String acak NAME_MAX karakter (huruf dan angka), dipakai kalau pengguna tidak mengisi nama
function randomName() {
  const bytes = crypto.randomBytes(NAME_MAX);
  let out = '';
  for (let i = 0; i < NAME_MAX; i += 1) out += RANDOM_CHARS[bytes[i] % RANDOM_CHARS.length];
  return out;
}

// Nama bebas (karakter apa pun), dipotong sampai NAME_MAX karakter. Kosong -> pakai fallback.
function cleanName(raw, fallback) {
  const text = String(raw === undefined || raw === null ? '' : raw).replace(/[\u0000-\u001F\u007F]/g, '').trim();
  const value = Array.from(text).slice(0, NAME_MAX).join('').trim();
  return value || fallback;
}

const readName = (req) => (req.body && req.body.name) || (req.query && req.query.name);

const deny = (res, code) => res.status(401).json({ status: 'error', code, message: MESSAGES[code] });

const noAdminKey = (res) => res.status(500).json({ status: 'error', message: 'ADMIN_KEY belum diisi di server.' });

const unavailable = (res) =>
  res.status(503).json({
    status: 'error',
    code: 'TOKEN_SERVICE_UNAVAILABLE',
    message: 'Validasi token sementara tidak tersedia, coba lagi sebentar.',
  });

/* ========================= Tanda tangan token (ADMIN_KEY) ========================= */

function sign(type, name, rand) {
  return crypto
    .createHmac('sha256', getAdminKey())
    .update(`${type}|${name}|${rand}`)
    .digest('base64url')
    .slice(0, 22);
}

// Cocokkan tanda tangan di token dengan data di sheet (tipe + nama) dan ADMIN_KEY saat ini
function verifySignature(token, rec) {
  if (!getAdminKey()) return false;
  const parts = String(token).split('_');
  if (parts.length < 4) return false;
  const rand = parts[2];
  const sig = parts.slice(3).join('_');
  return safeEqual(sig, sign(rec.type, rec.name, rand));
}

/* ========================= Batas pembuatan token per IP ========================= */

const rate = new Map();
exports.rateLimit = (req, res, next) => {
  const ip = core.getClientIp(req);
  const now = Date.now();
  if (rate.size > 5000) {
    for (const [k, v] of rate) if (now > v.resetAt) rate.delete(k);
  }
  const entry = rate.get(ip);
  if (!entry || now > entry.resetAt) {
    rate.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return next();
  }
  entry.count += 1;
  if (entry.count > RATE_PER_MIN) {
    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
    return res.status(429).json({ status: 'error', message: '429 Too Many Requests' });
  }
  return next();
};

/* ========================= Google Sheet + cache memori ========================= */
// Seluruh isi sheet dibaca sekali per CACHE_MS lalu disimpan di memori, supaya validasi tiap request
// tidak memanggil Google Sheets API (ada batas kuota baca per menit).

let cache = { at: 0, byHash: new Map(), byId: new Map() };
let loading = null;

async function loadSheet() {
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${ACCESS_SHEET}!A2:J`, // baris 1 = header
  });
  const rows = (resp.data && resp.data.values) || [];
  const byHash = new Map();
  const byId = new Map();

  rows.forEach((r, i) => {
    const rec = {
      id: r[0] || '',
      type: r[1] || '',
      name: r[2] || '',
      hash: r[3] || '',
      tgl: r[4] || '',
      pukul: r[5] || '',
      expiresAt: r[6] ? Date.parse(r[6]) : null, // kosong = tanpa batas (master)
      status: r[7] || 'active',
      ip: r[8] || '',
      parentId: r[9] || '',
      row: i + 2, // nomor baris sebenarnya di sheet
    };
    if (rec.hash) byHash.set(rec.hash, rec);
    if (rec.id) byId.set(rec.id, rec);
  });

  cache = { at: Date.now(), byHash, byId };
}

// mode 'stale' = baca ulang kalau cache lebih tua dari CACHE_MS; mode 'miss' = token tak ketemu, baca ulang (dibatasi)
async function refresh(mode) {
  const age = Date.now() - cache.at;
  if (mode === 'stale' && age < CACHE_MS) return;
  if (mode === 'miss' && age < MISS_REFRESH_MS) return;
  if (!loading) loading = loadSheet().finally(() => (loading = null));
  await loading;
}

async function findByHash(hash) {
  try {
    await refresh('stale');
  } catch (error) {
    console.error('access-token: gagal membaca sheet', ACCESS_SHEET, '-', error.message);
    if (!cache.at) throw error; // belum pernah berhasil baca -> tidak ada data untuk dipakai
  }

  let rec = cache.byHash.get(hash);
  if (!rec) {
    // Bisa jadi token baru dibuat oleh instance server lain; cek sheet sekali lagi
    try {
      await refresh('miss');
    } catch (error) {
      console.error('access-token: gagal membaca sheet', ACCESS_SHEET, '-', error.message);
    }
    rec = cache.byHash.get(hash);
  }
  return rec || null;
}

const toRow = (r) =>
  [
    r.id,
    r.type,
    r.name,
    r.hash,
    r.tgl,
    r.pukul,
    r.expiresAt ? new Date(r.expiresAt).toISOString() : '',
    r.status,
    r.ip,
    r.parentId || '',
  ].map((v) => (v === undefined || v === null ? '' : String(v))); // Sheets menolak objek, hanya string/angka

// Tulis token ke sheet. Kegagalan di sini membuat request gagal,
// karena token yang tidak tercatat tidak akan pernah lolos validasi.
async function appendRecord(rec) {
  await withLock(async () => {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${ACCESS_SHEET}!A:J`,
      valueInputOption: 'RAW',
      requestBody: { values: [toRow(rec)] },
    });
  });
  cache.byHash.set(rec.hash, rec);
  cache.byId.set(rec.id, rec);
}

// Token = prefix + nama (hanya huruf/angka) + teks acak + tanda tangan HMAC(ADMIN_KEY)
function newRecord({ type, name, expiresAt, ip, parentId }) {
  const rand = crypto.randomBytes(12).toString('hex');
  const slug = name.replace(/[^A-Za-z0-9]/g, '').slice(0, NAME_MAX) || 'user';
  const token = `${type === 'master' ? 'mfm' : 'mfa'}_${slug}_${rand}_${sign(type, name, rand)}`;
  const { tgllogin, pukullogin } = nowStamp(); // tgllogin = DDMMYY, pukullogin = HHMM
  const rec = {
    id: `${type === 'master' ? 'master' : 'acc'}-${crypto.randomBytes(6).toString('hex')}`,
    type,
    name,
    hash: sha256(token), // yang disimpan di sheet hanya hash, token asli tidak bisa dibaca dari sheet
    tgl: tgllogin,
    pukul: pukullogin,
    expiresAt,
    status: 'active',
    ip,
    parentId,
    row: null,
  };
  return { token, rec };
}

// Hasil: { valid: true, rec } atau { valid: false, code }
function evaluate(rec, token) {
  if (!rec || !USABLE_TYPES.includes(rec.type)) return { valid: false, code: 'TOKEN_INVALID' };
  if (!verifySignature(token, rec)) return { valid: false, code: 'TOKEN_INVALID' };
  if (rec.status !== 'active') return { valid: false, code: 'TOKEN_REVOKED' };
  if (rec.expiresAt && Date.now() >= rec.expiresAt) return { valid: false, code: 'TOKEN_EXPIRED' };
  return { valid: true, rec };
}

/* ========================= Admin ========================= */

exports.requireAdmin = (req, res, next) => {
  const key = getAdminKey();
  if (!key) return noAdminKey(res);
  const provided = req.headers['x-admin-key'];
  if (!provided || !safeEqual(provided, key)) {
    return res.status(403).json({ status: 'error', message: 'Admin key salah.' });
  }
  return next();
};

// POST /master  (header x-admin-key, body/query: name; kosong = "Admin")
exports.createMasterToken = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const name = cleanName(readName(req), 'Admin');

    const { token, rec } = newRecord({ type: 'master', name, expiresAt: null, ip: core.getClientIp(req), parentId: '' });
    await appendRecord(rec);

    return res.status(201).json({
      status: 'success',
      data: {
        token,
        id: rec.id,
        name: rec.name,
        expiresAt: null, // tanpa batas waktu
        note: 'Simpan token ini sekarang. Token hanya ditampilkan sekali; di sheet hanya tersimpan hash-nya.',
      },
    });
  } catch (error) {
    console.error('access-token createMasterToken:', error && error.stack ? error.stack : error);
    const payload = { status: 'error', message: 'Gagal membuat master token.' };
    if (process.env.APP_DEBUG === '1') payload.reason = String(error && error.message ? error.message : error);
    return res.status(500).json(payload);
  }
};

// POST /revoke  (header x-admin-key, body/query: id)
exports.revoke = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const id = String((req.body && req.body.id) || req.query.id || '').trim();
  if (!id) return res.status(400).json({ status: 'error', message: 'Parameter "id" wajib diisi.' });

  try {
    await loadSheet(); // data terbaru + nomor baris yang akurat
    const rec = cache.byId.get(id);
    if (!rec) return res.status(404).json({ status: 'error', message: 'Token dengan id itu tidak ditemukan.' });

    await withLock(async () => {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${ACCESS_SHEET}!H${rec.row}`,
        valueInputOption: 'RAW',
        requestBody: { values: [['revoked']] },
      });
    });
    rec.status = 'revoked';

    return res.status(200).json({ status: 'success', data: { id: rec.id, type: rec.type, status: 'revoked' } });
  } catch (error) {
    console.error('access-token revoke:', error && error.stack ? error.stack : error);
    const payload = { status: 'error', message: 'Gagal mencabut token.' };
    if (process.env.APP_DEBUG === '1') payload.reason = String(error && error.message ? error.message : error);
    return res.status(500).json(payload);
  }
};

/* ========================= POST / (buat token sesi) ========================= */
// Pengguna mengirim nama bebas (maks 15 karakter, boleh kosong -> string acak 15 karakter). Server membuat token sesi berlaku SESSION_DAYS hari
// dan mencatatnya di sheet. Dibatasi per IP oleh rateLimit.

exports.createToken = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (!getAdminKey()) return noAdminKey(res);

  const name = cleanName(readName(req), randomName());

  try {
    const expiresAt = Date.now() + SESSION_DAYS * DAY_MS;
    const { token, rec } = newRecord({
      type: 'session',
      name,
      expiresAt,
      ip: core.getClientIp(req),
      parentId: '',
    });
    await appendRecord(rec);

    return res.status(200).json({
      status: 'success',
      data: {
        token,
        id: rec.id,
        name: rec.name,
        totalDays: SESSION_DAYS,
        expiresAt,
        expiresInMs: Math.max(expiresAt - Date.now(), 0),
      },
    });
  } catch (error) {
    console.error('access-token createToken:', error && error.stack ? error.stack : error);
    const payload = { status: 'error', message: 'Gagal membuat access token.' };
    if (process.env.APP_DEBUG === '1') payload.reason = String(error && error.message ? error.message : error);
    return res.status(500).json(payload);
  }
};

/* ========================= GET /status ========================= */
// Selalu 200; frontend membaca data.valid. Master token: expiresAt null (tanpa batas).

exports.status = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const token = readToken(req, 'x-access-token');
  if (!token) return res.status(200).json({ status: 'success', data: { valid: false, code: 'TOKEN_MISSING' } });

  try {
    const result = evaluate(await findByHash(sha256(token)), token);
    if (!result.valid) return res.status(200).json({ status: 'success', data: { valid: false, code: result.code } });

    const exp = result.rec.expiresAt;
    const remainingMs = exp ? Math.max(exp - Date.now(), 0) : null;
    return res.status(200).json({
      status: 'success',
      data: {
        valid: true,
        id: result.rec.id,
        type: result.rec.type,
        name: result.rec.name,
        expiresAt: exp || null,
        remainingMs,
        remainingDays: exp ? Math.ceil(remainingMs / DAY_MS) : null,
      },
    });
  } catch (error) {
    console.error('access-token status:', error);
    return unavailable(res);
  }
};

/* ========================= Middleware untuk route v2 ========================= */

exports.requireAccessToken = async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  const token = readToken(req, 'x-access-token');
  if (!token) return deny(res, 'TOKEN_MISSING');

  try {
    const result = evaluate(await findByHash(sha256(token)), token);
    if (!result.valid) return deny(res, result.code); // TOKEN_EXPIRED -> frontend membuat token baru

    req.accessToken = {
      id: result.rec.id,
      type: result.rec.type,
      name: result.rec.name,
      expiresAt: result.rec.expiresAt,
    };
    if (result.rec.expiresAt) res.setHeader('X-Token-Expires', new Date(result.rec.expiresAt).toISOString());
    return next();
  } catch (error) {
    console.error('access-token requireAccessToken:', error);
    return unavailable(res);
  }
};