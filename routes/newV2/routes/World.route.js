const express = require("express");
const worldController = require("../controllers/World_controller");
const countryController = require("../controllers/Country_controller");
const currencyController = require("../controllers/Currency_controller");

const router = express.Router();

// GET /v2/world                -> semua negara + indikator ekonomi (satu respons)
router.get("/world", worldController.getWorld);
router.get("/world/:code", worldController.getWorldByCountry);

// GET /v2/country/:code        -> satu negara, mis. ID, IDN, USA, JP
router.get("/country/:code", countryController.getCountry);

// Kurs mata uang (CurrencyFreaks)
// GET /v2/currencies                        -> daftar semua mata uang dunia (+ kurs)
// GET /v2/currency                          -> semua kurs terbaru
// GET /v2/currency/convert?from=USD&to=IDR&amount=100
// GET /v2/currency/:code                    -> mis. IDR, EUR, JPY
router.get("/currencies", currencyController.getCurrencies);
router.get("/currency", currencyController.getRates);
router.get("/currency/convert", currencyController.convert); // harus sebelum /:code
router.get("/currency/:code", currencyController.getRateByCode);

module.exports = router;