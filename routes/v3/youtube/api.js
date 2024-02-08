const express = require('express');
const router = express.Router();

router.get("/", function (res, req)
{
    req.json({
        "data": [
            {
                "laguSatu": {
                    'title': 'domba kuning',
                    'imges': 'https://i.ytimg.com/vi/pgYwQc8Pcwo/sddefault.jpg',
                    "url": 'https://www.youtube.com/watch?v=pgYwQc8Pcwo',
                    'embed': 'https://www.youtube.com/embed/pgYwQc8Pcwo?enablejsapi=1&wmode=opaque&autoplay=1',
                    "id": 'pgYwQc8Pcwo'
                }
            },
            {
                "laguDua": {
                    'nama': 'Lofi Music with Rain for instant Chill Out, Relaxing Background Tunes',
                    'imges': 'https://i.ytimg.com/vi_webp/FXZgMn-kCNA/maxresdefault.webp',
                    'url': 'https://www.youtube.com/watch?v=FXZgMn-kCNA',
                    'embed': 'https://www.youtube.com/embed/FXZgMn-kCNA?si=FXZgMn-kCNA&enablejsapi=1&wmode=opaque&autoplay=1',
                    "id": 'FXZgMn-kCNA'
                }
            },

            {
                "laguTiga": {
                    'nama': 'Perahu Kertas | TRUST (Trinity Youth Symphony Orchestra) feat. Pepita Salim',
                    'imges': 'https://i.ytimg.com/vi_webp/WJ9Bw5R7FI0/maxresdefault.webp',
                    'url': 'https://www.youtube.com/watch?v=WJ9Bw5R7FI0',
                    'embed': 'https://www.youtube.com/embed/WJ9Bw5R7FI0?si=p5x4BgcgcDRqiI7o&enablejsapi=1&wmode=opaque&autoplay=1',
                    "id": 'WJ9Bw5R7FI0'
                },
            }
        ]
    })
})


module.exports = router