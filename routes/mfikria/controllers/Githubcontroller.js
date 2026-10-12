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
   const CACHE_MS = Number(process.env.GITHUB_CACHE_MS ?? 60 * 1000);
   const RATE_PER_MIN = Number(process.env.GITHUB_RATE_PER_MIN ?? 60);
   const UPSTREAM_TIMEOUT_MS = 8000;
   const MAX_BYTES = 2 * 1024 * 1024;
   
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
   
   function fetchGithub(path) {
     return new Promise((resolve, reject) => {
       const headers = {
         'User-Agent': 'mfikria-api',
         Accept: 'application/vnd.github+json',
         'X-GitHub-Api-Version': '2022-11-28',
       };
       if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
   
       const upstream = https.get({ hostname: GITHUB_HOST, path, headers, timeout: UPSTREAM_TIMEOUT_MS }, (r) => {
         const chunks = [];
         let size = 0;
         r.on('data', (chunk) => {
           size += chunk.length;
           if (size > MAX_BYTES) return upstream.destroy(new Error('response too large'));
           chunks.push(chunk);
         });
         r.on('end', () => resolve({ status: r.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
         r.on('error', reject);
       });
       upstream.on('timeout', () => upstream.destroy(new Error('timeout')));
       upstream.on('error', reject);
     });
   }
   
   // Bungkus handler: buildPath(req) -> path GitHub, atau null kalau parameter tidak valid
   function proxy(buildPath, transform) {
     return async (req, res) => {
       const path = buildPath(req);
       if (!path) return res.status(400).json({ status: 'error', message: '400 Bad Request: parameter tidak valid.' });
   
       res.setHeader('X-Content-Type-Options', 'nosniff');
       res.setHeader('Cache-Control', 'private, max-age=60');
   
       try {
         const hit = cache.get(path);
         let body;
         if (hit && Date.now() - hit.at < CACHE_MS) {
           body = hit.body;
         } else {
           const result = await fetchGithub(path);
           if (result.status === 404) return res.status(404).json({ status: 'error', message: '404 Not Found' });
           if (result.status === 403 || result.status === 429) {
             return res.status(429).json({ status: 'error', message: 'Batas rate limit GitHub tercapai, coba lagi nanti.' });
           }
           if (result.status !== 200) {
             console.error('github upstream status:', result.status, path);
             return res.status(502).json({ status: 'error', message: 'Gagal mengambil data dari GitHub.' });
           }
           body = result.body;
           if (cache.size > 500) {
             const now = Date.now();
             for (const [k, v] of cache) if (now - v.at > CACHE_MS) cache.delete(k);
             if (cache.size > 500) cache.clear();
           }
           cache.set(path, { at: Date.now(), body });
         }
   
         if (transform) return res.status(200).json(transform(JSON.parse(body)));
         return res.status(200).type('application/json').send(body);
       } catch (error) {
         console.error('github proxy:', error.message);
         return res.status(502).json({ status: 'error', message: 'Gagal mengambil data dari GitHub.' });
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