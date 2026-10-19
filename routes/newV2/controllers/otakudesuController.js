const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = (process.env.OTAKU_BASE_URL || 'https://otakudesu.blog').replace(/\/+$/, ''); // Sesuaikan domain aktif

// Satu client untuk semua request, dengan header menyerupai browser asli
const client = axios.create({
    timeout: 15000,
    maxRedirects: 5,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
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

// Ambil HTML dengan retry; beri pesan jelas kalau diblokir (403/503 dari Cloudflare)
async function fetchHtml(url, retries = 2) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // Kalau SCRAPER_URL_TEMPLATE diisi, request dilewatkan lewat layanan scraping (IP residensial / bypass Cloudflare)
            // Contoh: https://api.scraperapi.com/?api_key=KUNCI_KAMU&url={url}
            const template = process.env.SCRAPER_URL_TEMPLATE;
            const target = template ? template.replace('{url}', encodeURIComponent(url)) : url;
            const { data } = template
                ? await axios.get(target, { timeout: 60000 })
                : await client.get(target);
            return data;
        } catch (error) {
            lastError = error;
            const status = error.response && error.response.status;
            if (status === 404) break; // tidak perlu retry
            if (attempt < retries) await sleep(800 * (attempt + 1));
        }
    }
    const status = lastError.response && lastError.response.status;
    if (status === 403 || status === 503) {
        const err = new Error(
            `Situs target memblokir request (HTTP ${status}), kemungkinan proteksi Cloudflare/anti-bot atau IP server diblokir.`
        );
        err.status = 502;
        throw err;
    }
    throw lastError;
}

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

const fail = (res, error) =>
    res.status(error.status || 500).json({ status: false, message: error.message });

// GET: Ongoing Anime
exports.getOngoing = async (req, res) => {
    try {
        const data = await fetchHtml(`${BASE_URL}/ongoing-anime/`);
        const $ = cheerio.load(data);
        const ongoingList = [];

        $('.venz ul li').each((_, el) => {
            ongoingList.push({
                title: $(el).find('.jdlflm').text().trim(),
                episode: $(el).find('.epz').text().trim(),
                releaseDay: $(el).find('.epztipe').text().trim(),
                date: $(el).find('.newzp').text().trim(),
                link: $(el).find('a').attr('href'),
                poster: $(el).find('img').attr('src')
            });
        });

        res.status(200).json({ status: true, data: ongoingList });
    } catch (error) {
        fail(res, error);
    }
};

// GET: Cari Anime (?q=naruto)
exports.searchAnime = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: false, message: 'Query "q" wajib diisi' });

    try {
        const data = await fetchHtml(`${BASE_URL}/?s=${encodeURIComponent(q)}&post_type=anime`);
        const $ = cheerio.load(data);
        const searchResults = [];

        $('ul.chivsrc li').each((_, el) => {
            const sets = $(el).find('.set');
            searchResults.push({
                title: $(el).find('h2 a').text().trim(),
                genres: sets.eq(0).text().replace('Genres :', '').trim(),
                status: sets.eq(1).text().replace('Status :', '').trim(),
                rating: sets.eq(2).text().replace('Rating :', '').trim(),
                link: $(el).find('h2 a').attr('href'),
                poster: $(el).find('img').attr('src')
            });
        });

        res.status(200).json({ status: true, query: q, data: searchResults });
    } catch (error) {
        fail(res, error);
    }
};

// GET: Detail Anime & List Episode (?url=...)
exports.getDetail = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: 'Query "url" wajib diisi' });

    // Cegah endpoint dipakai untuk mengambil URL sembarang (SSRF)
    try {
        if (new URL(url).hostname !== new URL(BASE_URL).hostname) {
            return res.status(400).json({ status: false, message: 'URL harus dari domain otakudesu yang dikonfigurasi' });
        }
    } catch {
        return res.status(400).json({ status: false, message: 'URL tidak valid' });
    }

    try {
        const data = await fetchHtml(url);
        const $ = cheerio.load(data);

        const episodes = [];
        $('.episodelist ul li').each((_, el) => {
            episodes.push({
                title: $(el).find('a').text().trim(),
                date: $(el).find('.zeebr').text().trim(),
                link: $(el).find('a').attr('href')
            });
        });

        const animeDetail = {
            title: field($, 'Judul') || $('.entry-title').text().trim(),
            japaneseTitle: field($, 'Japanese'),
            score: field($, 'Skor'),
            status: field($, 'Status'),
            poster: $('.fotoanime img').attr('src'),
            synopsis: $('.sinopc p').text().trim(),
            episodes
        };

        res.status(200).json({ status: true, data: animeDetail });
    } catch (error) {
        fail(res, error);
    }
};