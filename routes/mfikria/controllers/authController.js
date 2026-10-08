require('dotenv').config();
const crypto = require('crypto');
const { spreadsheetId, sheets } = require('../config/spreadsheetConfig');
const { drive, defaultFolderId, uploadPhotoToDrive, getPhotosFromFolder } = require('../config/driveConfig');

const ADMIN_SECRET_TOKEN = process.env.ADMIN_SECRET_TOKEN;
const USER_SECRET_TOKEN = process.env.USER_SECRET_TOKEN;

// Kalau salah satu kosong, "undefined === undefined" bisa meloloskan siapa saja
if (!ADMIN_SECRET_TOKEN || !USER_SECRET_TOKEN) {
  throw new Error('ADMIN_SECRET_TOKEN dan USER_SECRET_TOKEN wajib diset di environment/.env');
}

const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Jakarta';
const SHEET_RANGE = 'Sheet1!A2:H'; // tanpa batas baris (sebelumnya A2:H100)
const IV_LENGTH = 12; // standar untuk AES-GCM
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_PHOTO_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

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
      String(payload.tgllogin) === String(row[6] || '').padStart(6, '0') &&
      String(payload.pukullogin) === String(row[7] || '').padStart(4, '0')
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

/* ========================= REGISTER ========================= */

exports.registerUser = async (req, res) => {
  const body = req.body || {};
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const requestedRole = String(body.role || 'user').toLowerCase();
  const photoFile = req.files && req.files.photo ? [].concat(req.files.photo)[0] : null;

  if (!username || username.length > 50) {
    return res.status(400).json({ status: 'error', message: 'Username wajib diisi (maksimal 50 karakter).' });
  }

  if (!['user', 'admin'].includes(requestedRole)) {
    return res.status(400).json({ status: 'error', message: 'Role tidak valid.' });
  }

  // Sebelumnya siapa pun bisa mendaftar sebagai admin lewat body.role
  if (requestedRole === 'admin' && getRoleFromToken(getClientToken(req)) !== 'admin') {
    return res.status(403).json({ status: 'error', message: '403 Forbidden: Hanya admin yang dapat membuat akun admin.' });
  }

  if (photoFile) {
    if (!ALLOWED_PHOTO_TYPES[photoFile.mimetype]) {
      return res.status(400).json({ status: 'error', message: 'Format foto harus JPG, PNG, WEBP, atau GIF.' });
    }
    if (photoFile.size > MAX_PHOTO_SIZE) {
      return res.status(400).json({ status: 'error', message: 'Ukuran foto maksimal 5 MB.' });
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

      let photoId = '';
      if (photoFile) {
        const safeName = username.replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `${safeName}_profile_${Date.now()}.${ALLOWED_PHOTO_TYPES[photoFile.mimetype]}`;
        const uploadedFile = await uploadPhotoToDrive(photoFile, fileName, defaultFolderId);
        photoId = uploadedFile.id;
      }

      const { tgllogin, pukullogin } = nowStamp();

      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Sheet1!A:H',
          // RAW: mencegah Sheets mengubah "0850" jadi 850 dan mencegah injeksi formula (=...)
          valueInputOption: 'RAW',
          requestBody: {
            values: [[newUserId, username, '-', requestedRole, photoId, STATUS_OFFLINE, tgllogin, pukullogin]],
          },
        });
      } catch (appendError) {
        // Jangan sisakan foto yatim di Drive kalau simpan ke sheet gagal
        if (photoId) {
          await drive.files.delete({ fileId: photoId, supportsAllDrives: true }).catch(() => {});
        }
        throw appendError;
      }

      return res.status(200).json({
        status: 'success',
        message: 'Registrasi berhasil!',
        data: { userId: newUserId, username, role: requestedRole },
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
  if (!username) {
    return res.status(400).json({ status: 'error', message: 'Username wajib disertakan.' });
  }

  try {
    return await withLock(async () => {
      const rows = await readRows();
      if (rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Database kosong.' });
      }

      // Case-insensitive, konsisten dengan pengecekan saat registrasi
      const index = rows.findIndex((row) => row[1] && row[1].toLowerCase() === username.toLowerCase());
      if (index === -1) {
        return res.status(404).json({ status: 'error', message: 'Username tidak ditemukan di database.' });
      }

      const row = rows[index];
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
        requestBody: { values: [[statusLogin, tgllogin, pukullogin]] }, // sebelumnya "resource"
      });

      const encryptedQuery = encryptPayload(
        { userId: foundUser.userId, nama: foundUser.username, tgllogin, pukullogin },
        getKey(clientToken, foundUser.userId, foundUser.username)
      );

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const photoUrl = foundUser.photoId
        ? `${baseUrl}/assets/photo/${foundUser.photoId}?query=${encodeURIComponent(encryptedQuery)}`
        : null;

      const dashboardCapabilities =
        userRoleType === 'admin'
          ? { canUploadFile: true, canModifyData: true, accessLevel: 'Full Control (Admin)' }
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
          googleDrivePhoto: { url: photoUrl },
        },
      });
    });
  } catch (error) {
    console.error('loginUser:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/* ========================= LOGOUT (BARU) ========================= */
// Logout: status_login jadi 'false', tanggal & pukul logout dicatat di kolom G dan H.
// Body: { username, encryptedQueryToken } + header Authorization: Bearer <token>
// Daftarkan di router: router.post('/logout', logoutUser)

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
  // Sebelumnya endpoint ini terbuka untuk siapa saja
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
        customProxyUrl: `${req.protocol}://${req.get('host')}/assets/photo/${file.id}`,
      })),
    });
  } catch (error) {
    console.error('getFolderPhotos:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/* ========================= VALIDASI & STREAM FOTO ========================= */

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
          statusLogin: row[5] || 'online',
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
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return res.status(200).json({
        status: 'success',
        message: 'Validasi Token Berhasil. Data terverifikasi.',
        verificationData: {
          userId: matchedUserData.userId,
          nama: matchedUserData.nama,
          statusLogin: matchedUserData.statusLogin,
          tgllogin: matchedUserData.tgllogin,
          pukullogin: matchedUserData.pukullogin,
          photoUrl: `${baseUrl}/assets/photo/${matchedUserData.photoId}`,
        },
      });
    }

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
      console.error('getPhotoAsset stream:', err);
      if (!res.headersSent) {
        res.status(500).json({ status: 'error', message: 'Gagal membaca file dari Drive.' });
      } else {
        res.destroy(err);
      }
    });

    fileStream.data.pipe(res);
  } catch (error) {
    // Sebelumnya SEMUA error (Drive mati, kuota, dll.) dilaporkan sebagai 403, menyulitkan debugging
    console.error('getPhotoAsset:', error);
    const code = error.code || (error.response && error.response.status);
    if (code === 404) {
      return res.status(404).json({ status: 'error', message: '404 Not Found: Foto tidak ditemukan di Drive.' });
    }
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mengambil foto.' });
  }
};