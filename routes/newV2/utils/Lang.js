const { normalizeLang } = require('../data/Daynames');

// Membaca ?lang=ja dan menaruhnya di req.lang (default: id)
module.exports = (req, res, next) => {
  const lang = normalizeLang(req.query.lang);
  if (!lang) {
    return res.status(400).json({
      success: false,
      message: `Bahasa '${req.query.lang}' tidak didukung. Lihat daftar di /api/languages`,
    });
  }
  req.lang = lang;
  next();
};