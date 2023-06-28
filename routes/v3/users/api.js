const express = require('express');
const router = express.Router();

router.get("/", function (res, req)
{
    req.json({
        "lagu1": {
            'nama': 'domba kuning',
            'url': 'https://www.youtube.com/watch?v=pgYwQc8Pcwo'
        },
        "users2": {
            'nama': 'wan',
            'sekolah': 'negri'
        }
    })
})


module.exports = router