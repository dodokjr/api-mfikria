// Penanganan error terpusat. Semua respons error memakai bentuk yang sama:
// { status, code_for_message, TimeStatus, message }
//
// Pasang PALING AKHIR di app.js, setelah semua route:
//   app.use(notFound);
//   app.use(errorHandler);

const crypto = require('crypto');

const CONTACT = 'https://mfikria.vercel.app';

// ---------------------------------------------------------------------------
// Error dengan status HTTP. Pakai: next(new HttpError(501, 'Fitur belum tersedia'))
// ---------------------------------------------------------------------------
class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.expose = true; // pesan HttpError sengaja ditulis developer, aman ditampilkan (set expose: false untuk menyembunyikan)
    Object.assign(this, extra);
  }
}

// ---------------------------------------------------------------------------
// Pembentuk body respons
// ---------------------------------------------------------------------------
function timeStatus(now = new Date()) {
  const hariTanggal = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }); // tanpa timeZone: otomatis memakai zona waktu server

  const jam = now
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/\./g, ':');

  return `${hariTanggal} - ${jam}`;
}

function buildBody(status, detail) {
  const base = `error ${status}`;
  return {
    status,
    code_for_message: crypto.randomBytes(4).toString('hex'), // 8 karakter, untuk dicocokkan dengan log server
    TimeStatus: timeStatus(),
    message: detail
      ? `${base}: ${detail}. please contact ${CONTACT}`
      : `${base} please contact ${CONTACT}`,
  };
}

// Kirim error langsung dari route mana pun: sendError(res, 400, 'Parameter salah')
function sendError(res, status, detail) {
  return res.status(status).json(buildBody(status, detail));
}

// ---------------------------------------------------------------------------
// 404: route tidak ditemukan
// ---------------------------------------------------------------------------
function notFound(req, res) {
  sendError(res, 404);
}

// ---------------------------------------------------------------------------
// Pembantu untuk router
// ---------------------------------------------------------------------------

// 405: method tidak diizinkan. Contoh: router.all('/calculate', methodNotAllowed(['GET', 'POST']))
// Letakkan SETELAH router.get/post pada path yang sama.
function methodNotAllowed(allowed) {
  const list = allowed.map((m) => m.toUpperCase());
  return (req, res, next) => {
    res.set('Allow', list.join(', '));
    next(new HttpError(405, `method ${req.method} tidak diizinkan, gunakan ${list.join(' atau ')}`));
  };
}

// 501: fitur belum diimplementasikan. Contoh: router.get('/belum-ada', notImplemented)
function notImplemented(req, res, next) {
  next(new HttpError(501, 'fitur ini belum tersedia'));
}

// ---------------------------------------------------------------------------
// Error handler utama (500, 400, 413, 501, 503, dan lainnya)
// ---------------------------------------------------------------------------
// Pesan detail untuk error bawaan library yang sering muncul
function normalize(err) {
  // JSON body rusak (express.json / body-parser)
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    return { status: 400, detail: 'format JSON tidak valid' };
  }
  if (err.type === 'entity.too.large') {
    return { status: 413, detail: 'ukuran data terlalu besar' };
  }
  if (err.type === 'encoding.unsupported' || err.type === 'charset.unsupported') {
    return { status: 415, detail: 'encoding tidak didukung' };
  }

  const raw = err.status || err.statusCode;
  const status = Number.isInteger(raw) && raw >= 400 && raw <= 599 ? raw : 500;

  // Error biasa: hanya 4xx yang pesannya ditampilkan. HttpError (expose: true) boleh untuk status apa pun, termasuk 501 dan 503.
  const show = err.expose === true || (status < 500 && err.expose !== false);
  const detail = show && err.message ? err.message : undefined;
  return { status, detail };
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Respons sudah mulai dikirim (misalnya SSE): serahkan ke handler bawaan Express
  if (res.headersSent) return next(err);

  const { status, detail } = normalize(err);
  const body = buildBody(status, detail);

  // Log lengkap di server, dicocokkan lewat code_for_message
  const line = `[${body.code_for_message}] ${status} ${req.method} ${req.originalUrl}`;
  if (status >= 500) console.error(line, err);
  else console.warn(line, '-', err.message);

  res.status(status).json(body);
}

module.exports = {
  HttpError,
  notFound,
  errorHandler,
  sendError,
  methodNotAllowed,
  notImplemented,
};