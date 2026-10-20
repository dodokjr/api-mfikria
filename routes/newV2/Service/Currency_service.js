const BASE_URL = "https://api.currencyfreaks.com/v2.0";

// Kurs terbaru: cache 15 menit. Daftar mata uang jarang berubah: cache 24 jam.
// (paket gratis CurrencyFreaks hanya 1.000 panggilan/bulan)
const RATES_TTL = 15 * 60 * 1000;
const SUPPORTED_TTL = 24 * 60 * 60 * 1000;

let ratesCache = { data: null, expires: 0 };
let supportedCache = { data: null, expires: 0 };

async function getLatestRates() {
  if (ratesCache.data && Date.now() < ratesCache.expires) return ratesCache.data;

  const apiKey = process.env.API_KEY_KOINGEKO;
  if (!apiKey) {
    throw new Error("API_KEY_KOINGEKO belum diisi di file .env");
  }

  const res = await fetch(`${BASE_URL}/rates/latest?apikey=${encodeURIComponent(apiKey)}`);
  if (!res.ok) {
    throw new Error(`CurrencyFreaks error ${res.status}`);
  }
  const json = await res.json();

  // CurrencyFreaks mengirim nilai rate sebagai string -> ubah ke number
  const rates = {};
  for (const [code, value] of Object.entries(json.rates || {})) {
    const n = Number(value);
    if (Number.isFinite(n)) rates[code] = n;
  }

  const data = { date: json.date, base: json.base, rates };
  ratesCache = { data, expires: Date.now() + RATES_TTL };
  return data;
}

// Daftar semua mata uang yang didukung (endpoint ini tidak butuh API key)
async function getSupportedCurrencies() {
  if (supportedCache.data && Date.now() < supportedCache.expires) return supportedCache.data;

  const res = await fetch(`${BASE_URL}/supported-currencies`);
  if (!res.ok) {
    throw new Error(`CurrencyFreaks error ${res.status}`);
  }
  const json = await res.json();
  const map = json.supportedCurrenciesMap || {};

  const data = Object.entries(map).map(([code, c]) => ({
    code: c.currencyCode || code,
    name: c.currencyName || null,
    countryCode: c.countryCode || null,
    country: c.countryName || null,
    status: c.status || null,
    icon: c.icon || null,
  }));

  supportedCache = { data, expires: Date.now() + SUPPORTED_TTL };
  return data;
}

module.exports = { getLatestRates, getSupportedCurrencies };