const express = require('express');
const router = express.Router();
const anichin = require('../controllers/anichinController');

router.get('/latest', anichin.getLatest);
router.get('/search', anichin.searchDonghua);
router.get('/detail', anichin.getDetail);
router.get('/watch', anichin.getWatch);
router.get('/popular', anichin.getPopular);

module.exports = router;