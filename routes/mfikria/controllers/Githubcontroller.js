const https = require('https');
const { checkGuestAccess, getClientIp } = require('../utilitis/Mfikriawebcore');

const GITHUB_HOST = 'api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
// Opsional: batasi hanya username tertentu, contoh: GITHUB_ALLOWED_USERS=mfikria,octocat
// Kalau kosong, semua username GitHub yang valid boleh diakses.
const ALLOWED_USERS = (process.env.GITHUB_ALLOWED_USERS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// Pengganti operator `??` supaya tetap jalan di Node versi lama
function numEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const CACHE_MS = numEnv('GITHUB_CACHE_MS', 60 * 1000);
const RATE_PER_MIN = numEnv('GITHUB_RATE_PER_MIN', 60);
const UPSTREAM_TIMEOUT_MS = numEnv('GITHUB_TIMEOUT_MS', 8000);
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 2;
// Banyak VPS punya IPv6 yang rusak -> koneksi ke GitHub timeout. Default: paksa IPv4.
const FORCE_IPV4 = process.env.GITHUB_FORCE_IPV4 !== '0';
// GITHUB_DEBUG=1 -> sertakan alasan error di response JSON (jangan aktifkan di produksi)
const DEBUG = process.env.GITHUB_DEBUG === '1';

/* ========================= VALIDASI ========================= */

const USER_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i; // aturan username GitHub
const REPO_REGEX = /^[A-Za-z0-9._-]{1,100}$/;

function validUser(user) {
  if (!USER_REGEX.test(user)) return false;
  return ALLOWED_USERS.length === 0 || ALLOWED_USERS.includes(user.toLowerCase());
}

function validRepo(repo) {
  return REPO_REGEX.test(repo) && repo !== '.' && repo !== '..';
}

// per_page (1-100) & page (1-1000) opsional, hanya angka
function pageQuery(req) {
  const parts = [];
  const perPage = parseInt(req.query.per_page, 10);
  const page = parseInt(req.query.page, 10);
  if (Number.isInteger(perPage) && perPage >= 1 && perPage <= 100) parts.push(`per_page=${perPage}`);
  if (Number.isInteger(page) && page >= 1 && page <= 1000) parts.push(`page=${page}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

/* ========================= MIDDLEWARE ========================= */

// Batas request per IP per menit (in-memory, 1 instance server)
const rate = new Map();
exports.rateLimit = (req, res, next) => {
  const ip = getClientIp(req);
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

// Access_Token yang sama dengan /guest-token (checkGuestAccess membalas 401 sendiri kalau tidak valid)
exports.guestAuth = (req, res, next) => {
  if (checkGuestAccess(req, res)) next();
};

/* ========================= PANGGIL GITHUB ========================= */

const cache = new Map(); // path -> { at, body }

// Pesan error yang berguna. Di Node 18+ error koneksi bisa berupa AggregateError
// dengan message kosong, jadi pakai code / error pertama di dalamnya.
function describeError(error) {
  if (!error) return 'unknown error';
  const inner = Array.isArray(error.errors) && error.errors.length ? error.errors[0] : null;
  const code = error.code || (inner && inner.code);
  const msg = error.message || (inner && inner.message) || '';
  return [code, msg].filter(Boolean).join(' ') || String(error);
}

function fetchGithub(path, useToken, redirectsLeft) {
  if (useToken === undefined) useToken = true;
  if (redirectsLeft === undefined) redirectsLeft = MAX_REDIRECTS;

  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'mfikria-api',
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (useToken && GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

    const options = { hostname: GITHUB_HOST, path, headers, timeout: UPSTREAM_TIMEOUT_MS };
    if (FORCE_IPV4) options.family = 4;

    let settled = false;
    const done = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };

    const upstream = https.get(options, (r) => {
      // Repo yang di-rename / dipindah dibalas 301/302/307/308 oleh GitHub
      if ([301, 302, 307, 308].includes(r.statusCode) && r.headers.location) {
        r.resume();
        if (redirectsLeft <= 0) return done(reject, new Error('too many redirects'));
        try {
          const next = new URL(r.headers.location, `https://${GITHUB_HOST}`);
          if (next.hostname !== GITHUB_HOST) return done(reject, new Error('redirect to foreign host'));
          return fetchGithub(next.pathname + next.search, useToken, redirectsLeft - 1).then(
            (v) => done(resolve, v),
            (e) => done(reject, e)
          );
        } catch (e) {
          return done(reject, e);
        }
      }

      const chunks = [];
      let size = 0;
      r.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_BYTES) return upstream.destroy(new Error('response too large'));
        chunks.push(chunk);
      });
      r.on('end', () =>
        done(resolve, {
          status: r.statusCode,
          headers: r.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        })
      );
      r.on('aborted', () => done(reject, new Error('response aborted')));
      r.on('error', (e) => done(reject, e));
    });

    upstream.on('timeout', () => upstream.destroy(new Error('timeout')));
    upstream.on('error', (e) => done(reject, e));
  });
}

