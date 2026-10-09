require('dotenv').config();

/* Helper yang dipakai bersama oleh authController dan videoController */

const ADMIN_SECRET_TOKEN = process.env.ADMIN_SECRET_TOKEN;
const USER_SECRET_TOKEN = process.env.USER_SECRET_TOKEN;

// Kalau salah satu kosong, "undefined === undefined" bisa meloloskan siapa saja
if (!ADMIN_SECRET_TOKEN || !USER_SECRET_TOKEN) {
  throw new Error('ADMIN_SECRET_TOKEN dan USER_SECRET_TOKEN wajib diset di environment/.env');
}

const crypto = require('crypto');

const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Jakarta';
const IV_LENGTH = 12; // standar untuk AES-GCM

// Tanggal/jam mengikuti zona waktu aplikasi, bukan zona waktu server
function nowStamp() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    tgllogin: `${get('day')}${get('month')}${get('year')}`,
    pukullogin: `${get('hour')}${get('minute')}`,
  };
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// Sheets bisa menghilangkan nol di depan ("081026" -> 81026, "0850" -> 850)
const padDate = (v) => String(v || '').padStart(6, '0');
const padTime = (v) => String(v || '').padStart(4, '0');

// Antrian sederhana agar baca-lalu-tulis tidak balapan (berlaku untuk 1 instance server)
let queue = Promise.resolve();
function withLock(fn) {
  const run = queue.then(() => fn());
  queue = run.catch(() => {});
  return run;
}

module.exports = {
  ADMIN_SECRET_TOKEN,
  USER_SECRET_TOKEN,
  APP_TIMEZONE,
  IV_LENGTH,
  nowStamp,
  safeEqual,
  padDate,
  padTime,
  withLock,
};