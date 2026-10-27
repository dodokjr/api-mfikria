const crypto = require('crypto');
const core = require('../utilitis/Mfikriawebcore'); // samakan huruf besar/kecil dengan nama file asli (Vercel = Linux)
const { sheets } = require('../config/spreadsheetConfig'); // hanya client; spreadsheetId utama TIDAK dipakai
const { nowStamp, withLock } = require('../utilitis/Common');

// Tab di spreadsheet params. Kolom:
// A userId | B token | C tanggal (DDMMYY) | D pukul (HHMM) | E expired (ISO) | F IP | G scope
const PARAMS_SPREADSHEET_ID = process.env.GUEST_PARAMS_SPREADSHEET_ID;
const PARAMS_SHEET = 'GuestTokens_Params';

// Whitelist scope yang diizinkan (nilai di URL). Tambah scope baru di sini.
const ALLOWED_SCOPES = ['app', 'project'];

function numEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const RATE_PER_MIN = numEnv('GUEST_TOKEN_RATE_PER_MIN', 10);

function resolveScope(req) {
  const raw = String((req.params && req.params.scope) || '').trim().toLowerCase();
  if (ALLOWED_SCOPES.includes(raw)) return { ok: true, scope: raw };
  return { ok: false };
}

/* ========================= Batas pembuatan token per IP ========================= */
// Counter sendiri, terpisah dari rate limit guest-token yang asli.

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

async function logTokenToSheet(row) {
  if (!PARAMS_SPREADSHEET_ID) {
    console.error('guest-token params: GUEST_PARAMS_SPREADSHEET_ID belum diisi di environment');
    return;
  }
  try {
    await withLock(async () => {
      await sheets.spreadsheets.values.append({
        spreadsheetId: PARAMS_SPREADSHEET_ID,
        range: `${PARAMS_SHEET}!A:G`,
        valueInputOption: 'RAW',
        requestBody: { values: [row.map((v) => (v === undefined || v === null ? '' : String(v)))] },
      });
    });
  } catch (error) {
    console.error('guest-token params: gagal menulis ke sheet', PARAMS_SHEET, '-', error.message);
  }
}

/* ========================= POST /guest-token/:scope ========================= */

exports.createToken = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const target = resolveScope(req);
  if (!target.ok) {
    return res.status(400).json({
      status: 'error',
      message: `Scope tidak dikenal. Pilihan: ${ALLOWED_SCOPES.join(', ')}`,
    });
  }

  try {
    const userId = `guest-${crypto.randomBytes(6).toString('hex')}`;
    const { tgllogin, pukullogin } = nowStamp(); // tgllogin = DDMMYY

    const { token, expiresAt } = core.createGuestToken(userId, tgllogin);

    await logTokenToSheet([
      userId,
      token,
      tgllogin,
      pukullogin,
      new Date(expiresAt).toISOString(),
      core.getClientIp(req),
      target.scope,
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        token,
        scope: target.scope,
        tgl: tgllogin,
        expiresAt,
        expiresInMs: Math.max(expiresAt - Date.now(), 0),
      },
    });
  } catch (error) {
    console.error('guest-token params createToken:', error && error.stack ? error.stack : error);
    const payload = { status: 'error', message: 'Gagal membuat guest token.' };
    if (process.env.APP_DEBUG === '1') payload.reason = String(error && error.message ? error.message : error);
    return res.status(500).json(payload);
  }
};