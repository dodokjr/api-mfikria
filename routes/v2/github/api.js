const express = require('express');
const router = express.Router();
const https = require('https');

let url = "api.github.com"

router.get('/:user', async function (req, res)
{
    const user = req.params.user;
    const options = {
        hostname: url,
        path: '/users/' + user,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
        },
        OAuth: "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"
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

router.get('/:user/repos', async function (req, res)
{
    const user = req.params.user;
    const username = req.params.username;
    const repos = req.params.repos;
    const options = {
        hostname: 'api.github.com',
        path: '/users/' + user + '/repos',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
        },
        OAuth: "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"
    }
    https.get(options, function (apiResponse)
    {
        apiResponse.pipe(res);
        res.set('Content-Type', 'application/json')
    }).on('error', (e) =>
    {
        console.log(ee);
        res.status(500).send('Api salah')
    })
})

router.get('/:user/repos/:reposname', async function (req, res)
{
    const user = req.params.user;
    const username = req.params.username;
    const reposname = req.params.reposname;
    const options = {
        hostname: 'api.github.com',
        path: '/repos/' + `${user}/` + reposname,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
        },
        OAuth: "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"
    }
    https.get(options, function (apiResponse)
    {
        apiResponse.pipe(res);
        res.set('Content-Type', 'application/json')
    }).on('error', (e) =>
    {
        console.log(ee);
        res.status(500).send('Api salah')
    })
})

router.get('/:user/repos/:reposname/events', async function (req, res)
{
    const user = req.params.user;
    const username = req.params.username;
    const reposname = req.params.reposname;
    const options = {
        hostname: 'api.github.com',
        path: '/repos/' + `${user}/` + reposname + '/events',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
        },
        OAuth: "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"
    }
    https.get(options, function (apiResponse)
    {
        apiResponse.pipe(res);
        res.set('Content-Type', 'application/json')
    }).on('error', (e) =>
    {
        console.log(ee);
        res.status(500).send('Api salah')
    })
})


router.get('/:user/repos/:reposname/languages', async function (req, res)
{
    const user = req.params.user;
    const username = req.params.username;
    const reposname = req.params.reposname;
    const options = {
        hostname: 'api.github.com',
        path: '/repos/' + `${user}/` + reposname + '/languages',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
        },
        OAuth: "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"
    }
    https.get(options, function (apiResponse)
    {
        apiResponse.pipe(res);
        res.set('Content-Type', 'application/json')
    }).on('error', (e) =>
    {
        console.log(ee);
        res.status(500).send('Api salah')
    })
})


router.get('/l/limit', async function (req, res)
{
    const user = req.params.user;
    const username = req.params.username;
    const repos = req.params.repos;
    const options = {
        hostname: 'api.github.com',
        path: '/rate_limit',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1521.3 Safari/537.36'
        },
        OAuth: "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"
    }
    https.get(options, function (apiResponse)
    {
        apiResponse.pipe(res);
        res.set('Content-Type', 'application/json')
    }).on('error', (e) =>
    {
        console.log(ee);
        res.status(500).send('Api salah')
    })
})

router.get('/', async function (req, res)
{
    res.status(404).json({
        status: 404,
        message: "No Data :(",
        slug: "/v2/github/:users"
    });
})
module.exports = router;