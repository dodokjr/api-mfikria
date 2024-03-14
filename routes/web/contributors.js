const express = require('express');
const router = express.Router();

router.get("/", function (res, req)
{
    req.json({
        data: [
            {
                id: "1",
                name: "dodokjr",
                img_src: "https://avatars.githubusercontent.com/u/67883705?v=4"
            },
        ]
    })
})




module.exports = router