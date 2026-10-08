require('dotenv').config();
const crypto = require('crypto');
const { promisify } = require('util');
const { spreadsheetId, sheets } = require('../config/spreadsheetConfig');
const { drive, defaultFolderId, getPhotosFromFolder, findFileByName, getFileMetadata } = require('../config/driveConfig');

const ADMIN_SECRET_TOKEN = process.env.ADMIN_SECRET_TOKEN;
const USER_SECRET_TOKEN = process.env.USER_SECRET_TOKEN;

// Kalau salah satu kosong, "undefined === undefined" bisa meloloskan siapa saja
if (!ADMIN_SECRET_TOKEN || !USER_SECRET_TOKEN) {
  throw new Error('ADMIN_SECRET_TOKEN dan USER_SECRET_TOKEN wajib diset di environment/.env');
}

const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Jakarta';
const SHEET_RANGE = 'Sheet1!A2:H'; // tanpa batas baris
const IV_LENGTH = 12; // standar untuk AES-GCM

/* ========================= HELPER ========================= */

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

// Nilai kolom status_login: 'true' = sedang login, 'false' = sudah logout
const STATUS_ONLINE = 'true';
const STATUS_OFFLINE = 'false';

// Tetap mengenali data lama yang berisi 'online'
function isOnline(value) {
  return ['true', 'online'].includes(String(value || '').trim().toLowerCase());
}

/* ===== Password: scrypt + salt acak, disimpan di kolom C sheet sebagai "scrypt$salt$hash" ===== */

const scryptAsync = promisify(crypto.scrypt);
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;
// Dipakai saat username tidak ditemukan, supaya waktu respons tidak membocorkan username mana yang ada
const DUMMY_HASH = `scrypt$${'00'.repeat(16)}$${'00'.repeat(64)}`;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  try {
    const [scheme, saltHex, hashHex] = String(stored || '').split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
    return crypto.timingSafeEqual(actual, expected);
  } catch (error) {
    return false;
  }
}

// Sheets bisa menghilangkan nol di depan ("081026" -> 81026, "0850" -> 850)
const padDate = (v) => String(v || '').padStart(6, '0');
const padTime = (v) => String(v || '').padStart(4, '0');

function getClientToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return (req.body && (req.body.accessToken || req.body.authToken)) || null;
}

function getRoleFromToken(token) {
  if (safeEqual(token, ADMIN_SECRET_TOKEN)) return 'admin';
  if (safeEqual(token, USER_SECRET_TOKEN)) return 'user';
  return null;
}

// Key diturunkan dari secret + userId + username (TANPA tgllogin/pukullogin),
// supaya login (encrypt) dan getPhotoAsset (decrypt) memakai key yang sama.
const keyCache = new Map();
function getKey(secret, userId, username) {
  const material = `${secret}_${userId}_${username}`;
  if (!keyCache.has(material)) {
    keyCache.set(material, crypto.scryptSync(material, 'salt_company', 32));
  }
  return keyCache.get(material);
}

// AES-256-GCM: terenkripsi + terautentikasi (tidak bisa dimodifikasi diam-diam)
function encryptPayload(payload, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((b) => b.toString('hex')).join(':');
}

