const express = require('express');
const router = express.Router();
const otakudesu = require('../controllers/otakudesuController');

router.get('/ongoing', otakudesu.getOngoing);
router.get('/search', otakudesu.searchAnime);
router.get('/detail', otakudesu.getDetail);

module.exports = router;