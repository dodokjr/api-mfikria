const { isValidTimezone, canonicalTimezone, getTimeInfo, streamSSE } = require('../utils/timeUtil');

// ---------------------------------------------------------------------------
// Daftar SEMUA zona waktu dunia (IANA) dari runtime Node (>= 18)
// ---------------------------------------------------------------------------
const ALL_ZONES = (() => {
  let zones = [];
  try {
    zones = Intl.supportedValuesOf('timeZone');
  } catch {
    zones = [];
  }
  if (!zones.includes('UTC')) zones.push('UTC');
  return zones.sort();
})();

const regionOf = (zone) => (zone.includes('/') ? zone.split('/')[0] : zone);

const REGIONS = [...new Set(ALL_ZONES.map(regionOf))].sort();

const findRegion = (name) =>
  REGIONS.find((r) => r.toLowerCase() === String(name || '').toLowerCase());

// Kota-kota utama (tampilan default)
const MAJOR_CITIES = [
  { city: 'Jakarta',     zone: 'Asia/Jakarta' },
  { city: 'Tokyo',       zone: 'Asia/Tokyo' },
  { city: 'Dubai',       zone: 'Asia/Dubai' },
  { city: 'Mumbai',      zone: 'Asia/Kolkata' },
  { city: 'London',      zone: 'Europe/London' },
  { city: 'Paris',       zone: 'Europe/Paris' },
  { city: 'Cairo',       zone: 'Africa/Cairo' },
  { city: 'Sydney',      zone: 'Australia/Sydney' },
  { city: 'New York',    zone: 'America/New_York' },
  { city: 'Los Angeles', zone: 'America/Los_Angeles' },
  { city: 'Sao Paulo',   zone: 'America/Sao_Paulo' },
];

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------
const buildInfoList = (zones, lang) => {
  const now = new Date();
  return zones.map((zone) => ({
    region: regionOf(zone),
    city: zone.includes('/') ? zone.slice(zone.indexOf('/') + 1).replace(/_/g, ' ') : zone,
    ...getTimeInfo(zone, now, lang),
  }));
};

const filterZones = ({ region, search }) => {
  let zones = ALL_ZONES;
  if (region) zones = zones.filter((z) => regionOf(z) === region);
  if (search) {
    const q = String(search).toLowerCase().replace(/\s+/g, '_');
    zones = zones.filter((z) => z.toLowerCase().includes(q));
  }
  return zones;
};

const buildMajor = (lang) => {
  const now = new Date();
  return MAJOR_CITIES.map((c) => ({ city: c.city, ...getTimeInfo(c.zone, now, lang) }));
};

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

// GET /api/world  -> kota-kota utama dunia
exports.getWorldTime = (req, res) => {
  res.json({ success: true, utc: new Date().toISOString(), data: buildMajor(req.lang) });
};

// GET /api/world/regions -> daftar benua/region beserta jumlah zona
exports.listRegions = (req, res) => {
  const data = REGIONS.map((r) => ({
    region: r,
    totalZones: ALL_ZONES.filter((z) => regionOf(z) === r).length,
  }));
  res.json({ success: true, total: data.length, data });
};

// GET /api/world/zones -> hanya nama zona (ringan), dikelompokkan per region
exports.listZones = (req, res) => {
  const grouped = {};
  for (const z of ALL_ZONES) (grouped[regionOf(z)] ||= []).push(z);
  res.json({ success: true, total: ALL_ZONES.length, data: grouped });
};

// GET /api/world/all?region=Asia&search=jakarta&page=1&limit=10
// -> waktu SEMUA zona dunia, paginasi default 10 data/halaman (limit maks 100)
exports.getAllZonesTime = (req, res) => {
  const { region, search } = req.query;

  let regionName;
  if (region) {
    regionName = findRegion(region);
    if (!regionName) {
      return res.status(400).json({
        success: false,
        message: `Region tidak valid. Pilihan: ${REGIONS.join(', ')}`,
      });
    }
  }

  const zones = filterZones({ region: regionName, search });
  const total = zones.length;

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100); // default 10 per halaman
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const paged = zones.slice((page - 1) * limit, page * limit);

  res.json({
    success: true,
    utc: new Date().toISOString(),
    total,
    page,
    limit,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    hasNext: page * limit < total,
    hasPrev: page > 1,
    data: buildInfoList(paged, req.lang),
  });
};

// GET /api/world/region/:region -> waktu semua zona dalam satu region
exports.getRegionTime = (req, res) => {
  const regionName = findRegion(req.params.region);
  if (!regionName) {
    return res.status(404).json({
      success: false,
      message: `Region tidak ditemukan. Pilihan: ${REGIONS.join(', ')}`,
    });
  }
  const zones = filterZones({ region: regionName });
  res.json({
    success: true,
    region: regionName,
    total: zones.length,
    data: buildInfoList(zones, req.lang),
  });
};

// GET /api/world/zone?tz=Asia/Jakarta -> satu zona
exports.getZoneTime = (req, res) => {
  const { tz } = req.query;
  if (!isValidTimezone(tz)) {
    return res.status(400).json({
      success: false,
      message: 'Timezone tidak valid. Contoh: /api/world/zone?tz=Asia/Jakarta (lihat daftar di /api/world/zones)',
    });
  }
  res.json({ success: true, data: getTimeInfo(tz, undefined, req.lang) });
};

// GET /api/world/stream               -> real time kota utama
// GET /api/world/stream?tz=Asia/Tokyo -> real time satu zona
// GET /api/world/stream?region=Asia   -> real time satu region
// GET /api/world/stream?all=true      -> real time SELURUH zona dunia
exports.streamWorldTime = (req, res) => {
  const { tz, region, all } = req.query;

  if (tz) {
    if (!isValidTimezone(tz)) {
      return res.status(400).json({ success: false, message: 'Timezone tidak valid' });
    }
    return streamSSE(req, res, `world:tz:${canonicalTimezone(tz)}:${req.lang}`, () => getTimeInfo(tz, undefined, req.lang));
  }

  if (region) {
    const regionName = findRegion(region);
    if (!regionName) {
      return res.status(400).json({
        success: false,
        message: `Region tidak valid. Pilihan: ${REGIONS.join(', ')}`,
      });
    }
    const zones = filterZones({ region: regionName });
    return streamSSE(req, res, `world:region:${regionName}:${req.lang}`, () => ({
      utc: new Date().toISOString(),
      region: regionName,
      total: zones.length,
      data: buildInfoList(zones, req.lang),
    }));
  }

  if (all === 'true') {
    return streamSSE(req, res, `world:all:${req.lang}`, () => ({
      utc: new Date().toISOString(),
      total: ALL_ZONES.length,
      data: buildInfoList(ALL_ZONES, req.lang),
    }));
  }

  streamSSE(req, res, `world:major:${req.lang}`, () => ({ utc: new Date().toISOString(), data: buildMajor(req.lang) }));
};