const express = require('express');
const { calculate, rates } = require('../controllers/Ppncontroller');

const router = express.Router();

router.get('/rates', rates);
router.get('/calculate', calculate);
router.post('/calculate', calculate); // butuh express.json() di app

module.exports = router;