function decryptPayload(token, key) {
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

/* ===== Token URL foto profil: acak, terenkripsi (AES-256-GCM), aman dipakai di URL ===== */

const PHOTO_TOKEN_KEY = crypto
  .createHash('sha256')
  .update(process.env.PHOTO_URL_SECRET || `${ADMIN_SECRET_TOKEN}|${USER_SECRET_TOKEN}`)
  .digest();

// Hasilnya berbeda setiap kali dibuat karena IV acak
function createPhotoToken(payload) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', PHOTO_TOKEN_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

function readPhotoToken(token) {
  try {
    const raw = Buffer.from(String(token), 'base64url');
    if (raw.length < IV_LENGTH + 16 + 2) return null;
    const iv = raw.subarray(0, IV_LENGTH);
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
    const encrypted = raw.subarray(IV_LENGTH + 16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', PHOTO_TOKEN_KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    return null;
  }
}

// Scan folder Google Drive untuk logo.png (hasilnya di-cache 10 menit)
const LOGO_NAME = 'logo.png';
let logoCache = { id: null, at: 0 };
async function findLogoId() {
  if (Date.now() - logoCache.at < 10 * 60 * 1000) return logoCache.id;
  const file = await findFileByName(LOGO_NAME, defaultFolderId);
  logoCache = { id: file ? file.id : null, at: Date.now() };
  return logoCache.id;
}

// Token valid hanya jika: user sedang online, dan token berasal dari sesi login TERAKHIR
function verifySession(encryptedQuery, row) {
  if (typeof encryptedQuery !== 'string') return null;
  if (!isOnline(row[5])) return null;

  for (const secret of [ADMIN_SECRET_TOKEN, USER_SECRET_TOKEN]) {
    const payload = decryptPayload(encryptedQuery, getKey(secret, row[0], row[1]));
    if (
      payload &&
      payload.userId === row[0] &&
      payload.nama === row[1] &&
      String(payload.tgllogin) === padDate(row[6]) &&
      String(payload.pukullogin) === padTime(row[7])
    ) {
      return payload;
    }
  }
  return null;
}

// Antrian sederhana agar baca-lalu-tulis tidak balapan (berlaku untuk 1 instance server)
let queue = Promise.resolve();
function withLock(fn) {
  const run = queue.then(() => fn());
  queue = run.catch(() => {});
  return run;
}

async function readRows() {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: SHEET_RANGE,
  });
  return response.data.values || [];
}

