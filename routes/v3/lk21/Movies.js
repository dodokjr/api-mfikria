const express = require('express');
const router = express.Router();
const https = require('https');


let urlMovies = "lk21-api.cyclic.app";


router.get('/', async function (req, res)
{
    const options = {
        hostname: `${urlMovies}`,
        path: '/movies',
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

router.get('/:idmovies', async function (req, res)
{
    const idmovies = req.params.idmovies;
    const options = {
        hostname: `${urlMovies}`,
        path: '/movies/' + idmovies,
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

router.get('/popular/movies', async function (req, res)
{
    const options = {
        hostname: `${urlMovies}`,
        path: '/popular/movies',
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

module.exports = router;