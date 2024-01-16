const express = require('express');
const router = express.Router();

const port = 'https:'
const domain = 'api-mfikria.vercel.app'
const ytb = `${port}//${domain}/mediasosial?q=youtube`;
const ig = `${port}//${domain}/mediasosial?q=instagram`;
const gb = `${port}//${domain}/mediasosial?q=github`;
const ld = `${port}//${domain}/mediasosial?q=linkedin`;
const dc = `${port}//${domain}/mediasosial?q=discord`;
const st = `${port}//${domain}/mediasosial?q=steam`
router.get("/", function (res, req)
{
     req.json({
          github: gb,
          instagram: ig,
          youtube: ytb,
          linkedin: ld,
          discord: dc,
          steam: st
     })
});
module.exports = router