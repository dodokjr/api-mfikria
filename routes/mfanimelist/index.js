const express = require('express');
const router = express.Router();
const data = require("../../json/mfanimelist/data.json")

router.get("/", function (res, req)
{
    req.send(data)
})


router.get("/:search", async (req, res) =>
{
    const Search = req.params.search
    const datafetch = await fetch(`http://localhost:5000/v2/anime/search?q=${Search}`)
    const data = await datafetch.json()
    const datafetching = await fetch(`https://otakudesu-tau.vercel.app/v1/search/${Search}`)
    const dataotakudesu = await datafetching.json()
    const dataManga = await fetch(`http://localhost:5000/v2/anime/search?q=${Search}`)
    const datamanga = await dataManga.json()
    if (!data, dataotakudesu, dataManga == "data")
    {
        return res.status(500).json({
            status: 500,
            message: "Many Request"
        })
    }
    res.status(200).json({
        status: 200,
        data: {
            anime_jikan: data,
            anime_otakudesu: dataotakudesu,
            manga: datamanga
        },
    })
})

router.get("*", function (res, req)
{
    req.status(404).json({
        status: 404,
        message: "Error Page"
    });
})

module.exports = router