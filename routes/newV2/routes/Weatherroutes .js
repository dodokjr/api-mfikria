const express = require('express');
const { current, forecast, stream } = require('../controllers/Weathercontroller');

const router = express.Router();

// Dokumentasi: tampil di GET / kalau tidak ada city / lat / lon.
// Kalau parameter lokasi ada, lanjut ke controller current.
function docs(req, res, next) {
  const { city, lat, lon } = req.query;
  if (city !== undefined || lat !== undefined || lon !== undefined) return next();

  const base = `${req.protocol}://${req.get('host')}${req.baseUrl}`;

  res.json({
    success: true,
    name: 'API Cuaca (gratis, tanpa API key)',
    source: 'Open-Meteo',
    location_params: {
      note: 'Semua endpoint butuh salah satu: city ATAU lat + lon',
      city: 'Nama kota, maksimal 100 karakter. Contoh: Jakarta',
      lat: 'Lintang, angka -90 sampai 90',
      lon: 'Bujur, angka -180 sampai 180',
    },
    endpoints: {
      current: {
        method: 'GET',
        path: '/',
        description: 'Cuaca saat ini (cache 5 menit)',
        example: `${base}?city=Jakarta`,
      },
      forecast: {
        method: 'GET',
        path: '/forecast',
        description: 'Prediksi cuaca harian dan opsional per jam (cache 15 menit)',
        params: {
          days: '1-16, default 7. Jumlah hari prediksi',
          hours: '0-168, default 0. Isi untuk menambah prediksi per jam mulai dari jam sekarang',
        },
        examples: [
          `${base}/forecast?city=Jakarta&days=7`,
          `${base}/forecast?lat=-6.2&lon=106.8&days=3&hours=24`,
        ],
      },
      stream: {
        method: 'GET',
        path: '/stream',
        description: 'Cuaca realtime lewat Server-Sent Events, diperbarui tiap 2 menit',
        example: `${base}/stream?city=Jakarta`,
        usage: "const es = new EventSource('<url>'); es.onmessage = (e) => console.log(JSON.parse(e.data));",
      },
    },
    response_format: {
      success: '{ "success": true, "data": { ... } }',
      error: '{ "success": false, "message": "..." }',
    },
    errors: {
      400: 'Parameter tidak valid atau tidak ada',
      404: 'Lokasi tidak ditemukan',
      502: 'Layanan cuaca (Open-Meteo) tidak dapat dihubungi',
      500: 'Kesalahan di server',
    },
  });
}

router.get('/', docs, current);
router.get('/forecast', forecast);
router.get('/stream', stream);

module.exports = router;