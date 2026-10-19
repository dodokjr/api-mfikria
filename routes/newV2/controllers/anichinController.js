const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = (process.env.ANICHIN_BASE_URL || 'https://anichin.moe').replace(/\/+$/, ''); // Sesuaikan domain aktif

// Path endpoint watch milik API ini (dipakai untuk link prev/next)
const WATCH_PATH = process.env.ANICHIN_WATCH_PATH || '/v2/donghua/anichi/watch';

// Total waktu maksimal untuk satu fetchHtml (semua retry digabung).
// Harus LEBIH KECIL dari maxDuration fungsi Vercel Anda.
// Default: 9 dtk tanpa scraper, 25 dtk dengan scraper. Override lewat FETCH_BUDGET_MS.
const FETCH_BUDGET_MS =
    parseInt(process.env.FETCH_BUDGET_MS, 10) || (process.env.SCRAPER_URL_TEMPLATE ? 25000 : 9000);

// "https://anichin.moe/slug/" -> "/slug/"
const pathOf = (u) => {
    try {
        const x = new URL(u, `${BASE_URL}/`);
        return x.pathname + x.search;
    } catch {
        return u;
    }
};

// Link ke endpoint watch milik API ini
const toWatch = (u) => `${WATCH_PATH}?url=${encodeURIComponent(pathOf(u))}`;