// Stream file gambar dari Google Drive ke response
async function streamPhoto(res, photoId) {
  const fileMeta = await drive.files.get({
    fileId: photoId,
    fields: 'mimeType',
    supportsAllDrives: true,
  });

  const fileStream = await drive.files.get(
    { fileId: photoId, alt: 'media', supportsAllDrives: true },
    { responseType: 'stream' }
  );

  res.setHeader('Content-Type', fileMeta.data.mimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, max-age=300');

  fileStream.data.on('error', (err) => {
    console.error('streamPhoto:', err);
    if (!res.headersSent) {
      res.status(500).json({ status: 'error', message: 'Gagal membaca file dari Drive.' });
    } else {
      res.destroy(err);
    }
  });

  fileStream.data.pipe(res);
}

/* ========================= REGISTER ========================= */
// Tidak ada upload ke Drive. Foto dipilih dari file yang SUDAH ada di folder Drive
// lewat body.photoId (daftar foto bisa diambil dari endpoint getFolderPhotos).

exports.registerUser = async (req, res) => {
  const body = req.body || {};
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const requestedRole = String(body.role || 'user').toLowerCase();
  const photoId = typeof body.photoId === 'string' ? body.photoId.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || username.length > 50) {
    return res.status(400).json({ status: 'error', message: 'Username wajib diisi (maksimal 50 karakter).' });
  }

  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return res.status(400).json({
      status: 'error',
      message: `Password wajib diisi (${PASSWORD_MIN}-${PASSWORD_MAX} karakter).`,
    });
  }

  if (!['user', 'admin'].includes(requestedRole)) {
    return res.status(400).json({ status: 'error', message: 'Role tidak valid.' });
  }

  // Hanya admin yang boleh membuat akun admin
  if (requestedRole === 'admin' && getRoleFromToken(getClientToken(req)) !== 'admin') {
    return res.status(403).json({ status: 'error', message: '403 Forbidden: Hanya admin yang dapat membuat akun admin.' });
  }

  // Validasi foto: harus ada di Drive, berupa gambar, dan berada di folder yang diizinkan
  if (photoId) {
    try {
      const meta = await getFileMetadata(photoId);
      const inFolder = !defaultFolderId || (meta.parents || []).includes(defaultFolderId);
      if (!String(meta.mimeType).startsWith('image/') || !inFolder) {
        return res.status(400).json({ status: 'error', message: 'photoId bukan gambar di folder yang diizinkan.' });
      }
    } catch (err) {
      return res.status(400).json({ status: 'error', message: 'Foto dengan photoId tersebut tidak ditemukan di Drive.' });
    }
  }

  try {
    return await withLock(async () => {
      const rows = await readRows();

      if (rows.some((row) => row[1] && row[1].toLowerCase() === username.toLowerCase())) {
        return res.status(403).json({
          status: 'error',
          message: '403 Forbidden: Nama/username sudah terdaftar. Registrasi ditolak.',
        });
      }

      // ID = angka terbesar + 1 (bukan jumlah baris, yang bisa bentrok jika ada baris dihapus/kosong)
      const maxNumber = rows.reduce((max, row) => {
        const n = parseInt(String(row[0] || '').replace(/\D/g, ''), 10);
        return Number.isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const newUserId = `U${String(maxNumber + 1).padStart(3, '0')}`;

      const { tgllogin, pukullogin } = nowStamp();
      const passwordHash = await hashPassword(password);

      // Kolom: A userId | B username | C password (hash) | D role | E photoId | F status | G tanggal | H pukul
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:H',
        // RAW: mencegah Sheets mengubah "0850" jadi 850 dan mencegah injeksi formula (=...)
        valueInputOption: 'RAW',
        requestBody: {
          values: [[newUserId, username, passwordHash, requestedRole, photoId, STATUS_OFFLINE, tgllogin, pukullogin]],
        },
      });

      // Token foto (terenkripsi) langsung didapat saat registrasi: scan Drive -> logo.png
      // (token foto milik user baru terbentuk saat login, karena terikat ke sesi online)
      const logoId = await findLogoId().catch((err) => {
        console.error('findLogoId:', err.message);
        return null;
      });
      const photoToken = logoId ? createPhotoToken({ p: logoId }) : null;

      return res.status(200).json({
        status: 'success',
        message: 'Registrasi berhasil!',
        data: { userId: newUserId, username, role: requestedRole, photoId: logoId || null, photoToken },
      });
    });
  } catch (error) {
    console.error('registerUser:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/* ========================= LOGIN ========================= */

exports.loginUser = async (req, res) => {
  const clientToken = getClientToken(req);
  const userRoleType = getRoleFromToken(clientToken);

  if (!userRoleType) {
    return res.status(403).json({
      status: 'error',
      message: '403 Forbidden: Akses Token tidak valid atau tidak disertakan!',
    });
  }

  const username = req.body && typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const password = req.body && typeof req.body.password === 'string' ? req.body.password : '';
  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Username dan password wajib disertakan.' });
  }

  try {
    return await withLock(async () => {
      const rows = await readRows();
      if (rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Database kosong.' });
      }

      // Case-insensitive, konsisten dengan pengecekan saat registrasi
      const index = rows.findIndex((row) => row[1] && row[1].toLowerCase() === username.toLowerCase());
      // Username tidak ditemukan dan password salah dijawab sama persis (tidak membocorkan username)
      const row = index === -1 ? null : rows[index];
      const passwordOk = await verifyPassword(password, row ? row[2] : DUMMY_HASH);
      if (!row || !passwordOk) {
        return res.status(403).json({
          status: 'error',
          message: '403 Forbidden: Username atau password salah.',
        });
      }

      const rowIndex = index + 2;
      const foundUser = {
        userId: row[0],
        username: row[1],
        role: row[3] || 'user',
        photoId: row[4] || null,
        statusLogin: row[5] || STATUS_OFFLINE,
      };

      // Token admin hanya boleh dipakai oleh akun yang memang berperan admin
      if (userRoleType === 'admin' && String(foundUser.role).toLowerCase() !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: '403 Forbidden: Akun ini tidak memiliki hak akses admin.',
        });
      }

      if (isOnline(foundUser.statusLogin)) {
        return res.status(403).json({
          status: 'error',
          message: '403 Forbidden: Akun ini sedang aktif (online) di sesi lain. Tidak dapat ditabrak.',
        });
      }

      const { tgllogin, pukullogin } = nowStamp();
      const statusLogin = STATUS_ONLINE;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!F${rowIndex}:H${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[statusLogin, tgllogin, pukullogin]] },
      });

      const encryptedQuery = encryptPayload(
        { userId: foundUser.userId, nama: foundUser.username, tgllogin, pukullogin },
        getKey(clientToken, foundUser.userId, foundUser.username)
      );

      // Token foto profil (terenkripsi & acak):
      // - user punya foto di sheet  -> token terikat ke data user + sesi login ini
      // - user tanpa foto           -> scan Drive, pakai logo.png sebagai default
      let photoToken = null;
      let photoUrlId = null;
      if (foundUser.photoId) {
        photoUrlId = foundUser.photoId;
        photoToken = createPhotoToken({
          p: foundUser.photoId,
          u: foundUser.userId,
          n: foundUser.username,
          d: tgllogin,
          t: pukullogin,
        });
      } else {
        const logoId = await findLogoId().catch((err) => {
          console.error('findLogoId:', err.message);
          return null;
        });
        if (logoId) {
          photoUrlId = logoId;
          photoToken = createPhotoToken({ p: logoId });
        }
      }

      // Drive bersifat view-only untuk semua role (tidak ada upload)
      const dashboardCapabilities =
        userRoleType === 'admin'
          ? { canUploadFile: false, canModifyData: true, accessLevel: 'Admin (Drive: View Only)' }
          : { canUploadFile: false, canModifyData: false, accessLevel: 'View Only (User)' };

      return res.status(200).json({
        status: 'success',
        message: `Login Berhasil sebagai ${userRoleType.toUpperCase()}`,
        dashboardData: {
          profile: {
            userId: foundUser.userId,
            username: foundUser.username,
            role: foundUser.role,
            statusLogin,
            terakhirLogin: { tanggal: tgllogin, pukul: pukullogin },
          },
          permissions: dashboardCapabilities,
          sessionTokens: { accessToken: clientToken, encryptedQueryToken: encryptedQuery },
          // Front end memakai: /mfikria/v1/assets/photo/{photoId}?q={token}
          googleDrivePhoto: { photoId: photoUrlId, token: photoToken },
        },
      });
    });
  } catch (error) {
    console.error('loginUser:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/* ========================= LOGOUT ========================= */
// Logout: status_login jadi 'false', tanggal & pukul logout dicatat di kolom G dan H.
// Body: { username, encryptedQueryToken } + header Authorization: Bearer <token>

exports.logoutUser = async (req, res) => {
  if (!getRoleFromToken(getClientToken(req))) {
    return res.status(403).json({ status: 'error', message: '403 Forbidden: Akses Token tidak valid.' });
  }

  const username = req.body && typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const sessionToken = (req.body && req.body.encryptedQueryToken) || req.headers['x-session-token'];

  if (!username || typeof sessionToken !== 'string') {
    return res.status(400).json({ status: 'error', message: 'username dan encryptedQueryToken wajib disertakan.' });
  }

  try {
    return await withLock(async () => {
      const rows = await readRows();
      const index = rows.findIndex((row) => row[1] && row[1].toLowerCase() === username.toLowerCase());

      if (index === -1) {
        return res.status(404).json({ status: 'error', message: 'Username tidak ditemukan di database.' });
      }

      if (!verifySession(sessionToken, rows[index])) {
        return res.status(403).json({ status: 'error', message: '403 Forbidden: Sesi tidak valid.' });
      }

      // Waktu logout dicatat di kolom G (tanggal) dan H (pukul), status_login (kolom F) jadi 'false'
      const { tgllogin, pukullogin } = nowStamp();
      const rowIndex = index + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!F${rowIndex}:H${rowIndex}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[STATUS_OFFLINE, tgllogin, pukullogin]] },
      });

      return res.status(200).json({
        status: 'success',
        message: 'Logout berhasil.',
        data: {
          userId: rows[index][0],
          username: rows[index][1],
          statusLogin: STATUS_OFFLINE,
          terakhirLogout: { tanggal: tgllogin, pukul: pukullogin },
        },
      });
    });
  } catch (error) {
    console.error('logoutUser:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/* ========================= DAFTAR FOTO ========================= */

exports.getFolderPhotos = async (req, res) => {
  if (!getRoleFromToken(getClientToken(req))) {
    return res.status(403).json({ status: 'error', message: '403 Forbidden: Akses Token tidak valid atau tidak disertakan!' });
  }

  try {
    const files = await getPhotosFromFolder(defaultFolderId);

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil daftar aset foto dari Google Drive folder.',
      totalPhotos: files.length,
      data: files.map((file) => ({
        photoId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        viewLink: file.webViewLink,
      })),
    });
  } catch (error) {
    console.error('getFolderPhotos:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/* ========================= FOTO PROFIL (token acak terenkripsi) ========================= */
// GET /mfikria/photoProfile/:token
// :token = data foto yang dienkripsi backend saat login. Backend mendekripsi dan
// memvalidasinya, lalu mengirim gambarnya dari Google Drive. Gagal validasi -> 404.

exports.getProfilePhoto = async (req, res) => {
  const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });

  try {
    // Dua bentuk URL: /photoProfile/{token}  atau  /assets/photo/{photoId}?q={token}
    const data = readPhotoToken(req.params.token || req.query.q);
    if (!data || typeof data.p !== 'string' || !data.p) return notFound();

    // Pada bentuk ?q=, photoId di path harus sama dengan isi token
    if (req.params.photoId && req.params.photoId !== data.p) return notFound();

    if (data.u) {
      // Foto milik user: seluruh data di token harus cocok dengan baris di Google Sheet
      const rows = await readRows();
      const row = rows.find(
        (r) =>
          r[4] === data.p &&
          isOnline(r[5]) &&
          safeEqual(r[0], String(data.u)) &&
          safeEqual(r[1], String(data.n)) &&
          safeEqual(padDate(r[6]), padDate(data.d)) &&
          safeEqual(padTime(r[7]), padTime(data.t))
      );
      if (!row) return notFound();
    } else {
      // Logo default: file harus benar-benar bernama logo.png di folder Drive
      let meta;
      try {
        meta = await getFileMetadata(data.p);
      } catch (err) {
        return notFound();
      }
      const inFolder = !defaultFolderId || (meta.parents || []).includes(defaultFolderId);
      if (meta.name !== LOGO_NAME || !inFolder) return notFound();
    }

    return await streamPhoto(res, data.p);
  } catch (error) {
    console.error('getProfilePhoto:', error);
    const code = error.code || (error.response && error.response.status);
    if (code === 404) return notFound();
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mengambil foto.' });
  }
};

/* ========================= VALIDASI & STREAM FOTO (token terenkripsi) ========================= */

exports.getPhotoAsset = async (req, res) => {
  try {
    const photoId = req.params.photoId;
    const encryptedQuery = req.query.query;

    if (typeof encryptedQuery !== 'string' || !encryptedQuery) {
      return res.status(403).json({ status: 'error', message: '403 Forbidden: Query parameter token tidak ditemukan.' });
    }

    const rows = await readRows();

    let matchedUserData = null;
    for (const row of rows) {
      if (!row[4] || row[4] !== photoId) continue;

      const payload = verifySession(encryptedQuery, row);
      if (payload) {
        matchedUserData = {
          userId: payload.userId,
          nama: payload.nama,
          tgllogin: payload.tgllogin,
          pukullogin: payload.pukullogin,
          statusLogin: row[5] || STATUS_ONLINE,
          photoId: row[4],
        };
        break;
      }
    }

    if (!matchedUserData) {
      return res.status(403).json({
        status: 'error',
        message: '403 Forbidden: Token query tidak valid, sesi berakhir, atau data pengguna tidak cocok!',
      });
    }

    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.status(200).json({
        status: 'success',
        message: 'Validasi Token Berhasil. Data terverifikasi.',
        verificationData: {
          userId: matchedUserData.userId,
          nama: matchedUserData.nama,
          statusLogin: matchedUserData.statusLogin,
          tgllogin: matchedUserData.tgllogin,
          pukullogin: matchedUserData.pukullogin,
        },
      });
    }

    return await streamPhoto(res, photoId);
  } catch (error) {
    console.error('getPhotoAsset:', error);
    const code = error.code || (error.response && error.response.status);
    if (code === 404) {
      return res.status(404).json({ status: 'error', message: '404 Not Found: Foto tidak ditemukan di Drive.' });
    }
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mengambil foto.' });
  }
};