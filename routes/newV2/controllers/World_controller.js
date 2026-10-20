const worldBankService = require("../Service/Worldbank_service");

// Ukuran "kaya/miskin" yang didukung
const WEALTH_METRICS = ["gdpPerCapita", "gdp"];

// Pengaturan paginasi
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 250; // cukup untuk memuat semua negara dalam satu halaman

// GET /v2/world
//   ?region=East Asia
//   &incomeLevel=High
//   &q=indo
//   &sort=richest | poorest      -> urutkan dari paling kaya / paling miskin
//   &by=gdpPerCapita | gdp       -> ukuran kaya (default: gdpPerCapita)
//   &page=1                      -> nomor halaman (default 1)
//   &limit=20                    -> jumlah data per halaman (default 20, maks 250)
//
// Contoh: /v2/world?page=2&limit=10
//         /v2/world?sort=richest&limit=10              -> 10 terkaya
//         /v2/world?sort=poorest&by=gdp&page=2&limit=5
//         /v2/world?region=Europe&sort=richest&page=1&limit=3
exports.getWorld = async (req, res) => {
  try {
    const { region, incomeLevel, q, sort } = req.query;
    const by = req.query.by || "gdpPerCapita";

    // Validasi paginasi
    const page = req.query.page === undefined ? DEFAULT_PAGE : Number(req.query.page);
    const limit = req.query.limit === undefined ? DEFAULT_LIMIT : Number(req.query.limit);

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        success: false,
        message: "Parameter 'page' harus bilangan bulat >= 1",
      });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Parameter 'limit' harus bilangan bulat 1 sampai ${MAX_LIMIT}`,
      });
    }

    let data = await worldBankService.getWorldEconomy();

    if (region) {
      data = data.filter((c) => c.region?.toLowerCase().includes(region.toLowerCase()));
    }
    if (incomeLevel) {
      data = data.filter((c) => c.incomeLevel?.toLowerCase().includes(incomeLevel.toLowerCase()));
    }
    if (q) {
      data = data.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
    }

    // Filter paling kaya / paling miskin
    if (sort) {
      if (!["richest", "poorest"].includes(sort)) {
        return res.status(400).json({
          success: false,
          message: "Nilai 'sort' harus 'richest' atau 'poorest'",
        });
      }
      if (!WEALTH_METRICS.includes(by)) {
        return res.status(400).json({
          success: false,
          message: `Nilai 'by' harus salah satu dari: ${WEALTH_METRICS.join(", ")}`,
        });
      }

      // Buang negara yang datanya kosong, supaya tidak mengacaukan urutan
      data = data.filter((c) => c.indicators?.[by]?.value != null);

      const direction = sort === "richest" ? -1 : 1; // richest = besar -> kecil
      data = [...data]
        .sort((a, b) => direction * (a.indicators[by].value - b.indicators[by].value))
        // Peringkat dihitung sebelum dipotong, jadi halaman 2 lanjut dari peringkat sebelumnya
        .map((c, i) => ({ rank: i + 1, ...c }));
    }

    // Paginasi
    const totalItems = data.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const start = (page - 1) * limit;
    const pageData = data.slice(start, start + limit);

    res.json({
      success: true,
      source: "World Bank API v2",
      ...(sort && { sort, by }),
      count: pageData.length,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
        prevPage: page > 1 ? Math.min(page - 1, totalPages) : null,
        nextPage: page < totalPages ? page + 1 : null,
      },
      data: pageData,
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({
      success: false,
      message: "Gagal mengambil data dari World Bank",
      error: err.message,
    });
  }
};

// GET /v2/world/ID
exports.getWorldByCountry = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const data = await worldBankService.getWorldEconomy();
    const country = data.find((c) => c.iso2 === code || c.iso3 === code);

    if (!country) {
      return res.status(404).json({ success: false, message: `Negara '${code}' tidak ditemukan` });
    }
    res.json({ success: true, source: "World Bank API v2", data: country });
  } catch (err) {
    console.error(err);
    res.status(502).json({ success: false, message: "Gagal mengambil data", error: err.message });
  }
};