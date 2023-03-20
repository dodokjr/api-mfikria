const express = require('express');
const router = express.Router();


const port = 'https:'
const ytb = `${port}/www.youtube.com/channel/UCLP0I71nvbJ2D_Y5y-mwbEw?sub_confirmation=1`;
const ig = `${port}//www.instagram.com/fkri__17/`;
const gb = `${port}//github.com/dodokjr`;
const ld = `${port}//www.linkedin.com/in/muhammad-fikri-ardiyansah-952752194/`;
const dc = `${port}//discord.gg/xHQhrDm4dA`;
router.get("/", function (res, req)
{
     req.json({
          github: gb,
          instagram: ig,
          youtube: ytb,
          linkedin: ld,
          discord: dc
     })
})


module.exports = router