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

const STREAM_MODE = process.env.VIDEO_STREAM_MODE || 'redirect'; // 'redirect' | 'proxy'

/* ========================= TOKEN ========================= */

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

function mediaUrl(fileId) {
  return `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
}

/* ========================= PROBE (tes 1 byte ke Drive) ========================= */
// Memastikan Drive benar-benar mengizinkan unduhan SEBELUM browser di-redirect.
// Hasil di-cache: OK 10 menit, gagal 1 menit. Biayanya 1 byte, bukan isi video.

const probeCache = new Map(); // fileId -> { ok, until }

async function probe(fileId, token) {
  const hit = probeCache.get(fileId);
  if (hit && Date.now() < hit.until) return hit.ok;

  let ok = false;
  try {
    const r = await fetch(mediaUrl(fileId), {
      headers: { Authorization: `Bearer ${token}`, Range: 'bytes=0-0' },
    });
    ok = r.status === 200 || r.status === 206;
    if (ok) {
      if (r.body && r.body.cancel) await r.body.cancel();
    } else {
      const body = (await r.text()).slice(0, 400);
      console.error(`DriveDirect probe gagal [${r.status}] file ${fileId}:`, body);
    }
  } catch (error) {
    console.error('DriveDirect probe error:', error.message);
  }

  if (probeCache.size > 500) probeCache.clear();
  probeCache.set(fileId, { ok, until: Date.now() + (ok ? 10 * 60 * 1000 : 60 * 1000) });
  return ok;
}

/* ========================= REDIRECT ========================= */

// Redirect 302 ke file Drive (video / foto). File tidak lewat Vercel.
// Mengembalikan true kalau redirect dikirim, false kalau tidak (pemanggil harus memakai proxy lama).
async function redirectToDrive(res, fileId) {
  try {
    const { token, exp } = await getDriveToken();
    if (!(await probe(fileId, token))) return false;

    const url = `${mediaUrl(fileId)}&access_token=${encodeURIComponent(token)}`;
    // Browser boleh pakai ulang redirect, jadi request Range berikutnya tidak memanggil function lagi
    const maxAge = Math.max(Math.min(Math.floor((exp - Date.now()) / 1000) - 600, 1800), 0);
    res.setHeader('Cache-Control', maxAge ? `private, max-age=${maxAge}` : 'no-store');
    res.redirect(302, url);
    return true;
  } catch (error) {
    console.error('DriveDirect redirect gagal:', error.message);
    return false;
  }
}

// Video: redirect (hemat); kalau gagal / mode proxy -> streamVideo lama
async function sendVideo(req, res, videoId, meta, streamVideo) {
  if (STREAM_MODE === 'redirect' && (await redirectToDrive(res, videoId))) return;
  return streamVideo(req, res, videoId, meta);
}

/* ========================= THUMBNAIL ========================= */
// Ambil gambar cuplikan video dari Drive (thumbnailLink, biasanya 10-40 KB).
// thumbnailLink untuk file privat harus diambil dengan token (credentialed request).
const thumbCache = new Map(); // fileId -> { buf, type, at }
const THUMB_TTL_MS = 6 * 60 * 60 * 1000;

async function fetchThumbnail(fileId) {
  const hit = thumbCache.get(fileId);
  if (hit && Date.now() - hit.at < THUMB_TTL_MS) return hit;

  const { token } = await getDriveToken();
  const headers = { Authorization: `Bearer ${token}` };

  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=thumbnailLink&supportsAllDrives=true`,
    { headers }
  );
  if (!metaRes.ok) throw new Error(`thumbnail meta ${metaRes.status}`);
  const { thumbnailLink } = await metaRes.json();
  if (!thumbnailLink) return null; // Drive belum membuat thumbnail (video baru diupload)

  const imgRes = await fetch(thumbnailLink.replace(/=s\d+$/, '=s480'), { headers });
  if (!imgRes.ok) throw new Error(`thumbnail image ${imgRes.status}`);

  const entry = {
    buf: Buffer.from(await imgRes.arrayBuffer()),
    type: imgRes.headers.get('content-type') || 'image/jpeg',
    at: Date.now(),
  };
  if (thumbCache.size > 200) thumbCache.clear();
  thumbCache.set(fileId, entry);
  return entry;
}

module.exports = { sendVideo, redirectToDrive, fetchThumbnail };