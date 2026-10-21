const express = require('express');
const controller = require('../controllers/TimeCountrycontroller');

const router = express.Router();

router.get('/', controller.listCountries);                              // daftar negara
router.get('/:code/stream', controller.streamCountryTime);              // real time semua zona negara
router.get('/:code/:zone/stream', controller.streamCountryZoneTime);    // real time 1 zona (ID/WIB/stream)
router.get('/:code/:zone', controller.getCountryZoneTime);              // 1 zona (ID/WIB)
router.get('/:code', controller.getCountryTime); 
                       // semua zona negara
module.exports = router;