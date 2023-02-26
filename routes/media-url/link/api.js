const express = require('express');
const router = express.Router();

router.get("/", function (res, req)
{
     req.json({
          github: "https://github.com/dodokjr",
          instagram: "https://www.instagram.com/fkri__17/",
          youtube: "https://www.youtube.com/channel/UCLP0I71nvbJ2D_Y5y-mwbEw",
          linkedin: "https://www.linkedin.com/in/muhammad-fikri-ardiyansah-952752194/",
          discord: "https://discord.gg/vSKqthYh"
     })
})


module.exports = router