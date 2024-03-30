const express = require('express');
const router = express.Router();
const data = require("../../json/mfanimelist/data.json")

router.get("/", function (res, req)
{
    req.status(200).send(data)
})

// api-mfikria.vercel.app
router.get("/s", async (req, res) =>
{
    const Search = req.query.search
    const datafetch = await fetch(`http://api-mfikria.vercel.app/v2/anime/search?q=${Search}`)
    const data = await datafetch.json()
    const datafetching = await fetch(`https://otakudesu-tau.vercel.app/v1/search/${Search}`)
    const dataotakudesu = await datafetching.json()
    const dataManga = await fetch(`http://api-mfikria.vercel.app/v2/anime/search?q=${Search}`)
    const datamanga = await dataManga.json()

    res.status(200).json({
        status: res.statusCode,
        search_params: Search,
        data_time: Date.now(),
        data: {
            anime_jikan: data,
            anime_otakudesu: dataotakudesu,
            manga: datamanga
        },
    })
})

router.get("/users/:name", (req, res) =>
{
    const userName = req.params.name
    res.status(200).json({
        status: res.statusCode,
        data: {
            userName: userName,
            profile_Img: "https://media.istockphoto.com/id/1337144146/vector/default-avatar-profile-icon-vector.jpg?s=612x612&w=0&k=20&c=BIbFwuv7FxTWvh5S3vB6bkT0Qv8Vn8N5Ffseq84ClGI=",
            timeLogin: Date.now(),
            anime_list: {
                data_anime: [
                    {
                        mal_id: 20,
                        title: "naruto",
                        episode: 1000,
                        img_anime: "https://cdn.myanimelist.net/images/anime/13/17405.jpg",
                        status: "Complete"
                    }
                ]
            },
        }
    })
})

router.get("*", function (res, req)
{
    req.status(404).json({
        status: req.statusCode,
        message: "Error Page"
    });
})

module.exports = router