// Catatan: Accept-Encoding sengaja TIDAK diset manual. Axios mengaturnya sendiri
// dan men-decode respons dengan benar (header "br" manual bisa merusak HTML di axios lama).
const client = axios.create({
    timeout: 15000,
    maxRedirects: 5,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': `${BASE_URL}/`,
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'no-cache'
    }
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Hanya cocok dengan halaman challenge asli (judul "Just a moment..." atau variabel cf_chl_opt),
// bukan skrip /cdn-cgi/challenge-platform yang juga ada di halaman normal
const isChallenge = (html) =>
    typeof html === 'string' &&
    (/<title>\s*(just a moment|attention required)/i.test(html) || /cf_chl_opt|cf-chl-bypass/i.test(html));

const blocked = (status) => {
    const err = new Error(
        `Situs target memblokir request${status ? ` (HTTP ${status})` : ''}, kemungkinan proteksi Cloudflare/anti-bot atau IP server diblokir. Di Vercel, set SCRAPER_URL_TEMPLATE untuk memakai layanan scraping.`
    );
    err.status = 502;
    err.upstreamStatus = status || null;
    return err;
};

// Ambil HTML dengan retry dan batas waktu total.
// Opsional lewat layanan scraping: SCRAPER_URL_TEMPLATE=https://api.scraperapi.com/?api_key=KUNCI&url={url}
async function fetchHtml(url, retries = 2) {
    const deadline = Date.now() + FETCH_BUDGET_MS;
    const template = (process.env.SCRAPER_URL_TEMPLATE || '').trim().replace(/^["']|["']$/g, '');
    if (template && !template.includes('{url}')) {
        const err = new Error('SCRAPER_URL_TEMPLATE tidak mengandung placeholder {url}.');
        err.status = 500;
        throw err;
    }
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const remaining = deadline - Date.now();
        if (remaining < 1500) break; // sisa waktu terlalu sedikit untuk percobaan lagi

        try {
            const { data } = template
                ? await axios.get(template.replace('{url}', encodeURIComponent(url)), {
                      timeout: Math.min(remaining, 60000)
                  })
                : await client.get(url, { timeout: Math.min(remaining, 15000) });
            if (isChallenge(data)) throw blocked(200);
            return data;
        } catch (error) {
            lastError = error;
            const status = error.response && error.response.status;
            if (status === 404 || error.status === 502) break;
            if (attempt < retries && deadline - Date.now() > 2500) await sleep(800 * (attempt + 1));
        }
    }

    if (!lastError) {
        const err = new Error('Waktu habis sebelum situs sumber sempat merespons. Naikkan FETCH_BUDGET_MS dan maxDuration di Vercel.');
        err.status = 504;
        throw err;
    }

    const status = lastError.response && lastError.response.status;
    if (lastError.status === 502) throw lastError;
    if (status === 403 || status === 503) throw blocked(status);
    if (lastError.code === 'ECONNABORTED' || lastError.code === 'ETIMEDOUT') {
        const err = new Error('Koneksi ke situs sumber timeout. Kemungkinan IP server diblokir atau scraper terlalu lambat.');
        err.status = 504;
        throw err;
    }
    throw lastError;
}

// Ubah URL relatif ("/slug/") jadi lengkap ("https://anichin.moe/slug/"); URL yang sudah lengkap dibiarkan
const abs = (u) => {
    if (!u) return '';
    try {
        return new URL(String(u).trim(), `${BASE_URL}/`).href;
    } catch {
        return u;
    }
};

// Terima URL relatif maupun lengkap; hanya domain anichin yang diizinkan (cegah SSRF)
const resolveUrl = (u) => {
    try {
        const parsed = new URL(String(u).trim(), `${BASE_URL}/`);
        return parsed.hostname === new URL(BASE_URL).hostname ? parsed.href : null;
    } catch {
        return null;
    }
};

// Gambar sering lazy-load: URL asli ada di data-src, bukan src
const imgSrc = ($el) => {
    const img = $el.find('img').first();
    return abs(
        img.attr('data-src') ||
        img.attr('data-lazy-src') ||
        img.attr('data-original') ||
        img.attr('src') ||
        ''
    );
};

// Petunjuk diagnosis kalau hasil kosong
const meta = ($, html) => ({
    pageTitle: $('title').text().trim(),
    htmlLength: String(html).length,
    hint: 'Hasil kosong. Kalau pageTitle berisi "Just a moment" berarti kena Cloudflare; kalau halaman normal, selector perlu disesuaikan (Inspect Element).'
});

const fail = (res, error) => {
    const body = { status: false, message: error.message };
    if (error.upstreamStatus) body.upstreamStatus = error.upstreamStatus;
    res.status(error.status || 500).json(body);
};

// Parser kartu donghua (dipakai di halaman utama dan pencarian)
function parseCards($, scope) {
    const seen = new Set();
    const list = [];

    (scope || $.root()).find('.listupd .bs, article.bs').each((_, el) => {
        const $el = $(el);
        const link = $el.find('a').first().attr('href');
        if (!link || seen.has(link)) return;
        seen.add(link);

        list.push({
            title:
                $el.find('.tt h2').first().text().trim() ||
                $el.find('a').first().attr('title') ||
                $el.find('.tt').first().text().trim(),
            episode: $el.find('.epx').first().text().trim(),
            type: $el.find('.typez').first().text().trim(),
            status: $el.find('.sb').first().text().trim(),
            link: abs(link),
            path: link, // bentuk relatif, bisa langsung dipakai untuk endpoint watch
            poster: imgSrc($el)
        });
    });

    return list;
}

// GET: Latest Donghua
exports.getLatest = async (req, res) => {
    try {
        const html = await fetchHtml(BASE_URL);
        const $ = cheerio.load(html);
        const data = parseCards($);

        const body = { status: true, data };
        if (!data.length) body.debug = meta($, html);
        res.status(200).json(body);
    } catch (error) {
        fail(res, error);
    }
};

// GET: Cari Donghua (?q=btth)
exports.searchDonghua = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, message: 'Query "q" wajib diisi' });

    try {
        // Paginasi mengikuti situs sumber: halaman 2 dst. = /page/N/?s=...
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const searchUrl =
            page > 1
                ? `${BASE_URL}/page/${page}/?s=${encodeURIComponent(q)}`
                : `${BASE_URL}/?s=${encodeURIComponent(q)}`;

        const html = await fetchHtml(searchUrl);
        const $ = cheerio.load(html);
        const data = parseCards($);

        // Info halaman dibaca dari navigasi paginasi situs sumber
        const numbers = $('.pagination .page-numbers, .pagination a, .hpage a')
            .map((_, el) => parseInt($(el).text().trim(), 10))
            .get()
            .filter((n) => Number.isInteger(n));
        const siteHasNext = $('.pagination a.next, .pagination .next, .hpage a.r').length > 0;
        const totalPages = Math.max(page, ...numbers, siteHasNext ? page + 1 : 1);

        const pagination = {
            page,
            count: data.length,
            totalPages,
            hasPrev: page > 1,
            hasNext: siteHasNext || page < totalPages,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: siteHasNext || page < totalPages ? page + 1 : null
        };

        const body = { status: true, query: q, data, pagination };
        if (!data.length && page === 1) body.debug = meta($, html);
        res.status(200).json(body);
    } catch (error) {
        // Halaman di luar jangkauan: WordPress membalas 404, kembalikan hasil kosong, bukan error
        if (error.response && error.response.status === 404) {
            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            return res.status(200).json({
                status: true,
                query: q,
                data: [],
                pagination: { page, count: 0, totalPages: page - 1, hasPrev: page > 1, hasNext: false, prevPage: page > 1 ? page - 1 : null, nextPage: null }
            });
        }
        fail(res, error);
    }
};

