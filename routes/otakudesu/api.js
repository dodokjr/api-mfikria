const express = require('express');
const router = express.Router();

const url = "https://otakudesu-unofficial-api.rzkfyn.xyz/v1"

router.get('/complate-anime', async function (req, res)
{
    const page = req.query.page;
    const limit = req.query.limit;
    const options = {
        hostname: `${url}`,
        path: `/complete-anime/` + `${page}`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
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
module.exports = router