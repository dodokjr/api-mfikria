const express = require('express');
const router = express.Router();

const port = 'https:'
const domain = 'api-mfikria.vercel.app'
const ytb = `${port}//${domain}/m?q=youtube`;
const ig = `${port}//${domain}/m?q=instagram`;
const gb = `${port}//${domain}/m?q=github`;
const ld = `${port}//${domain}/m?q=linkedin`;
const dc = `${port}//${domain}/m?q=discord`;
const st = `${port}//${domain}/m?q=steam`;
const tw = `${port}//${domain}/m?q=twitter`;
router.get("/", function (res, req)
{
     req.json({
          github: gb,
          instagram: ig,
          youtube: ytb,
          linkedin: ld,
          discord: dc,
          steam: st,
          twitter: tw
     })
});
module.exports = router