const express = require('express');
const router = express.Router();
const https = require('https');

router.get('/crypto', async function (req, res)
{
     const options = {
          hostname: 'api.coingecko.com',
          path: '/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false',
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
});

router.get('/crypto/:coins', async function (req, res)
{
     const coins = req.params.coins;
     const options = {
          hostname: 'api.coingecko.com',
          path: '/api/v3/coins/' + coins,
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

router.get('/crypto/ping', async function (req, res)
{
     const options = {
          hostname: 'api.coingecko.com',
          path: '/api/v3/ping/',
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