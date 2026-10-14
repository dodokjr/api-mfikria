// Simpan di: routes/mfikria/routes/feedbackRoutes.js
const express = require('express');
const feedback = require('../controllers/Feedbackcontroller');

const router = express.Router();

// GET  /mfikria/v1/feedback?page=1&limit=10&tipe=saran   -> daftar saran & kritik (publik, di-cache CDN 30 detik)
router.get('/feedback', feedback.listFeedback);

// POST /mfikria/v1/feedback?query=<token>&tgl=<tgl>      -> kirim saran/kritik (butuh guest token)
router.post('/feedback', express.json({ limit: '10kb' }), feedback.createFeedback);

module.exports = router;