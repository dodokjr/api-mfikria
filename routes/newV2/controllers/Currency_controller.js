const currencyService = require("../Service/Currency_service");

const handleError = (res, err) => {
  console.error(err);
  const missingKey = err.message.includes("API_KEY_KOINGEKO");
  res.status(missingKey ? 500 : 502).json({
    success: false,
    message: missingKey ? "API key belum dikonfigurasi" : "Gagal mengambil data kurs",
    error: err.message,
  });
};

// GET /v2/currency                    -> semua kurs terbaru
// GET /v2/currency?symbols=IDR,EUR    -> hanya mata uang tertentu
exports.getRates = async (req, res) => {
  try {
    const { date, base, rates } = await currencyService.getLatestRates();
    let result = rates;

    if (req.query.symbols) {
      const symbols = req.query.symbols.toUpperCase().split(",").map((s) => s.trim());
      result = Object.fromEntries(symbols.filter((s) => s in rates).map((s) => [s, rates[s]]));
    }

    res.json({
      success: true,
      source: "CurrencyFreaks",
      date,
      base,
      count: Object.keys(result).length,
      rates: result,
    });
  } catch (err) {
    handleError(res, err);
  }
};

// GET /v2/currency/IDR  -> 1 USD = berapa IDR
exports.getRateByCode = async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const { date, base, rates } = await currencyService.getLatestRates();

    if (!(code in rates)) {
      return res.status(404).json({
        success: false,
        message: `Mata uang '${code}' tidak ditemukan`,
      });
    }

    res.json({
      success: true,
      source: "CurrencyFreaks",
      date,
      base,
      data: { code, rate: rates[code] },
    });
  } catch (err) {
    handleError(res, err);
  }
};

// GET /v2/currency/convert?from=USD&to=IDR&amount=100
exports.convert = async (req, res) => {
  try {
    const from = (req.query.from || "USD").toUpperCase();
    const to = (req.query.to || "").toUpperCase();
    const amount = Number(req.query.amount ?? 1);

    if (!to) {
      return res.status(400).json({ success: false, message: "Parameter 'to' wajib diisi" });
    }
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ success: false, message: "Parameter 'amount' harus angka >= 0" });
    }

    const { date, base, rates } = await currencyService.getLatestRates();
    if (!(from in rates) || !(to in rates)) {
      return res.status(404).json({
        success: false,
        message: `Mata uang '${!(from in rates) ? from : to}' tidak ditemukan`,
      });
    }

    // Kurs silang lewat mata uang dasar (base)
    const rate = rates[to] / rates[from];

    res.json({
      success: true,
      source: "CurrencyFreaks",
      date,
      base,
      data: { from, to, amount, rate, result: amount * rate },
    });
  } catch (err) {
    handleError(res, err);
  }
};

// GET /v2/currencies                       -> semua mata uang di dunia (+ kurs terhadap USD)
// GET /v2/currencies?q=rupiah              -> cari berdasarkan kode / nama mata uang / negara
// GET /v2/currencies?limit=20              -> batasi jumlah
exports.getCurrencies = async (req, res) => {
  try {
    let list = await currencyService.getSupportedCurrencies();

    // Gabungkan dengan kurs terbaru; bila gagal (mis. API key kosong), rate = null
    let rates = {};
    let date = null;
    let base = null;
    try {
      ({ date, base, rates } = await currencyService.getLatestRates());
    } catch (e) {
      console.error("Kurs tidak tersedia:", e.message);
    }

    list = list.map((c) => ({ ...c, rate: rates[c.code] ?? null }));

    const { q } = req.query;
    if (q) {
      const term = q.toLowerCase();
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(term) ||
          c.name?.toLowerCase().includes(term) ||
          c.country?.toLowerCase().includes(term)
      );
    }

    list.sort((a, b) => a.code.localeCompare(b.code));

    const limit = parseInt(req.query.limit, 10);
    if (Number.isInteger(limit) && limit > 0) list = list.slice(0, limit);

    res.json({
      success: true,
      source: "CurrencyFreaks",
      date,
      base,
      count: list.length,
      data: list,
    });
  } catch (err) {
    handleError(res, err);
  }
};