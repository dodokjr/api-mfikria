const countries = require('../data/countries');
const { getTimeInfo, streamSSE } = require('../utils/timeUtil');

const findCountry = (code) => {
  const key = String(code || '').toUpperCase();
  return countries[key] ? { code: key, ...countries[key] } : null;
};

const buildCountry = (country, lang) => {
  const now = new Date();
  return {
    code: country.code,
    country: country.name,
    zones: country.timezones.map((t) => ({ label: t.label, ...getTimeInfo(t.zone, now, lang) })),
  };
};

// Cari zona (WIB/WITA/WIT, ET/PT, dst) di dalam sebuah negara
const findZone = (country, zoneCode) => {
  const key = String(zoneCode || '').toUpperCase();
  return country.timezones.find((t) => t.label.toUpperCase() === key) || null;
};

// Data negara + zona digabung menjadi SATU objek
const buildCountryZone = (country, zone, lang) => ({
  code: country.code,
  country: country.name,
  label: zone.label,
  ...getTimeInfo(zone.zone, undefined, lang),
});

// Validasi negara & zona, kirim error bila tidak ada. Mengembalikan { country, zone } atau null.
const resolveCountryZone = (req, res) => {
  const country = findCountry(req.params.code);
  if (!country) {
    res.status(404).json({ success: false, message: 'Negara tidak ditemukan. Gunakan kode ISO, contoh: ID, US, JP' });
    return null;
  }
  const zone = findZone(country, req.params.zone);
  if (!zone) {
    res.status(404).json({
      success: false,
      message: `Zona '${req.params.zone}' tidak ada di ${country.name}. Pilihan: ${country.timezones.map((t) => t.label).join(', ')}`,
    });
    return null;
  }
  return { country, zone };
};

// GET /api/country
exports.listCountries = (req, res) => {
  const data = Object.entries(countries).map(([code, c]) => ({
    code,
    name: c.name,
    timezones: c.timezones.map((t) => t.zone),
  }));
  res.json({ success: true, total: data.length, data });
};

// GET /api/country/:code
exports.getCountryTime = (req, res) => {
  const country = findCountry(req.params.code);
  if (!country) {
    return res.status(404).json({ success: false, message: 'Negara tidak ditemukan. Gunakan kode ISO, contoh: ID, US, JP' });
  }
  res.json({ success: true, data: buildCountry(country, req.lang) });
};

// GET /api/country/:code/stream
exports.streamCountryTime = (req, res) => {
  const country = findCountry(req.params.code);
  if (!country) {
    return res.status(404).json({ success: false, message: 'Negara tidak ditemukan' });
  }
  streamSSE(req, res, `country:${country.code}:${req.lang}`, () => buildCountry(country, req.lang));
};

// GET /api/country/:code/:zone  (contoh: /api/country/ID/WIB)
exports.getCountryZoneTime = (req, res) => {
  const found = resolveCountryZone(req, res);
  if (!found) return;
  res.json({ success: true, data: buildCountryZone(found.country, found.zone, req.lang) });
};

// GET /api/country/:code/:zone/stream  (contoh: /api/country/ID/WIB/stream)
exports.streamCountryZoneTime = (req, res) => {
  const found = resolveCountryZone(req, res);
  if (!found) return;
  streamSSE(req, res, `country:${found.country.code}:${found.zone.label}:${req.lang}`, () => buildCountryZone(found.country, found.zone, req.lang));
};