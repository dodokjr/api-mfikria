const express = require('express');
const router = express.Router();

router.get("/", function (res, req)
{
    req.json({
        one: '100',
        two: '50',
        three: '90'
    })
})


module.exports = router