// GET: Detail Donghua & List Episode (?url=...)
exports.getDetail = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: 'Query "url" wajib diisi' });

    // Terima URL relatif (/slug/) maupun lengkap; hanya domain anichin yang diizinkan (cegah SSRF)
    const target = resolveUrl(url);
    if (!target) {
        return res.status(400).json({ status: false, message: 'URL tidak valid atau bukan dari domain anichin yang dikonfigurasi' });
    }

    try {
        const html = await fetchHtml(target);
        const $ = cheerio.load(html);

        const episodes = [];
        $('.eplister ul li').each((_, el) => {
            const $el = $(el);
            const href = $el.find('a').first().attr('href');
            episodes.push({
                title: $el.find('.epl-title').text().trim(),
                episodeNumber: $el.find('.epl-num').text().trim(),
                releaseDate: $el.find('.epl-date').text().trim(),
                link: abs(href),
                path: href ? pathOf(href) : '',
                watch: href ? toWatch(href) : null
            });
        });

        // Ambil nilai dari baris info seperti "Status: Ongoing"
        const info = (label) => {
            let value = '';
            $('.spe span').each((_, el) => {
                const text = $(el).text().trim();
                if (text.toLowerCase().startsWith(label.toLowerCase())) {
                    value = text.slice(text.indexOf(':') + 1).trim();
                }
            });
            return value;
        };

        const synopsis =
            $('.entry-content[itemprop="description"]').text().trim() ||
            $('.entry-content p').map((_, p) => $(p).text().trim()).get().filter(Boolean).join('\n');

        // Halaman tanpa daftar episode (movie / OVA, URL tanpa nomor episode): jadikan satu entri tontonan
        const pageTitle = $('.entry-title').first().text().trim();
        const isMovie = episodes.length === 0 && !!pageTitle;
        if (isMovie) {
            episodes.push({
                title: pageTitle,
                episodeNumber: 'Movie',
                releaseDate: info('Released'),
                link: target,
                path: pathOf(target),
                watch: toWatch(target)
            });
        }

        // Paginasi daftar episode: ?page=1&limit=20 (limit maksimal 100)
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
        const totalItems = episodes.length;
        const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const pagedEpisodes = episodes.slice((page - 1) * limit, page * limit);
        const pagination = {
            page,
            limit,
            totalItems,
            totalPages,
            hasPrev: page > 1,
            hasNext: page < totalPages,
            prevPage: page > 1 ? Math.min(page - 1, totalPages) : null,
            nextPage: page < totalPages ? page + 1 : null
        };

        const detail = {
            title: pageTitle,
            isMovie,
            watch: isMovie ? toWatch(target) : null,
            poster: imgSrc($('.thumb').first()),
            status: info('Status'),
            type: info('Type'),
            studio: info('Studio'),
            released: info('Released'),
            synopsis,
            totalEpisodes: totalItems,
            episodes: pagedEpisodes,
            pagination: isMovie ? null : pagination // movie hanya satu entri, tidak perlu paginasi
        };

        const body = { status: true, data: detail };
        if (!detail.title && !episodes.length) body.debug = meta($, html);
        res.status(200).json(body);
    } catch (error) {
        fail(res, error);
    }
};

// Parser daftar "Popular Series" (sidebar) untuk satu tab: wpop-weekly / wpop-monthly / wpop-alltime
function parsePopular($, tabClass) {
    const seen = new Set();
    const list = [];

    $(`.serieslist.${tabClass} li`).each((_, el) => {
        const $el = $(el);
        const href = $el.find('a').first().attr('href');
        if (!href || seen.has(href)) return;
        seen.add(href);

        const titleLink = $el.find('h4 a').first();
        list.push({
            rank: parseInt($el.find('.ctr').first().text().trim(), 10) || list.length + 1,
            title: titleLink.text().trim() || $el.find('a.series').first().attr('title') || '',
            link: abs(href),
            path: pathOf(href),
            poster: imgSrc($el),
            genres: $el
                .find('.leftseries span a')
                .map((__, a) => $(a).text().trim())
                .get()
                .filter(Boolean),
            rating: $el.find('.numscore').first().text().trim()
        });
    });

    return list;
}

// GET: Paling Populer (?type=weekly | monthly | all). Kosong = ketiganya sekaligus
exports.getPopular = async (req, res) => {
    const tabs = { weekly: 'wpop-weekly', monthly: 'wpop-monthly', all: 'wpop-alltime' };
    const type = String(req.query.type || '').toLowerCase();
    if (type && !tabs[type]) {
        return res.status(400).json({ status: false, message: 'Query "type" harus weekly, monthly, atau all' });
    }

    try {
        const html = await fetchHtml(BASE_URL);
        const $ = cheerio.load(html);

        const data = {};
        Object.entries(tabs).forEach(([key, tabClass]) => {
            if (type && type !== key) return;
            data[key] = parsePopular($, tabClass);
        });

        const body = { status: true, data };
        if (Object.values(data).every((list) => !list.length)) body.debug = meta($, html);
        res.status(200).json(body);
    } catch (error) {
        fail(res, error);
    }
};

