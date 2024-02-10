const express = require('express');
const router = express.Router();
router.get("/", function (res, req)
{
    req.json({
        owner: {
            "name": "fkri__17",
            "name_prop": "MFikriA",
            "bio": "while(! ( succes = try() ) );",
            "url_Image": "https://api-mfikria.vercel.app/public/assets/ig/profile_ig.jpg",
            "followers": "54",
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
                "url_Image": "https://api-mfikria.vercel.app/public/assets/ig/ig_1.webp",
                "url_Profile": "https://www.instagram.com/p/C2XCZPxhnY_RCVIxDN2kJPCzhmjXrDZ1z4TJL40/",
            },
            {
                "id": 1,
                "url_Image": "https://api-mfikria.vercel.app/public/assets/ig/ig_2.webp",
                "url_Profile": "https://www.instagram.com/p/C1ONvPlB-R2LiNZQipCNo7z_7jvC3czfLeAWG40/",
            },
            {
                "id": 2,
                "url_Image": "https://api-mfikria.vercel.app/public/assets/ig/ig_3.webp",
                "url_Profile": "https://www.instagram.com/p/CzlWvXShA2KGPENz8cu9JhZcjIJtd_esdgC7W40/"
            },
            {
                "id": 3,
                "url_Image": "https://api-mfikria.vercel.app/public/assets/ig/ig_4.webp",
                "url_Profile": "https://www.instagram.com/p/CwkQeMUh5FBplsorvsJIsDlvyUJO7hZe4bvYR80/"
            },
        ]
    });
})
module.exports = router