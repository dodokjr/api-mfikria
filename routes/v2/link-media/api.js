const express = require('express');
const router = express.Router();

const dari = 'status'
const port = 'https:'
const domain = 'api-mfikria.vercel.app'
const ytb = `${port}//${domain}/youtube?${dari}`;
const ig = `${port}//${domain}/instagram?${dari}`;
const gb = `${port}//${domain}/github?${dari}`;
const ld = `${port}//${domain}/linkedin?${dari}`;
const dc = `${port}//${domain}/discord?${dari}`;
const st = `${port}//${domain}/steam?${dari}`
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