const express = require('express');
const router = express.Router();

module.exports = router.get('/', (res, req) =>
{
    req.status(200).send({
        status: req.statusCode,
        key: randomValue + randomNumber,
        offlineUrl: [
            "v3",
        ]
    })
});

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

var randomValue = randomString(5);

var randomNumber = Math.random().toString();
randomNumber = randomNumber.substring(1 || randomNumber.length);

