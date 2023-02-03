const express = require('express');
const router = express.Router();
const https = require('https');

router.get('/github/:user', async function (req, res)
{
     const user = req.params.user;
     const options = {
          hostname: 'api.github.com',
          path: '/users/' + user,
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
          OAuth: "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"
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

router.get('/github/:user/:reponame', async function (req, res)
{
     const user = req.params.user;
     const reponame = req.params.reponame;
     const options = {
          hostname: 'api.github.com',
          path: '/users/repos' + user,
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
          OAuth: "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"
     }
     https.get(options, function (apiResponse)
     {
          apiResponse.pipe(res);
     }).on('error', (e) =>
     {
          console.log(ee);
          res.status(500).send('Api salah')
     })
})

router.get('/github/:user/:username/repos', async function (req, res)
{
     const user = req.params.user;
     const username = req.params.username;
     const repos = req.params.repos;
     const options = {
          hostname: 'api.github.com',
          path: '/users/' + username + '/repos',
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
          OAuth: "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"
     }
     https.get(options, function (apiResponse)
     {
          apiResponse.pipe(res);
     }).on('error', (e) =>
     {
          console.log(ee);
          res.status(500).send('Api salah')
     })
})

module.exports = router;