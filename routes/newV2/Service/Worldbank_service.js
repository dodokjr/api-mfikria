const BASE_URL = "https://api.worldbank.org/v2";

// Indeks ekonomi yang digabung ke tiap negara
const INDICATORS = {
  gdp: "NY.GDP.MKTP.CD",              // PDB (US$ current)
  gdpPerCapita: "NY.GDP.PCAP.CD",     // PDB per kapita (US$)
  gdpGrowth: "NY.GDP.MKTP.KD.ZG",     // Pertumbuhan PDB (% tahunan)
  inflation: "FP.CPI.TOTL.ZG",        // Inflasi, CPI (% tahunan)
  unemployment: "SL.UEM.TOTL.ZS",     // Pengangguran (% angkatan kerja)
  population: "SP.POP.TOTL",          // Populasi total
};

// Cache sederhana di memori (1 jam)
const CACHE_TTL = 60 * 60 * 1000;
let cache = { data: null, expires: 0 };

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank error ${res.status} pada ${url}`);
  return res.json(); // format: [meta, data]
}

// Daftar negara: https://api.worldbank.org/v2/country?format=json
async function fetchCountries() {
  const [, countries] = await fetchJson(`${BASE_URL}/country?format=json&per_page=400`);
  // Buang agregat (World, Euro area, dll.), sisakan negara asli
  return countries.filter((c) => c.region?.value !== "Aggregates");
}

// Nilai terbaru yang tersedia (mrnev=1) untuk semua negara
async function fetchIndicator(code) {
  const url = `${BASE_URL}/country/all/indicator/${code}?format=json&per_page=1000&mrnev=1`;
  const [, rows] = await fetchJson(url);
  const map = {};
  for (const r of rows || []) {
    if (r.value !== null) map[r.countryiso3code] = { value: r.value, year: r.date };
  }
  return map;
}

async function getWorldEconomy() {
  if (cache.data && Date.now() < cache.expires) return cache.data;

  const keys = Object.keys(INDICATORS);
  const [countries, ...indicatorMaps] = await Promise.all([
    fetchCountries(),
    ...keys.map((k) => fetchIndicator(INDICATORS[k])),
  ]);

  const data = countries.map((c) => {
    const indicators = {};
    keys.forEach((k, i) => {
      indicators[k] = indicatorMaps[i][c.id] || null;
    });

    return {
      iso2: c.iso2Code,
      iso3: c.id,
      name: c.name,
      region: c.region?.value,
      incomeLevel: c.incomeLevel?.value,
      capital: c.capitalCity,
      longitude: c.longitude,
      latitude: c.latitude,
      indicators,
    };
  });

  cache = { data, expires: Date.now() + CACHE_TTL };
  return data;
}

module.exports = { getWorldEconomy, INDICATORS };