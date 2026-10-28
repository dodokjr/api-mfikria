const core = require('./Mfikriawebcore');
const { sheets } = require('../config/spreadsheetConfig'); // hanya client; spreadsheetId utama TIDAK dipakai
const { nowStamp } = require('./Common');

const PARAMS_SPREADSHEET_ID = process.env.GUEST_PARAMS_SPREADSHEET_ID;
const PARAMS_SHEET = 'GuestTokens_Params';

function numEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const DEDUPE_MS = numEnv('GUEST_ACTIVITY_DEDUPE_MS', 30 * 1000);

// Melindungi kuota Sheets API: aktivitas yang sama (user + aksi + halaman + detail) tidak ditulis ulang
// dalam DEDUPE_MS (mis. React StrictMode memanggil efek dua kali, atau user menekan refresh). In-memory.
const recent = new Map();

function clean(value, max) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, max);
}

// Path halaman. Query string dibuang (bisa berisi token video), maksimal 200 karakter.
function cleanPage(value, fallback) {
  const p = clean(String(value || '').split('?')[0].split('#')[0], 200);
  return p.startsWith('/') ? p : fallback;
}

// Siapa guest ini? Dari token yang sudah divalidasi checkGuestAccess (guest.u = userId, mis. G001)
function whoIs(req) {
  try {
    const { q } = core.getGuestParams(req);
    const guest = core.readGuestToken(q);
    return guest && guest.u ? { userId: String(guest.u), token: String(q || '') } : null;
  } catch (error) {
    return null;
  }
}

// logActivity(req, { scope, page, action, detail }) -> true kalau tertulis
async function logActivity(req, info) {
  const { scope, page, action, detail } = info || {};
  try {
    if (!PARAMS_SPREADSHEET_ID) {
      console.error('guest-activity: GUEST_PARAMS_SPREADSHEET_ID belum diisi di environment');
      return false;
    }
    const who = whoIs(req);
    if (!who) return false;

    const row = {
      scope: clean(scope, 30),
      page: cleanPage(page, scope ? `/${clean(scope, 30)}` : '/'),
      action: clean(action || 'visit', 40),
      detail: clean(detail, 200),
    };

    const key = [who.userId, row.action, row.page, row.detail].join('|');
    const now = Date.now();
    const last = recent.get(key);
    if (last && now - last < DEDUPE_MS) return false;
    if (recent.size > 5000) {
      for (const [k, v] of recent) if (now - v > DEDUPE_MS) recent.delete(k);
      if (recent.size > 5000) recent.clear();
    }
    recent.set(key, now);

    const { tgllogin, pukullogin } = nowStamp(); // tgllogin = DDMMYY, pukullogin = HHMM
    try {
      // Tanpa withLock: append bersifat atomik di Sheets, jadi tidak menghambat penerbitan token
      await sheets.spreadsheets.values.append({
        spreadsheetId: PARAMS_SPREADSHEET_ID,
        range: `${PARAMS_SHEET}!A:I`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            who.userId,
            who.token,
            tgllogin,
            pukullogin,
            core.getClientIp(req),
            row.scope,
            row.page,
            row.action,
            row.detail,
          ]],
        },
      });
      return true;
    } catch (error) {
      recent.delete(key); // gagal tulis: boleh dicoba lagi
      console.error('guest-activity: gagal menulis ke sheet', PARAMS_SHEET, '-', error.message);
      return false;
    }
  } catch (error) {
    console.error('guest-activity:', error && error.message ? error.message : error);
    return false;
  }
}

module.exports = { logActivity };