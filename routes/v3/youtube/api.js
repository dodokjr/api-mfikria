const express = require('express');
const router = express.Router();

router.get("/", function (res, req)
{
    req.json({
        "data": {
            "lagu1": {
                'title': 'domba kuning',
                'imges': 'https://i.ytimg.com/vi/pgYwQc8Pcwo/sddefault.jpg',
                "url": 'https://www.youtube.com/watch?v=pgYwQc8Pcwo',
                'embed': 'https://www.youtube.com/embed/pgYwQc8Pcwo?enablejsapi=1&wmode=opaque&autoplay=1',
                "id": 'pgYwQc8Pcwo'
            },
            "lagu2": {
                'nama': 'Lofi Music with Rain for instant Chill Out, Relaxing Background Tunes',
                'imges': 'https://i.ytimg.com/vi_webp/FXZgMn-kCNA/maxresdefault.webp',
                'url': 'https://www.youtube.com/watch?v=FXZgMn-kCNA',
                'embed': 'https://www.youtube.com/embed/FXZgMn-kCNA?enablejsapi=1&wmode=opaque&autoplay=1',
                "id": 'FXZgMn-kCNA'
            },
        }
    })
})


module.exports = router