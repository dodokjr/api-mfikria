// Controller cuaca realtime berbasis Open-Meteo (gratis, tanpa API key, Node >= 18)
// - cache hasil cuaca 5 menit dan hasil geocoding 24 jam
// - SSE dengan 1 timer per lokasi (bukan per klien), pembaruan 2 menit sekali

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const WEATHER_CACHE_MS = 5 * 60 * 1000;
const GEO_CACHE_MS = 24 * 60 * 60 * 1000;
const STREAM_INTERVAL_MS = 120000; // 2 menit
const HEARTBEAT_MS = 25000;        // jaga koneksi SSE dari proxy
const FETCH_TIMEOUT_MS = 8000;
const CACHE_LIMIT = 1000;

const WMO = {
  0: 'Cerah', 1: 'Cerah berawan', 2: 'Berawan sebagian', 3: 'Berawan',
  45: 'Kabut', 48: 'Kabut beku',
  51: 'Gerimis ringan', 53: 'Gerimis sedang', 55: 'Gerimis lebat',
  56: 'Gerimis beku ringan', 57: 'Gerimis beku lebat',
  61: 'Hujan ringan', 63: 'Hujan sedang', 65: 'Hujan lebat',
  66: 'Hujan beku ringan', 67: 'Hujan beku lebat',
  71: 'Salju ringan', 73: 'Salju sedang', 75: 'Salju lebat', 77: 'Butiran salju',
  80: 'Hujan lokal ringan', 81: 'Hujan lokal sedang', 82: 'Hujan lokal sangat lebat',
  85: 'Hujan salju ringan', 86: 'Hujan salju lebat',
  95: 'Badai petir', 96: 'Badai petir dengan hujan es ringan', 99: 'Badai petir dengan hujan es lebat',
};

// ---------------------------------------------------------------------------
// Utilitas
// ---------------------------------------------------------------------------
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function setCache(map, key, value) {
  if (map.size >= CACHE_LIMIT) map.clear(); // batas aman
  map.set(key, value);
}

async function fetchJson(url) {
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    throw new HttpError(502, 'Gagal menghubungi layanan cuaca');
  }
  if (!res.ok) throw new HttpError(502, `Layanan cuaca membalas HTTP ${res.status}`);
  return res.json();
}

function degToCompass(deg) {
  if (typeof deg !== 'number') return null;
  const dirs = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL']; // utara, timur laut, timur, tenggara, selatan, barat daya, barat, barat laut
  return dirs[Math.round(deg / 45) % 8];
}

// ---------------------------------------------------------------------------
// Lokasi: lat/lon langsung, atau nama kota lewat geocoding
// ---------------------------------------------------------------------------
const geoCache = new Map();

async function geocode(city) {
  const key = city.toLowerCase();
  const hit = geoCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;

  const url = `${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=id&format=json`;
  const data = await fetchJson(url);
  const r = data.results && data.results[0];
  if (!r) throw new HttpError(404, `Lokasi '${city}' tidak ditemukan`);

  const value = {
    latitude: r.latitude,
    longitude: r.longitude,
    name: r.name,
    region: r.admin1 || null,
    country: r.country || null,
    timezone: r.timezone || null,
  };
  setCache(geoCache, key, { value, exp: Date.now() + GEO_CACHE_MS });
  return value;
}

async function resolveLocation(q) {
  const hasCoords = q.lat !== undefined || q.lon !== undefined;

  if (hasCoords) {
    const latitude = Number(q.lat);
    const longitude = Number(q.lon);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new HttpError(400, 'lat harus angka antara -90 dan 90');
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new HttpError(400, 'lon harus angka antara -180 dan 180');
    }
    return { latitude, longitude, name: null, region: null, country: null, timezone: null };
  }

  const city = typeof q.city === 'string' ? q.city.trim() : '';
  if (!city) throw new HttpError(400, 'Isi parameter city, atau lat dan lon');
  if (city.length > 100) throw new HttpError(400, 'city maksimal 100 karakter');
  return geocode(city);
}

const locKey = (loc) => `${loc.latitude.toFixed(2)},${loc.longitude.toFixed(2)}`;

// ---------------------------------------------------------------------------
// Cuaca saat ini (cache + dedup request yang sedang berjalan)
// ---------------------------------------------------------------------------
const weatherCache = new Map();
const inflight = new Map();

