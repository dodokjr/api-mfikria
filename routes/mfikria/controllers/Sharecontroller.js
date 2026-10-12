const crypto = require('crypto');
const { ADMIN_SECRET_TOKEN, USER_SECRET_TOKEN } = require('../utilitis/Common');
const {
  API_BASE_PATH,
  VIDEO_REQUIRE_FETCH_DEST,
  getClientIp,
  getBaseUrl,
  buildShare,
  resolveVideoId,
  getVideoMeta,
  isAllowedVideo,
  videoTitle,
  checkGuestAccess,
  getViewsMap,
  addView,
  alreadyCounted,
  forgetView,
  streamVideo,
} = require('../utilitis/Mfikriawebcore');
const { renderPlayerHtml } = require('../utilitis/Playerpage');

/* ========================= HELPER ========================= */

const SHARE_KEY = crypto
  .createHash('sha256')
  .update(process.env.SHARE_SECRET || `share|${ADMIN_SECRET_TOKEN}|${USER_SECRET_TOKEN}`)
  .digest();
const SHARE_STREAM_TTL_MS = Number(process.env.SHARE_STREAM_TTL_MS) || 6 * 60 * 60 * 1000;
// Situs mana yang boleh menyematkan iframe. "*" = semua. Contoh: "https://situsku.com https://blog.com"
const EMBED_ALLOWED_ORIGINS = process.env.EMBED_ALLOWED_ORIGINS || '*';

// Link /share/:id langsung diarahkan ke halaman nonton di front end
const FRONTEND_WATCH_URL = process.env.FRONTEND_WATCH_URL || 'https://mfikria.vercel.app/video/watch';
// Set SHARE_REDIRECT=0 kalau ingin /share/:id menampilkan halaman player ini (tanpa redirect)
const SHARE_REDIRECT = process.env.SHARE_REDIRECT !== '0';
// Bot preview media sosial: tidak di-redirect supaya tetap dapat meta Open Graph (judul, dll.)
const CRAWLER_RE =
  /facebookexternalhit|facebot|whatsapp|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|skypeuripreview|pinterest|embedly|vkshare|redditbot|googlebot|bingbot/i;
const SHARE_ID_RE = /^[\w.~-]{1,200}$/;

// ID di link share (shareId) dipakai sebagai ?id= di front end (videoToken)
function watchUrl(shortId) {
  return `${FRONTEND_WATCH_URL}?id=${encodeURIComponent(shortId)}`;
}

