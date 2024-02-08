const express = require('express');
const router = express.Router();
const https = require('https');

const url = "lk21-api.cyclic.app"

router.get('/movies', async function (req, res)
{
    const options = {
        hostname: `${url}`,
        path: "/movies",
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
        res.status(500).json({
            message: 404
        });
    })
});

router.get('/movies/:slug', async function (req, res)
{
    const slug = req.params.slug
    const options = {
        hostname: `${url}`,
        path: "/movies" + `/${slug}`,
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
        res.status(500).json({
            message: 404
        });
    })
});

// series 
router.get('/series', async function (req, res)
{
    const options = {
        hostname: `${url}`,
        path: "/series",
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
        res.status(500).json({
            message: 404
        });
    })
});

router.get('/series/:slug', async function (req, res)
{
    const slug = req.params.slug
    const options = {
        hostname: `${url}`,
        path: "/series" + `/${slug}`,
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
        res.status(500).json({
            message: 404
        });
    })
});

// populer
router.get('/populer', async function (req, res)
{
    const main = req.query.main
    const options = {
        hostname: `${url}`,
        path: "/popular" + `/${main}`,
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
        res.status(500).json({
            message: "error page"
        });
    })
});

// search

router.get('/search', async function (req, res)
{
    const q = req.query.q
    const options = {
        hostname: `${url}`,
        path: "/search" + `/${q}`,
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
        res.status(500).json({
            message: "error page"
        });
    })
});
module.exports = router