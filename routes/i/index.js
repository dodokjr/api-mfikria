const express = require('express');
const router = express.Router();
router.get("/", function (res, req)
{
    req.json({
        owner: {
            "name": "fkri__17",
            "name_prop": "MFikriA",
            "bio": "while(! ( succes = try() ) );",
            "url_Image": "https://scontent.cdninstagram.com/v/t51.2885-19/422836613_1616421772500362_5028064086655393004_n.jpg?stp=dst-jpg_s150x150&_nc_ht=scontent.cdninstagram.com&_nc_cat=102&_nc_ohc=q2cXu9Ij51YAX9legRt&edm=APs17CUBAAAA&ccb=7-5&oh=00_AfA2huy5WJngKrEqJ6828h35qegn2C8FMBGrhnnAW86xvQ&oe=65CA3F00&_nc_sid=10d13b",
            "followers": 54,
            "following": 37,
            "post": 4,
            "link_sosial": [
                {
                    "id": 1,
                    "link_url": "https://mfikria.vercel.app/"
                }
            ],
        },
        "data": [
            {
                "id": 0,
                "url_Image": "https://scontent-cgk1-2.cdninstagram.com/v/t51.2885-15/420055275_765793132239388_3447623480693026647_n.webp?stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xMDgweDEwODAuc2RyIn0&_nc_ht=scontent-cgk1-2.cdninstagram.com&_nc_cat=104&_nc_ohc=vMpPkvjVJUYAX-y1kjD&edm=ACWDqb8BAAAA&ccb=7-5&ig_cache_key=MzI4NTEwNDk4NDIwNzAyOTgyMw%3D%3D.2-ccb7-5&oh=00_AfAAJ3BjNp38saFEDddRW6SdmTRjz9rSY-BBd9JlutpSXA&oe=65B148F5&_nc_sid=ee9879",
                "url_Profile": "https://www.instagram.com/p/C2XCZPxhnY_RCVIxDN2kJPCzhmjXrDZ1z4TJL40/",
            },
            {
                "id": 1,
                "url_Image": "https://scontent-cgk1-2.cdninstagram.com/v/t51.2885-15/412405084_712858460795222_1747121006274677234_n.webp?stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi45NTB4OTUwLnNkciJ9&_nc_ht=scontent-cgk1-2.cdninstagram.com&_nc_cat=102&_nc_ohc=IChZ8OlvJocAX8ma5wc&edm=ACWDqb8BAAAA&ccb=7-5&ig_cache_key=MzI2NDYwNzIwMTAzNzY0MDgyMg%3D%3D.2-ccb7-5&oh=00_AfD02m-nE_l9pMcVcBbPsY6IMlx1k4wa1Zs0pyb0QtjyCg&oe=65AF6760&_nc_sid=ee9879",
                "url_Profile": "https://www.instagram.com/p/C1ONvPlB-R2LiNZQipCNo7z_7jvC3czfLeAWG40/",
            },
            {
                "id": 2,
                "url_Image": "https://scontent-cgk1-2.cdninstagram.com/v/t51.2885-15/401678485_121093094430610_6982705372900123022_n.webp?stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xMDgweDEwODAuc2RyIn0&_nc_ht=scontent-cgk1-2.cdninstagram.com&_nc_cat=110&_nc_ohc=w4-sYUSityQAX9iTbtV&edm=ACWDqb8BAAAA&ccb=7-5&ig_cache_key=MzIzNTA5MTkxOTE4MDkyNjM0Ng%3D%3D.2-ccb7-5&oh=00_AfDTrichJStJOsmfUCLid5D-ht7rhiHKkoL8P71kqjXp9Q&oe=65B023E3&_nc_sid=ee9879",
                "url_Profile": "https://www.instagram.com/p/CzlWvXShA2KGPENz8cu9JhZcjIJtd_esdgC7W40/"
            },
            {
                "id": 3,
                "url_Image": "https://scontent-cgk1-2.cdninstagram.com/v/t51.2885-15/371744892_854060559630438_2777568613966427730_n.webp?stp=dst-jpg_e35&efg=eyJ2ZW5jb2RlX3RhZyI6ImltYWdlX3VybGdlbi4xMDgweDEwODAuc2RyIn0&_nc_ht=scontent-cgk1-2.cdninstagram.com&_nc_cat=106&_nc_ohc=sOvLwzWDO0wAX_yCdnF&edm=ACWDqb8BAAAA&ccb=7-5&ig_cache_key=MzE4MDczOTY4MDM4ODIyMzI5Nw%3D%3D.2-ccb7-5&oh=00_AfCTGEszD7tFtRQwufzBZiQ-WLjCcWq9N8A635xPowKssg&oe=65B061D1&_nc_sid=ee9879",
                "url_Profile": "https://www.instagram.com/p/CwkQeMUh5FBplsorvsJIsDlvyUJO7hZe4bvYR80/"
            },
        ]
    });
})
module.exports = router