function sameString(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function signShare(shortId, exp) {
  return crypto.createHmac('sha256', SHARE_KEY).update(`${shortId}.${exp}`).digest('base64url').slice(0, 22);
}

function checkShareSig(req, shortId) {
  const exp = Number(req.query.e);
  const sig = typeof req.query.s === 'string' ? req.query.s : '';
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return sameString(sig, signShare(shortId, exp));
}

function pageNotFound(res) {
  return res
    .status(404)
    .type('html')
    .send(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404</title>' +
        '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#000;color:#f9a8d4;font-family:system-ui,sans-serif">404 - Video tidak ditemukan</body>'
    );
}

async function renderSharePage(req, res, mode) {
  try {
    const shortId = req.params.id;

    // /share/:id -> langsung ke halaman nonton di front end (kecuali bot preview media sosial)
    if (mode === 'share' && SHARE_REDIRECT && !CRAWLER_RE.test(req.headers['user-agent'] || '')) {
      if (!SHARE_ID_RE.test(shortId)) return pageNotFound(res);
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(302, watchUrl(shortId));
    }

    const videoId = await resolveVideoId(shortId);
    if (!videoId) return pageNotFound(res);

    let meta;
    try {
      meta = await getVideoMeta(videoId);
    } catch (err) {
      return pageNotFound(res);
    }
    if (!isAllowedVideo(meta)) return pageNotFound(res);

    const exp = Date.now() + SHARE_STREAM_TTL_MS;
    const qs = `?e=${exp}&s=${signShare(shortId, exp)}`;
    const title = videoTitle(meta);
    const viewsMap = await getViewsMap();

    const html = renderPlayerHtml({
      mode,
      title,
      views: viewsMap.get(videoId) || 0,
      streamPath: `${API_BASE_PATH}/s/${shortId}/stream${qs}`,
      viewPath: `${API_BASE_PATH}/s/${shortId}/view${qs}`,
      share: buildShare(getBaseUrl(req), shortId, title),
      watch: watchUrl(shortId),
    });

    // Boleh disematkan di iframe (atur EMBED_ALLOWED_ORIGINS untuk membatasi).
    // cdn.tailwindcss.com diizinkan untuk script karena styling memakai Tailwind CDN.
    res.removeHeader('X-Frame-Options');
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'none'; media-src 'self'; script-src 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors ${EMBED_ALLOWED_ORIGINS}`
    );
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).type('html').send(html);
  } catch (error) {
    console.error('renderSharePage:', error.message);
    return res
      .status(500)
      .type('html')
      .send('<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;text-align:center;padding:48px">Terjadi kesalahan pada server.</body>');
  }
}

/* ========================= ENDPOINT ========================= */

// GET /share/:id  -> redirect ke front end (/video/watch?id=...). Bot media sosial tetap dapat halaman dengan meta Open Graph.
exports.sharePage = (req, res) => renderSharePage(req, res, 'share');

// GET /embed/:id  -> halaman player polos, untuk <iframe src="...">
exports.embedPage = (req, res) => renderSharePage(req, res, 'embed');

// GET /s/:id/stream?e=&s=  -> stream video untuk halaman share/embed (URL bertanda tangan)
exports.getSharedVideo = async (req, res) => {
  const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });

  try {
    const shortId = req.params.id;
    if (!checkShareSig(req, shortId)) return notFound();

    const dest = req.headers['sec-fetch-dest'];
    if (VIDEO_REQUIRE_FETCH_DEST && dest && dest !== 'video') return notFound();

    const videoId = await resolveVideoId(shortId);
    if (!videoId) return notFound();

    let meta;
    try {
      meta = await getVideoMeta(videoId);
    } catch (err) {
      return notFound();
    }
    if (!isAllowedVideo(meta) || meta.size === undefined) return notFound();

    return await streamVideo(req, res, videoId, meta);
  } catch (error) {
    console.error('getSharedVideo:', error);
    const code = error.code || (error.response && error.response.status);
    if (code === 404) return notFound();
    if (!res.headersSent) {
      return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mengambil video.' });
    }
  }
};

// POST /s/:id/view?e=&s=  -> catat 1 view dari halaman share/embed (dedupe per IP)
exports.registerSharedView = async (req, res) => {
  const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });

  let viewerId = null;
  let videoId = null;
  try {
    const shortId = req.params.id;
    if (!checkShareSig(req, shortId)) return notFound();

    videoId = await resolveVideoId(shortId);
    if (!videoId) return notFound();

    let meta;
    try {
      meta = await getVideoMeta(videoId);
    } catch (err) {
      return notFound();
    }
    if (!isAllowedVideo(meta)) return notFound();

    viewerId = `ip:${getClientIp(req)}`;
    if (alreadyCounted(viewerId, videoId)) {
      const map = await getViewsMap();
      return res.status(200).json({ status: 'success', data: { views: map.get(videoId) || 0, counted: false } });
    }

    const views = await addView(videoId, videoTitle(meta));
    return res.status(200).json({ status: 'success', data: { views, counted: true } });
  } catch (error) {
    if (viewerId && videoId) forgetView(viewerId, videoId);
    console.error('registerSharedView:', error.message, error.errors || '');
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mencatat view.' });
  }
};

// GET /share-info/:id?query=&tgl=  -> link share, kode iframe, dan link media sosial 1 video (untuk tombol Share di front end)
exports.getShareInfo = async (req, res) => {
  const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });

  if (!checkGuestAccess(req, res)) return;

  try {
    const shortId = req.params.id;
    const videoId = await resolveVideoId(shortId);
    if (!videoId) return notFound();

    let meta;
    try {
      meta = await getVideoMeta(videoId);
    } catch (err) {
      return notFound();
    }
    if (!isAllowedVideo(meta)) return notFound();

    return res.status(200).json({
      status: 'success',
      data: buildShare(getBaseUrl(req), shortId, videoTitle(meta)),
    });
  } catch (error) {
    console.error('getShareInfo:', error);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat membuat link share.' });
  }
};