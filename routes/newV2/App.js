require('dotenv').config(); // baca .env (GITHUB_TOKEN, dll). Install: npm i dotenv

const express = require('express');

const worldRoutes = require('./routes/TimeWorldroutes');
const countryRoutes = require('./routes/TimeWorldroutes'); // TODO: cek, sama persis dengan worldRoutes di atas
const animeOtaku = require('./routes/otakudesuRoute');
const donghuaAnichi = require('./routes/anichinRoute');
const worldRoutesBank = require('./routes/World.route');
const githubRoutes = require('./routes/Githubroute');
const langMiddleware = require('./utils/Lang');
const Ppnrouter = require('./routes/Ppnroutes ');         // spasi di akhir nama file dihapus
const WeatherRouter = require('./routes/Weatherroutes '); // spasi di akhir nama file dihapus

const { notFound, errorHandler } = require('./utils/Errorhandler');
const { LANGUAGES, DEFAULT_LANG } = require('./data/Daynames');


const app = express();

app.use(express.json());

app.get('/time', (req, res) => {
    res.json({
        name: 'Timer API',
        note: 'Semua endpoint mendukung ?lang=<kode>, contoh ?lang=ja (default: id). Daftar: GET /time/api/languages',
        endpoints: {
            world: [
                'GET /time/api/world                          (kota utama dunia)',
                'GET /time/api/world/regions                  (daftar region/benua)',
                'GET /time/api/world/zones                    (nama seluruh zona waktu)',
                'GET /time/api/world/all                      (semua zona dunia, paginasi 10/halaman)',
                'GET /time/api/world/all?region=Asia&search=jak&page=1&limit=10',
                'GET /time/api/world/region/Asia              (semua zona dalam 1 region)',
                'GET /time/api/world/zone?tz=Asia/Jakarta     (1 zona)',
                'GET /time/api/world/stream                   (real time SSE, kota utama)',
                'GET /time/api/world/stream?tz=Asia/Tokyo     (real time 1 zona)',
                'GET /time/api/world/stream?region=Europe     (real time 1 region)',
                'GET /time/api/world/stream?all=true          (real time seluruh zona)',
            ],
            country: [
                'GET /time/api/country                   (daftar negara)',
                'GET /time/api/country/ID                (semua zona negara)',
                'GET /time/api/country/ID/stream         (real time semua zona negara)',
                'GET /time/api/country/ID/WIB            (1 zona, data jadi satu objek)',
                'GET /time/api/country/ID/WIB/stream     (real time 1 zona)',
            ],
        },
    });
});

// Daftar bahasa untuk nama hari
app.get('/time/api/languages', (req, res) => {
    const data = Object.entries(LANGUAGES).map(([code, l]) => ({
        code, name: l.name, english: l.english, days: l.days,
    }));
    res.json({ success: true, default: DEFAULT_LANG, total: data.length, data });
});

// Semua endpoint /time/api mendukung ?lang=<kode> (default: id)
app.use('/time/api', langMiddleware);

app.use('/time/api/world', worldRoutes);
app.use('/time/api/country', countryRoutes);

// Anime / donghua
app.use('/anime/otaku', animeOtaku);
app.use('/donghua/anichi', donghuaAnichi);

// Github
app.use('/public/github', githubRoutes);

// Ekonomi
app.use('/we', worldRoutesBank);
app.use('/ppn', Ppnrouter);

// Ramalan cuaca
app.use('/weather', WeatherRouter);

// 404 dan error handler: harus PALING AKHIR, setelah semua route
app.use(notFound);
app.use(errorHandler);

module.exports = app;