const { google } = require('googleapis');
require('dotenv').config();

// Memakai env yang sudah ada: GOOGLE_CREDENTIALS (JSON service account), sama seperti driveConfig.js
if (!process.env.GOOGLE_CREDENTIALS) {
  throw new Error('GOOGLE_CREDENTIALS belum diset di environment/.env');
}

let credentials;
try {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} catch (err) {
  throw new Error('GOOGLE_CREDENTIALS bukan JSON yang valid: ' + err.message);
}

let cached = { token: null, exp: 0 };

// Token read-only Drive, di-cache sampai mendekati kedaluwarsa (~1 jam)
async function getDriveToken() {
  if (cached.token && Date.now() < cached.exp - 5 * 60 * 1000) return cached;
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  const { access_token, expiry_date } = await auth.authorize();
  cached = { token: access_token, exp: expiry_date };
  return cached;
}

const STREAM_MODE = process.env.VIDEO_STREAM_MODE || 'redirect'; // 'redirect' | 'proxy'

// Redirect 302 ke file Drive (video / foto). File tidak lewat Vercel.
async function redirectToDrive(res, fileId) {
  const { token, exp } = await getDriveToken();
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true&access_token=${encodeURIComponent(token)}`;
  // Browser boleh pakai ulang redirect, jadi request Range berikutnya tidak memanggil function lagi
  const maxAge = Math.max(Math.min(Math.floor((exp - Date.now()) / 1000) - 600, 1800), 0);
  res.setHeader('Cache-Control', maxAge ? `private, max-age=${maxAge}` : 'no-store');
  return res.redirect(302, url);
}

// Video: redirect (hemat) atau proxy lama (fallback)
async function sendVideo(req, res, videoId, meta, streamVideo) {
  if (STREAM_MODE !== 'redirect') return streamVideo(req, res, videoId, meta);
  return redirectToDrive(res, videoId);
}

module.exports = { sendVideo, redirectToDrive };