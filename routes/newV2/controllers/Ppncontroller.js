// Controller kalkulator PPN
//
// Mode:
//  - exclusive : harga belum termasuk PPN       -> PPN = harga x tarif
//  - inclusive : harga sudah termasuk PPN       -> DPP = harga x 100/(100+tarif)
//  - faktor    : DPP nilai lain                 -> DPP = harga x r/(r+1), PPN = (r+1)% x DPP
//                r=11 -> DPP = 11/12 x harga, PPN = 12% x DPP (setara 11% x harga, skema resmi PMK 131/2024)
//                r=12 -> DPP = 12/13 x harga, PPN = 13% x DPP (setara 12% x harga, pola yang sama)
//
// Semua hitungan memakai bilangan bulat (sen, BigInt) supaya tidak ada galat floating point.

const RATES = {
    11: { rate: 11, tarifStatutory: 12, faktorLabel: '11/12', resmi: true },
    12: { rate: 12, tarifStatutory: 13, faktorLabel: '12/13', resmi: false },
  };
  
  const MODES = ['exclusive', 'inclusive', 'faktor'];
  const ROUNDINGS = ['floor', 'round']; // floor = dipotong (default), round = dibulatkan
  const MAX_AMOUNT = 1e13; // 10 triliun, supaya sen tetap di bawah batas integer aman
  
  function fail(res, status, message) {
    return res.status(status).json({ success: false, message });
  }
  
  // Gabungkan query string dari URL asli, req.query, dan body JSON.
  // Membaca URL asli sebagai cadangan kalau middleware lain mengosongkan req.query.
  function readInput(req) {
    let fromUrl = {};
    try {
      const url = new URL(req.originalUrl || req.url || '', 'http://localhost');
      fromUrl = Object.fromEntries(url.searchParams);
    } catch {
      // abaikan URL yang tidak bisa diparse
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    return { ...fromUrl, ...(req.query || {}), ...body };
  }
  
  function parseAmount(v) {
    if (v === undefined || v === null || v === '') return NaN;
    const n = typeof v === 'number' ? v : Number(String(v).trim());
    return Number.isFinite(n) ? n : NaN;
  }
  
  // Pembagian bilangan bulat non-negatif: dipotong atau dibulatkan
  function div(n, d, pembulatan) {
    return pembulatan === 'round' ? (2n * n + d) / (2n * d) : n / d;
  }
  
  const toNum = (cents) => Number(cents) / 100;
  
  function hitung({ harga, rate, mode, pembulatan }) {
    const t = RATES[rate];
    const r = BigInt(t.rate);
    const cents = BigInt(Math.round(harga * 100));
  
    let dpp, ppn, total, rumus;
  
    if (mode === 'exclusive') {
      dpp = cents;
      ppn = div(cents * r, 100n, pembulatan);
      total = cents + ppn;
      rumus = `PPN = harga x ${t.rate}%`;
    } else if (mode === 'inclusive') {
      dpp = div(cents * 100n, 100n + r, pembulatan);
      ppn = cents - dpp;
      total = cents;
      rumus = `DPP = harga x 100/${100 + t.rate}; PPN = harga - DPP`;
    } else {
      // DPP nilai lain: harga x r/(r+1). PPN = (r+1)% x DPP = r% x harga (dihitung dari nilai eksak)
      dpp = div(cents * r, r + 1n, pembulatan);
      ppn = div(cents * r, 100n, pembulatan);
      total = cents + ppn;
      rumus = `DPP = harga x ${t.faktorLabel}; PPN = ${t.tarifStatutory}% x DPP (setara ${t.rate}% x harga)`;
    }
  
    const data = {
      mode,
      pembulatan,
      rate: t.rate,
      rumus,
      harga: toNum(cents),
      dpp: toNum(dpp),
      ppn: toNum(ppn),
      total: toNum(total),
    };
  
    if (mode === 'faktor') {
      data.faktor = t.faktorLabel;
      data.faktorDesimal = Number((t.rate / (t.rate + 1)).toFixed(10));
      data.tarifStatutory = t.tarifStatutory;
      data.skemaResmi = t.resmi;
    }
    return data;
  }
  
  // GET/POST /v2/ppn/calculate
  // Parameter: harga (wajib), rate (11|12, default 11),
  //            mode (exclusive|inclusive|faktor, default exclusive),
  //            pembulatan (floor|round, default floor)
  function calculate(req, res) {
    const src = readInput(req);
  
    const harga = parseAmount(src.harga);
    if (Number.isNaN(harga) || harga < 0 || harga > MAX_AMOUNT) {
      const diterima = Object.keys(src).join(', ') || '(kosong)';
      return fail(res, 400, `harga wajib berupa angka antara 0 dan ${MAX_AMOUNT}. Parameter diterima: ${diterima}`);
    }
  
    const rate = src.rate === undefined || src.rate === '' ? 11 : Number(src.rate);
    if (!RATES[rate]) {
      return fail(res, 400, 'rate hanya boleh 11 atau 12');
    }
  
    const mode = String(src.mode || 'exclusive').toLowerCase();
    if (!MODES.includes(mode)) {
      return fail(res, 400, `mode harus salah satu dari: ${MODES.join(', ')}`);
    }
  
    const pembulatan = String(src.pembulatan || 'floor').toLowerCase();
    if (!ROUNDINGS.includes(pembulatan)) {
      return fail(res, 400, `pembulatan harus salah satu dari: ${ROUNDINGS.join(', ')}`);
    }
  
    return res.json({ success: true, data: hitung({ harga, rate, mode, pembulatan }) });
  }
  
  // GET /v2/ppn/rates
  function rates(req, res) {
    res.json({
      success: true,
      data: Object.values(RATES).map((t) => ({
        rate: t.rate,
        faktor: t.faktorLabel,
        faktorDesimal: Number((t.rate / (t.rate + 1)).toFixed(10)),
        tarifStatutory: t.tarifStatutory,
        skemaResmi: t.resmi,
      })),
      modes: MODES,
      pembulatan: ROUNDINGS,
    });
  }
  
  module.exports = { calculate, rates };