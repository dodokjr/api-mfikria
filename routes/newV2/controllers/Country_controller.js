const worldBankService = require("../Service/Worldbank_service");

// GET /v2/country/ID   (Indonesia)
// GET /v2/country/USA  (Amerika Serikat)
// Kode bisa ISO2 (ID, US, JP) atau ISO3 (IDN, USA, JPN), tidak case-sensitive.
exports.getCountry = async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const data = await worldBankService.getWorldEconomy();
    const country = data.find((c) => c.iso2 === code || c.iso3 === code);

    if (!country) {
      return res.status(404).json({
        success: false,
        message: `Negara dengan kode '${code}' tidak ditemukan`,
        hint: "Gunakan kode ISO2 (ID, US) atau ISO3 (IDN, USA). Lihat daftar di /v2/world",
      });
    }

    res.json({ success: true, source: "World Bank API v2", data: country });
  } catch (err) {
    console.error(err);
    res.status(502).json({
      success: false,
      message: "Gagal mengambil data dari World Bank",
      error: err.message,
    });
  }
};