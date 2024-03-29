const express = require('express');
const router = express.Router();
const https = require('https');

let url = 'api.jikan.moe'

router.get('/', async function (req, res)
{
     const page = req.query.page;
     const limit = req.query.limit;
     const options = {
          hostname: `${url}`,
          path: '/v4/anime?' + `page=${page}&limit=${limit}`,
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
     }
     https.get(options, function (apiResponse)
     {
          apiResponse.pipe(res);
          res.set('Content-Type', 'application/json')
     }).on('error', (e) =>
     {
          console.log(e);
          res.status(500).send('Api Salah');
     })
});

router.get('/full/:id', async function (req, res)
{
     const id = req.params.id;
     const options = {
          hostname: `${url}`,
          path: '/v4/anime/' + id + '/full',
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
     }
     https.get(options, function (apiResponse)
     {
          apiResponse.pipe(res);
          res.set('Content-Type', 'application/json')
     }).on('error', (e) =>
     {
          console.log(e);
          res.status(500).send('Api Salah');
     })
});

router.get('/search', async function (req, res)
{
     const q = req.query.q;
     const options = {
          hostname: `${url}`,
          path: '/v4/anime?q=' + q + '&limit=5&sfw',
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
     }
     https.get(options, function (apiResponse)
     {
          apiResponse.pipe(res);
          res.set('Content-Type', 'application/json')
     }).on('error', (e) =>
     {
          console.log(e);
          res.status(500).send('Api Salah');
     })
})


router.get('/search/manga', async function (req, res)
{
     const q = req.query.q;
     const options = {
          hostname: `${url}`,
          path: '/v4/manga?q=' + q + '&limit=5&sfw',
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
     }
     https.get(options, function (apiResponse)
     {
          apiResponse.pipe(res);
          res.set('Content-Type', 'application/json')
     }).on('error', (e) =>
     {
          console.log(e);
          res.status(500).send('Api Salah');
     })
})


router.get('/populer', async function (req, res)
{
     const page = req.query.page
     const options = {
          hostname: `${url}`,
          path: '/v4/top/anime?page=' + page,
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
     }
     https.get(options, function (apiResponse)
     {
          apiResponse.pipe(res);
          res.set('Content-Type', 'application/json')
     }).on('error', (e) =>
     {
          console.log(e);
          res.status(500).send('Api Salah');
     })
})



router.get('/character/:query', async function (req, res)
{
     const query = req.params.query;
     const options = {
          hostname: `${url}`,
          path: '/v4/characters/' + query + '/full',
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
     }
     https.get(options, function (apiResponse)
     {
          apiResponse.pipe(res);
          res.set('Content-Type', 'application/json')
     }).on('error', (e) =>
     {
          console.log(e);
          res.status(500).send('Api Salah');
     })
})

router.get('/character/people/:query', async function (req, res)
{
     const query = req.params.query;
     const options = {
          hostname: `${url}`,
          path: '/v4/people/' + query + '/full',
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
     }
     https.get(options, function (apiResponse)
     {
          apiResponse.pipe(res);
          res.set('Content-Type', 'application/json')
     }).on('error', (e) =>
     {
          console.log(e);
          res.status(500).send('Api Salah');
     })
})

router.get('/seasons', async function (req, res)
{
     const options = {
          hostname: `${url}`,
          path: '/v4/seasons',
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
     }
     https.get(options, function (apiResponse)
     {
          apiResponse.pipe(res);
          res.set('Content-Type', 'application/json')
     }).on('error', (e) =>
     {
          console.log(e);
          res.status(500).send('Api Salah');
     })
})
router.get('/seasons/upcoming', async function (req, res)
{
     const page = req.query.page
     const options = {
          hostname: `${url}`,
          path: '/v4/seasons/upcoming?' + `page=${page}`,
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
     }
     https.get(options, function (apiResponse)
     {
          apiResponse.pipe(res);
          res.set('Content-Type', 'application/json')
     }).on('error', (e) =>
     {
          console.log(e);
          res.status(500).send('Api Salah');
     })
})
router.get('/seasons', async function (req, res)
{
     const options = {
          hostname: `${url}`,
          path: '/v4/seasons',
          headers: {
               'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
          },
     }
     https.get(options, function (apiResponse)
     {
          apiResponse.pipe(res);
          res.set('Content-Type', 'application/json')
     }).on('error', (e) =>
     {
          console.log(e);
          res.status(500).send('Api Salah');
     })
})
module.exports = router;