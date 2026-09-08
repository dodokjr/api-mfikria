const express = require('express');
const router = express.Router();
router.get("/", function (res, req)
{
    req.status(200).json({
        "status": req.statusCode,
        "message": "Selamat datang di api-mfikria.vercel.app/v1/mfikria/store",
        "data" : {
            "Link1" : "/assets",
            "link2" : "/profile"
        }
    })
});

router.get("/profile", async (res, req) => {
    const url = "https://"
    const link = "api-mfikria.vercel.app"
    const path = "/public/assets/store"
    req.status(200).json({
        status: req.statusCode,
        Brand: {
            name: "Lose Brand",
            Logo: `${url}${link}${path}/LS_Logo.jpeg`,
            deskripsi: "Tokoh Baju Lokal Yang mengankat tema baju sederhana namun keliatan mewah",
            Team: [
                {
                    id: 1,
                    nama: "Muhammad Fikri Ardiyansah",
                    media_social : [
                        {
                            id: 1,
                            name: "Instagram",
                            url: "https://www.instagram.com/fkri.ardn/"
                        }
                    ]
                }
            ],
            rating_toko: 4.9,
            penjualan: 1,
            keritikSaran: [
                {
                    id: 1,
                    nama: "Yoyo",
                    message: "Bahan Bagus, enak dipakai, halus, dan respon penjual cepat top markotop lah",
                    rating: 4.9
                }
            ]
        }
    })
})

router.get('/assets',async (res, req) => {
    const url = "https://"
    const link = "api-mfikria.vercel.app"
    const path = "/public/assets/store"
    req.status(200).json({
        status: req.statusCode,
        data:  [
                {
                    id: 1,
                    name: 'Lose Brand horse',
                    category: 'T-shirt',
                    price: 500000,
                    rating: 4.9,
                    image: `${url}${link}${path}/LS1.jpeg`,
                    slug: "/card?slug=lose-brand-horse"
                },
                {
                    id: 2,
                    name: 'Lose Brand cowboy',
                    category: 'T-shirt',
                    price: 500000,
                    rating: 4.9,
                     image: `${url}${link}${path}/LS2.jpeg`,
                     slug: "/card?slug=lose-brand-cowboy"
                },
                {
                    id: 3,
                    name: 'Lose Brand knight',
                    category: 'T-shirt',
                    price: 500000,
                    rating: 4.9,
                     image: `${url}${link}${path}/LS3.jpeg`,
                     slug: "/card?slug=lose-brand-knight"
                },
                {
                    id: 4,
                    name: 'Lose Brand knight Two',
                    category: 'T-shirt',
                    price: 500000,
                    rating: 4.9,
                     image: `${url}${link}${path}/LS4.jpeg`,
                     slug: "/card?slug=lose-brand-knightTwo"
                }
            ]
    })
})

module.exports = router