// Panggil GitHub; kalau token ditolak (401), coba lagi tanpa token
async function requestUpstream(path) {
  let result = await fetchGithub(path, true);
  if (result.status === 401 && GITHUB_TOKEN) {
    console.error('github: GITHUB_TOKEN ditolak (401 Bad credentials), mencoba ulang tanpa token. Periksa token di .env');
    result = await fetchGithub(path, false);
  }
  return result;
}

function isRateLimited(result) {
  if (result.status === 429) return true;
  if (result.status !== 403) return false;
  const h = result.headers || {};
  if (h['x-ratelimit-remaining'] === '0' || h['retry-after']) return true;
  return /rate limit|abuse/i.test(result.body || '');
}

function sendError(res, status, message, reason) {
  res.setHeader('Cache-Control', 'no-store');
  const payload = { status: 'error', message };
  if (DEBUG && reason) payload.reason = reason;
  return res.status(status).json(payload);
}

// Bungkus handler: buildPath(req) -> path GitHub, atau null kalau parameter tidak valid
function proxy(buildPath, transform) {
  return async (req, res) => {
    const path = buildPath(req);
    if (!path) return sendError(res, 400, '400 Bad Request: parameter tidak valid.');

    res.setHeader('X-Content-Type-Options', 'nosniff');

    const hit = cache.get(path);
    const send = (body) => {
      res.setHeader('Cache-Control', 'private, max-age=60');
      if (transform) return res.status(200).json(transform(JSON.parse(body)));
      return res.status(200).type('application/json').send(body);
    };

    try {
      if (hit && Date.now() - hit.at < CACHE_MS) return send(hit.body);

      const result = await requestUpstream(path);

      if (result.status === 404) return sendError(res, 404, '404 Not Found');

      if (isRateLimited(result)) {
        if (hit) return send(hit.body); // sajikan cache lama daripada error
        return sendError(res, 429, 'Batas rate limit GitHub tercapai, coba lagi nanti.', `upstream ${result.status}`);
      }

      if (result.status !== 200) {
        console.error('github upstream status:', result.status, path, (result.body || '').slice(0, 200));
        if (hit) return send(hit.body);
        const message =
          result.status === 403 || result.status === 401
            ? 'GitHub menolak akses (periksa GITHUB_TOKEN).'
            : 'Gagal mengambil data dari GitHub.';
        return sendError(res, 502, message, `upstream ${result.status}`);
      }

      if (cache.size > 500) {
        const now = Date.now();
        for (const [k, v] of cache) if (now - v.at > CACHE_MS) cache.delete(k);
        if (cache.size > 500) cache.clear();
      }
      cache.set(path, { at: Date.now(), body: result.body });

      return send(result.body);
    } catch (error) {
      const reason = describeError(error);
      console.error('github proxy:', reason, path);
      if (hit) {
        try {
          return send(hit.body);
        } catch (_) {
          /* lanjut ke error di bawah */
        }
      }
      return sendError(res, 502, 'Gagal mengambil data dari GitHub.', reason);
    }
  };
}

/* ========================= HANDLER ========================= */

// GET /  (tanpa token)
exports.index = (req, res) => {
  res.status(404).json({
    status: 404,
    message: 'No Data :(',
    slug: '/v2/github/:users',
  });
};

// GET /l/limit -> sisa kuota GitHub API (hanya angka kuota)
exports.getRateLimit = proxy(
  () => '/rate_limit',
  (data) => {
    const core = (data && data.resources && data.resources.core) || {};
    return { status: 'success', data: { limit: core.limit, remaining: core.remaining, reset: core.reset } };
  }
);

// GET /:user
exports.getUser = proxy((req) => (validUser(req.params.user) ? `/users/${encodeURIComponent(req.params.user)}` : null));

// GET /:user/repos?per_page=&page=
exports.getRepos = proxy((req) =>
  validUser(req.params.user) ? `/users/${encodeURIComponent(req.params.user)}/repos${pageQuery(req)}` : null
);

// GET /:user/repos/:reposname
exports.getRepo = proxy((req) => {
  const { user, reposname } = req.params;
  return validUser(user) && validRepo(reposname) ? `/repos/${encodeURIComponent(user)}/${encodeURIComponent(reposname)}` : null;
});

// GET /:user/repos/:reposname/events?per_page=&page=
exports.getRepoEvents = proxy((req) => {
  const { user, reposname } = req.params;
  return validUser(user) && validRepo(reposname)
    ? `/repos/${encodeURIComponent(user)}/${encodeURIComponent(reposname)}/events${pageQuery(req)}`
    : null;
});

// GET /:user/repos/:reposname/languages
exports.getRepoLanguages = proxy((req) => {
  const { user, reposname } = req.params;
  return validUser(user) && validRepo(reposname)
    ? `/repos/${encodeURIComponent(user)}/${encodeURIComponent(reposname)}/languages`
    : null;
});