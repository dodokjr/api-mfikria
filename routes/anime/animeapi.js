const express = require('express');
const router = express.Router();
const https = require('https');

let url = 'api.jikan.moe'
router.get('/anime/:quer', async function (req, res)
{
     const quer = req.params.quer;
     const options = {
          hostname: `${url}`,
          path: '/v4/anime?q=' + quer,
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
     }
     https.get(options, function (apiResponse)
     {
          apiResponse.pipe(res);
     }).on('error', (e) =>
     {
          console.log(e);
          res.status(500).send('Api Salah');
     })
})

module.exports = router;