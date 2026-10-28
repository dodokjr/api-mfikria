const core = require('../utilitis/Mfikriawebcore'); // samakan huruf besar/kecil dengan nama file asli (Vercel = Linux)
const { logActivity } = require('../utilitis/Guestactivity');

// Whitelist scope = segmen pertama route di main.jsx. /auth/ff (admin) sengaja tidak ada.
// Tambah scope baru di sini DAN di GUEST_SCOPES (src/utils/guestToken.js).
const ALLOWED_SCOPES = ['app', 'project', 'blog', 'contact', 'hobbies', 'me', 'store', 'video', 'jasa'];

function numEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const RATE_PER_MIN = numEnv('GUEST_TRACK_RATE_PER_MIN', 60); // tiap pindah halaman = 1 catatan

/* ========================= Batas per IP ========================= */

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

/* ========================= POST /guest-token/:scope ========================= */

exports.trackVisit = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const scope = String((req.params && req.params.scope) || '').trim().toLowerCase();
  if (!ALLOWED_SCOPES.includes(scope)) {
    return res.status(400).json({
      status: 'error',
      message: `Scope tidak dikenal. Pilihan: ${ALLOWED_SCOPES.join(', ')}`,
    });
  }

  // Token yang sama dengan /guest-token. Kalau tidak valid, checkGuestAccess membalas 401 sendiri.
  if (!core.checkGuestAccess(req, res)) return;

  try {
    const logged = await logActivity(req, {
      scope,
      page: req.body && req.body.page,
      action: 'visit',
    });
    return res.status(200).json({ status: 'success', data: { scope, logged } });
  } catch (error) {
    console.error('guest-token params trackVisit:', error && error.stack ? error.stack : error);
    const payload = { status: 'error', message: 'Gagal mencatat kunjungan.' };
    if (process.env.APP_DEBUG === '1') payload.reason = String(error && error.message ? error.message : error);
    return res.status(500).json(payload);
  }
};