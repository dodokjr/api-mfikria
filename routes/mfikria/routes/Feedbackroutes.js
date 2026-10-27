// Simpan di: routes/mfikria/routes/feedbackRoutes.js
const express = require('express');
const feedback = require('../controllers/Feedbackcontroller');

const router = express.Router();

// GET  /mfikria/v1/feedback?page=1&limit=5&tipe=saran   -> daftar saran & kritik + balasan (publik, di-cache CDN 30 detik)
// Default 5 komentar utama per halaman.
router.get('/feedback', feedback.listFeedback);

// POST /mfikria/v1/feedback?query=<token>&tgl=<tgl>      -> kirim saran/kritik (butuh guest token)
router.post('/feedback', express.json({ limit: '10kb' }), feedback.createFeedback);

// POST /mfikria/v1/feedback/:id/reply                    -> balas komentar (HANYA admin, profile.role = "Admin")
// Body JSON: { "pesan": "...", "username": "admin", "encryptedQueryToken": "<sessionTokens.encryptedQueryToken>" }
// Server memverifikasi token ke sheet user dan membaca role dari sheet (tidak percaya role dari client).
router.post('/feedback/:id/reply', express.json({ limit: '10kb' }), feedback.replyFeedback);

module.exports = router;