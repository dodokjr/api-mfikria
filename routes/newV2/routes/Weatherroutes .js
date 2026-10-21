const express = require('express');
const { current, stream } = require('../controllers/Weathercontroller');

const router = express.Router();

router.get('/', current);
router.get('/stream', stream);

module.exports = router;