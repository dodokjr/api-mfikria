const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = (process.env.OTAKU_BASE_URL || 'https://otakudesu.blog').replace(/\/+$/, ''); // Sesuaikan domain aktif

// Total waktu maksimal untuk satu fetchHtml (semua retry digabung).
// Harus LEBIH KECIL dari maxDuration fungsi Vercel Anda. Default 9 dtk; override lewat FETCH_BUDGET_MS.
const FETCH_BUDGET_MS = parseInt(process.env.FETCH_BUDGET_MS, 10) || 9000;

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

// Hanya cocok dengan halaman challenge asli (judul "Just a moment..." atau variabel cf_chl_opt)
const isChallenge = (html) =>
    typeof html === 'string' &&
    (/<title>\s*(just a moment|attention required)/i.test(html) || /cf_chl_opt|cf-chl-bypass/i.test(html));

const blocked = (status) => {
    const err = new Error(
        `Situs target memblokir request${status ? ` (HTTP ${status})` : ''}, kemungkinan proteksi Cloudflare/anti-bot atau IP server diblokir. Coba pastikan OTAKU_BASE_URL memakai domain yang masih aktif.`
    );
    err.status = 502;
    err.upstreamStatus = status || null;
    return err;
};

// Ambil HTML dengan retry dan batas waktu total (semua percobaan digabung)
async function fetchHtml(url, retries = 2) {
    const deadline = Date.now() + FETCH_BUDGET_MS;
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const remaining = deadline - Date.now();
        if (remaining < 1500) break; // sisa waktu terlalu sedikit untuk percobaan lagi

        try {
            const { data } = await client.get(url, { timeout: Math.min(remaining, 15000) });
            if (isChallenge(data)) throw blocked(200);
            return data;
        } catch (error) {
            lastError = error;
            const status = error.response && error.response.status;
            if (status === 404 || error.status === 502) break; // tidak perlu retry
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
        const err = new Error('Koneksi ke situs sumber timeout. Kemungkinan IP server diblokir atau situs sumber sedang lambat.');
        err.status = 504;
        throw err;
    }
    throw lastError;
}

// Ubah URL relatif ("/anime/slug/") jadi lengkap; URL yang sudah lengkap dibiarkan
const abs = (u) => {
    if (!u) return '';
    try {
        return new URL(String(u).trim(), `${BASE_URL}/`).href;
    } catch {
        return u;
    }
};

// Terima URL relatif maupun lengkap; hanya domain otakudesu yang diizinkan (cegah SSRF)
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

// Ambil teks setelah "Label:" dengan aman
const field = ($, label) => {
    let value = '';
    $('.infozingle p').each((_, el) => {
        const text = $(el).text();
        if (text.toLowerCase().startsWith(label.toLowerCase())) {
            value = text.slice(text.indexOf(':') + 1).trim();
        }
    });
    return value;
};

const fail = (res, error) => {
    const body = { status: false, message: error.message };
    if (error.upstreamStatus) body.upstreamStatus = error.upstreamStatus;
    res.status(error.status || 500).json(body);
};

// GET: Ongoing Anime
exports.getOngoing = async (req, res) => {
    try {
        const html = await fetchHtml(`${BASE_URL}/ongoing-anime/`);
        const $ = cheerio.load(html);
        const ongoingList = [];

        $('.venz ul li').each((_, el) => {
            const $el = $(el);
            ongoingList.push({
                title: $el.find('.jdlflm').text().trim(),
                episode: $el.find('.epz').text().trim(),
                releaseDay: $el.find('.epztipe').text().trim(),
                date: $el.find('.newzp').text().trim(),
                link: abs($el.find('a').first().attr('href')),
                poster: imgSrc($el)
            });
        });

        const body = { status: true, data: ongoingList };
        if (!ongoingList.length) body.debug = meta($, html);
        res.status(200).json(body);
    } catch (error) {
        fail(res, error);
    }
};

// GET: Cari Anime (?q=naruto)
exports.searchAnime = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, message: 'Query "q" wajib diisi' });

    try {
        const html = await fetchHtml(`${BASE_URL}/?s=${encodeURIComponent(q)}&post_type=anime`);
        const $ = cheerio.load(html);
        const searchResults = [];

        $('ul.chivsrc li').each((_, el) => {
            const $el = $(el);
            const sets = $el.find('.set');
            searchResults.push({
                title: $el.find('h2 a').text().trim(),
                genres: sets.eq(0).text().replace('Genres :', '').trim(),
                status: sets.eq(1).text().replace('Status :', '').trim(),
                rating: sets.eq(2).text().replace('Rating :', '').trim(),
                link: abs($el.find('h2 a').attr('href')),
                poster: imgSrc($el)
            });
        });

        const body = { status: true, query: q, data: searchResults };
        if (!searchResults.length) body.debug = meta($, html);
        res.status(200).json(body);
    } catch (error) {
        fail(res, error);
    }
};

// GET: Detail Anime & List Episode (?url=...)
exports.getDetail = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: 'Query "url" wajib diisi' });

    // Terima URL relatif maupun lengkap; hanya domain otakudesu yang diizinkan (cegah SSRF)
    const target = resolveUrl(url);
    if (!target) {
        return res.status(400).json({ status: false, message: 'URL tidak valid atau bukan dari domain otakudesu yang dikonfigurasi' });
    }

    try {
        const html = await fetchHtml(target);
        const $ = cheerio.load(html);

        const episodes = [];
        $('.episodelist ul li').each((_, el) => {
            const $el = $(el);
            episodes.push({
                title: $el.find('a').first().text().trim(),
                date: $el.find('.zeebr').text().trim(),
                link: abs($el.find('a').first().attr('href'))
            });
        });

        const animeDetail = {
            title: field($, 'Judul') || $('.entry-title').first().text().trim(),
            japaneseTitle: field($, 'Japanese'),
            score: field($, 'Skor'),
            status: field($, 'Status'),
            poster: imgSrc($('.fotoanime').first()),
            // Beberapa paragraf digabung dengan baris baru (bukan menempel jadi satu)
            synopsis: $('.sinopc p').map((_, p) => $(p).text().trim()).get().filter(Boolean).join('\n'),
            episodes
        };

        const body = { status: true, data: animeDetail };
        if (!animeDetail.title && !episodes.length) body.debug = meta($, html);
        res.status(200).json(body);
    } catch (error) {
        fail(res, error);
    }
};