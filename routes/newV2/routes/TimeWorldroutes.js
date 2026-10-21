const express = require('express');
const controller = require('../controllers/TimeWorldcontroller');

const router = express.Router();

router.get('/', controller.getWorldTime);               // kota utama
router.get('/regions', controller.listRegions);         // daftar region/benua
router.get('/zones', controller.listZones);             // nama semua zona
router.get('/all', controller.getAllZonesTime);         // waktu semua zona (filter + paginasi)
router.get('/region/:region', controller.getRegionTime);// waktu semua zona 1 region
router.get('/zone', controller.getZoneTime);            // 1 zona (?tz=)
router.get('/stream', controller.streamWorldTime); 

module.exports = router;