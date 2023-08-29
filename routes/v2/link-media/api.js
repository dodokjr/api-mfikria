const express = require('express');
const router = express.Router();

const dari = 'status'
const port = 'https:'
const domain = 'api-mfikria.vercel.app'
const ytb = `${port}//${domain}/youtube`;
const ig = `${port}//${domain}/instagram`;
const gb = `${port}//${domain}/github`;
const ld = `${port}//${domain}/linkedin`;
const dc = `${port}//${domain}/discord`;
const st = `${port}//${domain}/steam`
router.get("/", function (res, req)
{
     req.json({
          status: random,
          github: gb,
          instagram: ig,
          youtube: ytb,
          linkedin: ld,
          discord: dc,
          steam: st
     })
});

const random = randomString(15);
function randomString(len, charSet)
{
     charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
     var randomString = '';
     for (var i = 0; i < len; i++)
     {
          var randomPoz = Math.floor(Math.random() * charSet.length);
          randomString += charSet.substring(randomPoz, randomPoz + 1);
     }
     return randomString;
}
module.exports = router