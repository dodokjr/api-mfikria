const express = require('express');
const router = express.Router();
const access = require('../controllers/accesstokencontroller');

router.post('/', access.rateLimit, access.createToken);                          // minta token sesi 10 hari (pakai master token)
router.get('/status', access.status);                                            // cek token sesi masih berlaku atau sudah exp
router.post('/master', access.requireAdmin, access.createMasterToken);           // buat master token (admin)
router.post('/revoke', access.requireAdmin, access.revoke);                      // cabut token (admin)

module.exports = router;