const express = require('express');
const router = express.Router();
const data = require("../../json/mfanimelist/data.json")

router.get("/", async function (res, req)
{
    const dataone = await fetch("https://otakudesu-tau.vercel.app/v1/ongoing-anime")
    const data = await dataone.json()

    req.status(200).json({
        status: 200,
        "data": {
        "type":"data home",
        "about_us":{
            "messages": "mfanime adalah anime List, Search, dan Streaming subtitle indonesia",
            "about_data": [
                {"name": "Page Watch", "value": 1550},
                {"name":"user", "value": 150},
                {"name":"anime_sub", "value":[
                    "Indonesia, ",
                    "English"
                ]}
            ]
        },
        "anime":{
            "anime_data": data.data
        },
        "team":[
            {
                "id": 1,
                "name": "dodokjr",
                "img": "https://avatars.githubusercontent.com/u/67883705?v=4",
                "position": "owner, Devloper",
                "media_sosial": {
                    "twitter": "https://twitter.com/bintangFikri3",
                    "instagram": "https://www.instagram.com/fkri__17/",
                    "youtube": "https://www.youtube.com/@fkri__17",
                    "github": "https://github.com/dodokjr/",
                    "linkedin": "https://www.linkedin.com/in/muhammad-fikri-ardiyansah/"
                }
            }
        ]
    }
    })
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
