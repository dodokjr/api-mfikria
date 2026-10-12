// controllers/guestTokenController.js
// Endpoint:
//   POST /guest-token         -> buat token baru (berlaku 24 jam)
//   GET  /guest-token/status  -> cek token dari frontend masih bisa dipakai atau tidak
//
// Pemasangan di router (routes/mfikria/routes/authRoutes.js):
//   const guest = require('../controllers/guestTokenController');
//   router.post('/guest-token', guest.rateLimit, guest.createToken);
//   router.get('/guest-token/status', guest.status);
//
// Pastikan /guest-token dan /guest-token/status TIDAK dipasang di belakang middleware guestAuth.

const crypto = require('crypto');
const core = require('../utilitis/Mfikriawebcore'); // samakan huruf besar/kecil dengan nama file asli (Vercel = Linux)
const { spreadsheetId, sheets } = require('../config/spreadsheetConfig');
const { nowStamp, withLock } = require('../utilitis/Common');

// Tab Google Sheet. Kolom: A userId | B token | C tanggal (DDMMYY) | D pukul (HHMM) | E expired (ISO) | F IP
const GUEST_SHEET = 'GuestTokens'; // nama tab tetap, tidak dibaca dari env

function numEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const RATE_PER_MIN = numEnv('GUEST_TOKEN_RATE_PER_MIN', 10);

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

/* ========================= Catat ke Google Sheet (best effort) ========================= */
// Kegagalan menulis sheet TIDAK membuat endpoint 500: token tetap diberikan, error hanya dicatat di log.
// Semua nilai baris harus berupa string / angka (objek ditolak Sheets: "Invalid values ... struct_value").

async function logTokenToSheet(row) {
  try {
    await withLock(async () => {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${GUEST_SHEET}!A:F`,
        valueInputOption: 'RAW',
        requestBody: { values: [row.map((v) => (v === undefined || v === null ? '' : String(v)))] },
      });
    });
  } catch (error) {
    console.error('guest-token: gagal menulis ke sheet', GUEST_SHEET, '-', error.message);
  }
}

/* ========================= POST /guest-token ========================= */

exports.createToken = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const userId = `guest-${crypto.randomBytes(6).toString('hex')}`;
    const { tgllogin, pukullogin } = nowStamp(); // tgllogin = DDMMYY

    // createGuestToken mengembalikan { token, issuedAt, expiresAt }; masa berlaku 24 jam diatur di core
    const { token, expiresAt } = core.createGuestToken(userId, tgllogin);

    await logTokenToSheet([
      userId,
      token,
      tgllogin,
      pukullogin,
      new Date(expiresAt).toISOString(),
      core.getClientIp(req),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        token,
        tgl: tgllogin,
        expiresAt,
        expiresInMs: Math.max(expiresAt - Date.now(), 0),
      },
    });
  } catch (error) {
    console.error('guest-token createToken:', error && error.stack ? error.stack : error);
    const payload = { status: 'error', message: 'Gagal membuat guest token.' };
    // APP_DEBUG=1 di environment -> penyebab asli ikut tampil di respons (matikan lagi setelah selesai)
    if (process.env.APP_DEBUG === '1') payload.reason = String(error && error.message ? error.message : error);
    return res.status(500).json(payload);
  }
};

/* ========================= GET /guest-token/status ========================= */
// Token dikirim lewat ?query=<token>&tgl=<DDMMYY> atau header x-guest-token / x-guest-date.
// Selalu 200; frontend membaca data.valid. Kalau valid:false -> buat token baru.

exports.status = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    return res.status(200).json({ status: 'success', data: core.guestTokenStatus(req) });
  } catch (error) {
    console.error('guest-token status:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal memeriksa guest token.' });
  }
};