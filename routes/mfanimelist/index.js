const express = require('express');
const router = express.Router();
const data = require("../../json/mfanimelist/data.json")

router.get("/", function (res, req)
{
    req.send(data)
})


router.get("*", function (res, req)
{
    req.status(404).json({ status: 404 });
})

module.exports = router