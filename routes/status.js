const express = require('express');
const router = express.Router();

router.get("/", function (res, req)
{
    req.json({
        status: statusreq,
        key: randomValue,
    })
})

function randomString(len, charSet)
{
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++)
    {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
}

var randomValue = randomString(15);

let statusreq = '200'




module.exports = router