async function loadWeather(loc) {
  const params = new URLSearchParams({
    latitude: String(loc.latitude),
    longitude: String(loc.longitude),
    current: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'is_day', 'precipitation', 'weather_code', 'cloud_cover',
      'pressure_msl', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
    ].join(','),
    timezone: 'auto',
    wind_speed_unit: 'kmh',
  });
  const d = await fetchJson(`${FORECAST_URL}?${params}`);
  const c = d.current || {};
  const u = d.current_units || {};

  return {
    location: {
      name: loc.name,
      region: loc.region,
      country: loc.country,
      latitude: d.latitude,
      longitude: d.longitude,
      elevation: d.elevation,
      timezone: d.timezone,
      utcOffsetSeconds: d.utc_offset_seconds,
    },
    time: c.time || null, // waktu lokal lokasi, format ISO tanpa offset
    isDay: c.is_day === 1,
    weatherCode: c.weather_code,
    condition: WMO[c.weather_code] || 'Tidak diketahui',
    temperature: { value: c.temperature_2m, feelsLike: c.apparent_temperature, unit: u.temperature_2m || '°C' },
    humidity: { value: c.relative_humidity_2m, unit: u.relative_humidity_2m || '%' },
    precipitation: { value: c.precipitation, unit: u.precipitation || 'mm' },
    cloudCover: { value: c.cloud_cover, unit: u.cloud_cover || '%' },
    pressure: { value: c.pressure_msl, unit: u.pressure_msl || 'hPa' },
    wind: {
      speed: c.wind_speed_10m,
      gusts: c.wind_gusts_10m,
      direction: c.wind_direction_10m,
      compass: degToCompass(c.wind_direction_10m),
      unit: u.wind_speed_10m || 'km/h',
    },
    source: 'Open-Meteo',
    fetchedAt: new Date().toISOString(),
  };
}

async function getWeather(loc) {
  const key = locKey(loc);

  const hit = weatherCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;

  let pending = inflight.get(key);
  if (!pending) {
    pending = loadWeather(loc)
      .then((value) => {
        setCache(weatherCache, key, { value, exp: Date.now() + WEATHER_CACHE_MS });
        return value;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return pending;
}

function sendError(res, err) {
  const status = err.status || 500;
  const message = err.status ? err.message : 'Terjadi kesalahan di server';
  res.status(status).json({ success: false, message });
}

// ---------------------------------------------------------------------------
// GET /v2/weather?city=Jakarta  atau  ?lat=-6.2&lon=106.8
// ---------------------------------------------------------------------------
async function current(req, res) {
  try {
    const loc = await resolveLocation(req.query);
    const data = await getWeather(loc);
    res.json({ success: true, data });
  } catch (err) {
    sendError(res, err);
  }
}

// ---------------------------------------------------------------------------
// GET /v2/weather/stream?city=Jakarta  (SSE, 2 menit sekali)
// 1 timer per lokasi, payload di-stringify 1x lalu dikirim ke semua klien
// ---------------------------------------------------------------------------
const channels = new Map();

async function stream(req, res) {
  let loc;
  try {
    loc = await resolveLocation(req.query);
  } catch (err) {
    return sendError(res, err); // validasi gagal: balas JSON biasa sebelum SSE dimulai
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const key = locKey(loc);
  let ch = channels.get(key);

  if (!ch) {
    ch = { clients: new Set(), timer: null, heartbeat: null };
    ch.tick = async () => {
      let msg;
      try {
        const data = await getWeather(loc);
        msg = `data: ${JSON.stringify(data)}\n\n`;
      } catch (err) {
        msg = `event: error\ndata: ${JSON.stringify({ success: false, message: err.message })}\n\n`;
      }
      for (const client of ch.clients) {
        if (!client.writableNeedDrain) client.write(msg); // lewati klien yang lambat
      }
    };
    ch.timer = setInterval(ch.tick, STREAM_INTERVAL_MS);
    ch.heartbeat = setInterval(() => {
      for (const client of ch.clients) {
        if (!client.writableNeedDrain) client.write(': ping\n\n');
      }
    }, HEARTBEAT_MS);
    channels.set(key, ch);
  }

  ch.clients.add(res);

  req.on('close', () => {
    ch.clients.delete(res);
    if (ch.clients.size === 0) {
      clearInterval(ch.timer);
      clearInterval(ch.heartbeat);
      if (channels.get(key) === ch) channels.delete(key);
    }
  });

  // Klien baru langsung dapat data awal (cache maksimal 5 menit)
  try {
    const data = await getWeather(loc);
    if (!res.writableEnded && ch.clients.has(res)) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  } catch (err) {
    if (!res.writableEnded && ch.clients.has(res)) {
      res.write(`event: error\ndata: ${JSON.stringify({ success: false, message: err.message })}\n\n`);
    }
  }
}

module.exports = { current, stream };