// GET: Link Nonton / Streaming (?url=/return-of-the-immortal-emperor-episode-16-subtitle-indonesia/)
// Terima link relatif maupun lengkap dari hasil getLatest / getDetail
exports.getWatch = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: 'Query "url" wajib diisi' });

    const target = resolveUrl(url);
    if (!target) {
        return res.status(400).json({ status: false, message: 'URL tidak valid atau bukan dari domain anichin yang dikonfigurasi' });
    }

    try {
        const html = await fetchHtml(target);
        const $ = cheerio.load(html);

        // Embed bisa berbentuk "//host/path" atau "/path"
        const normalize = (src) => {
            if (!src) return '';
            const s = String(src).trim();
            if (!s || s === 'about:blank') return '';
            return s.startsWith('//') ? `https:${s}` : abs(s);
        };

        const servers = [];
        const add = (name, src) => {
            const u = normalize(src);
            if (!u || servers.some((s) => s.url === u)) return;
            servers.push({ name: name || `Server ${servers.length + 1}`, url: u });
        };

        // Player bawaan
        const frame = $('#pembed iframe, .video-content iframe, .player-embed iframe').first();
        add('Default', frame.attr('data-src') || frame.attr('src'));

        // Server alternatif: value <option> berisi HTML iframe yang di-encode base64
        $('select.mirror option').each((_, el) => {
            const value = $(el).attr('value');
            if (!value) return;
            let decoded = '';
            try {
                decoded = Buffer.from(value, 'base64').toString('utf8');
            } catch {
                return;
            }
            const $d = cheerio.load(decoded);
            const f = $d('iframe').first();
            add(
                $(el).text().trim(),
                f.attr('data-src') || f.attr('src') || $d('video source').attr('src') || $d('video').attr('src')
            );
        });

        // Link download (kalau ada)
        const downloads = [];
        $('.soraddlx .soraurlx').each((_, el) => {
            const links = $(el)
                .find('a')
                .map((__, a) => ({ name: $(a).text().trim(), url: abs($(a).attr('href')) }))
                .get()
                .filter((l) => l.url);
            if (links.length) downloads.push({ quality: $(el).find('strong').first().text().trim(), links });
        });

        // Episode sebelumnya / berikutnya → diubah jadi link endpoint watch milik API ini
        const navHref = (rel) => {
            const href = $(`.naveps a[rel="${rel}"]`).attr('href');
            return href && href !== '#' ? href : null;
        };

        const title = $('.entry-title').first().text().trim();
        const epMatch = target.match(/episode-(\d+)/i) || title.match(/episode\s+(\d+)/i);
        const episodeNumber = epMatch ? parseInt(epMatch[1], 10) : null;

        // prev: pakai link dari halaman; kalau tidak ada tapi episode > 1, pakai episode - 1
        let prevHref = navHref('prev');
        if (!prevHref && episodeNumber && episodeNumber > 1 && /episode-\d+/i.test(target)) {
            prevHref = target.replace(/episode-\d+/i, `episode-${episodeNumber - 1}`);
        }
        const nextHref = navHref('next');

        // Tidak ada episode sebelumnya (mis. episode 1 - 1 = 0) → tampilkan Rekomendasi Series
        let recommendations = null;
        if (!prevHref) {
            let section = null;
            $('.bixbox').each((_, el) => {
                if (section) return;
                const heading = $(el).find('h3, h2').first().text();
                if (/recommend|rekomendasi/i.test(heading)) section = $(el);
            });
            recommendations = (section ? parseCards($, section) : parseCards($)).slice(0, 12);
        }

        const data = {
            title,
            episodeNumber,
            page: target,
            servers,
            downloads,
            prev: prevHref ? toWatch(prevHref) : null,
            next: nextHref ? toWatch(nextHref) : null,
            ...(recommendations ? { recommendationsTitle: 'Rekomendasi Series', recommendations } : {})
        };

        const body = { status: true, data };
        if (!servers.length) {
            body.debug = {
                ...meta($, html),
                hint: 'Server video tidak ditemukan. Player mungkin dimuat lewat JavaScript/AJAX, atau selector (#pembed iframe, select.mirror option) perlu disesuaikan dengan HTML halaman episode.'
            };
        }
        res.status(200).json(body);
    } catch (error) {
        fail(res, error);
    }
};