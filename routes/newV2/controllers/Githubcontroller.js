require('dotenv').config();
const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

// Format username & nama repo menurut aturan GitHub (cegah path aneh / injeksi)
const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const REPO_RE = /^[\w.-]{1,100}$/;

const client = axios.create({
    baseURL: GITHUB_API,
    timeout: 10000,
    validateStatus: () => true // status error GitHub ditangani manual di forward()
});

// Token dibaca dari .env (GITHUB_TOKEN_V2) setiap request. Kalau kosong, request tetap jalan tanpa login
// (limit GitHub jauh lebih kecil: 60 request/jam per IP). Token TIDAK PERNAH ditulis ke response/log.
const buildHeaders = () => {
    const headers = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'github-api-proxy'
    };
    const token = (process.env.GITHUB_TOKEN_V2 || '').trim();
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
};

// ---------------------------------------------------------------------------
// Helper query: hanya parameter yang diizinkan yang diteruskan ke GitHub
// ---------------------------------------------------------------------------
const paging = (q) => {
    const out = {};
    const page = parseInt(q.page, 10);
    const perPage = parseInt(q.per_page, 10);
    if (page > 0) out.page = page;
    if (perPage > 0) out.per_page = Math.min(perPage, 100);
    return out;
};

const oneOf = (value, allowed) => (allowed.includes(value) ? value : undefined);

// ---------------------------------------------------------------------------
// Kirim request ke GitHub lalu teruskan hasilnya
// ---------------------------------------------------------------------------
async function forward(res, path, params) {
    try {
        const r = await client.get(path, { headers: buildHeaders(), params });

        // Info sisa limit berguna untuk klien
        ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset'].forEach((h) => {
            if (r.headers[h]) res.set(h, r.headers[h]);
        });

        if (r.status >= 200 && r.status < 300) return res.status(200).json(r.data);

        const ghMessage = (r.data && r.data.message) || 'Permintaan ke GitHub gagal';

        if (r.status === 401) {
            return res.status(502).json({
                status: false,
                message: 'GITHUB_TOKEN_V2 tidak valid atau sudah kedaluwarsa. Periksa file .env di server.'
            });
        }
        if ((r.status === 403 || r.status === 429) && r.headers['x-ratelimit-remaining'] === '0') {
            const reset = Number(r.headers['x-ratelimit-reset']);
            return res.status(429).json({
                status: false,
                message: 'Rate limit GitHub habis.',
                resetAt: reset ? new Date(reset * 1000).toISOString() : null,
                hint: process.env.GITHUB_TOKEN_V2 ? undefined : 'Isi GITHUB_TOKEN_V2 di .env untuk limit yang lebih besar.'
            });
        }
        if (r.status === 404) {
            return res.status(404).json({ status: false, message: 'Data tidak ditemukan di GitHub' });
        }
        return res.status(r.status >= 400 && r.status < 500 ? r.status : 502).json({ status: false, message: ghMessage });
    } catch (error) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            return res.status(504).json({ status: false, message: 'GitHub tidak merespons (timeout)' });
        }
        console.error('GitHub request error:', error.message);
        return res.status(502).json({ status: false, message: 'Tidak bisa terhubung ke GitHub' });
    }
}

// Validasi param path; kirim 400 bila salah. Mengembalikan true kalau valid.
function validate(res, { user, repo }) {
    if (user !== undefined && !USERNAME_RE.test(user)) {
        res.status(400).json({ status: false, message: 'Username GitHub tidak valid' });
        return false;
    }
    if (repo !== undefined && !REPO_RE.test(repo)) {
        res.status(400).json({ status: false, message: 'Nama repository tidak valid' });
        return false;
    }
    return true;
}

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

// GET /  -> daftar endpoint
exports.index = (req, res) => {
    res.json({
        status: true,
        name: 'GitHub API Proxy',
        tokenConfigured: Boolean((process.env.GITHUB_TOKEN_V2 || '').trim()),
        endpoints: [
            'GET /search/users?q=torvalds&page=1&per_page=10&sort=followers&order=desc',
            'GET /:user',
            'GET /:user/repos?sort=updated&type=owner&page=1&per_page=30',
            'GET /:user/repos/:repo',
            'GET /:user/repos/:repo/events',
            'GET /:user/repos/:repo/languages',
            'GET /rate-limit'
        ]
    });
};

// GET /search/users?q=...  -> cari user GitHub mana pun
exports.searchUsers = (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) return res.status(400).json({ status: false, message: 'Query "q" wajib diisi' });
    if (q.length > 256) return res.status(400).json({ status: false, message: 'Query "q" maksimal 256 karakter' });

    forward(res, '/search/users', {
        q,
        sort: oneOf(req.query.sort, ['followers', 'repositories', 'joined']),
        order: oneOf(req.query.order, ['asc', 'desc']),
        ...paging(req.query)
    });
};

// GET /:user  -> profil user mana pun
exports.getUser = (req, res) => {
    const { user } = req.params;
    if (!validate(res, { user })) return;
    forward(res, `/users/${encodeURIComponent(user)}`);
};

// GET /:user/repos
exports.getUserRepos = (req, res) => {
    const { user } = req.params;
    if (!validate(res, { user })) return;
    forward(res, `/users/${encodeURIComponent(user)}/repos`, {
        sort: oneOf(req.query.sort, ['created', 'updated', 'pushed', 'full_name']),
        direction: oneOf(req.query.direction, ['asc', 'desc']),
        type: oneOf(req.query.type, ['all', 'owner', 'member']),
        ...paging(req.query)
    });
};

// GET /:user/repos/:repo
exports.getRepo = (req, res) => {
    const { user, repo } = req.params;
    if (!validate(res, { user, repo })) return;
    forward(res, `/repos/${encodeURIComponent(user)}/${encodeURIComponent(repo)}`);
};

// GET /:user/repos/:repo/events
exports.getRepoEvents = (req, res) => {
    const { user, repo } = req.params;
    if (!validate(res, { user, repo })) return;
    forward(res, `/repos/${encodeURIComponent(user)}/${encodeURIComponent(repo)}/events`, paging(req.query));
};

// GET /:user/repos/:repo/languages
exports.getRepoLanguages = (req, res) => {
    const { user, repo } = req.params;
    if (!validate(res, { user, repo })) return;
    forward(res, `/repos/${encodeURIComponent(user)}/${encodeURIComponent(repo)}/languages`);
};

// GET /rate-limit
exports.getRateLimit = (req, res) => forward(res, '/rate_limit');