const express = require('express');
const router = express.Router();
const https = require('https');


let urlAlat = "lk21-api.cyclic.app";

router.get('/s/:idsearch', async function (req, res)
{
    const idsearch = req.params.idsearch;
    const options = {
        hostname: `${urlAlat}`,
        path: '/search/' + idsearch,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
        },
    }
    https.get(options, function (apiResponse)
    {
        apiResponse.pipe(res);
        res.set('Content-Type', 'application/json');
    }).on('error', (e) =>
    {
        console.log(e);
        res.status(500).send('Api Salah');
    })
});

router.get('/genres', async function (req, res)
{
    const idsearch = req.params.idsearch;
    const options = {
        hostname: `${urlAlat}`,
        path: '/genres',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
        },
    }
    https.get(options, function (apiResponse)
    {
        apiResponse.pipe(res);
        res.set('Content-Type', 'application/json');
    }).on('error', (e) =>
    {
        console.log(e);
        res.status(500).send('Api Salah');
    })
});

router.get('/countries', async function (req, res)
{
    const idsearch = req.params.idsearch;
    const options = {
        hostname: `${urlAlat}`,
        path: '/countries',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
        },
    }
    https.get(options, function (apiResponse)
    {
        apiResponse.pipe(res);
        res.set('Content-Type', 'application/json');
    }).on('error', (e) =>
    {
        console.log(e);
        res.status(500).send('Api Salah');
    })
});

router.get('/years', async function (req, res)
{
    const idsearch = req.params.idsearch;
    const options = {
        hostname: `${urlAlat}`,
        path: '/years',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
        },
    }
    https.get(options, function (apiResponse)
    {
        apiResponse.pipe(res);
        res.set('Content-Type', 'application/json');
    }).on('error', (e) =>
    {
        console.log(e);
        res.status(500).send('Api Salah');
    })
});

module.exports = router;