const express = require('express');
const router = express.Router();
const blogHome = require("../../json/blog/home.json")
router.get("/ig", function (res, req)
{
    req.json({
        owner: {
            "name": "fkri.ardn",
            "name_prop": "MFikriA",
            "bio": "while(! ( succes = try() ) );",
            "url_Image": "https://api-mfikria.vercel.app/public/assets/ig/profile_ig.jpg",
            "followers": "91",
            "following": 54,
            "post": 8,
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
            {
                "id": 4,
                "url_Image": "https://api-mfikria.vercel.app/public/assets/ig/ig_5.webp",
                "url_Profile": "https://www.instagram.com/p/C5yUzhmBGCr-bQFdHAkZbBUvQhWmepkGS3pJRw0/?img_index=2"
            },
            {
                "id": 5,
                "url_Image": "https://api-mfikria.vercel.app/public/assets/ig/ig_6.webp",
                "url_Profile": "https://www.instagram.com/p/C5yUzhmBGCr-bQFdHAkZbBUvQhWmepkGS3pJRw0/?img_index=1"
            },
            {
                "id": 6,
                "url_Image": "https://api-mfikria.vercel.app/public/assets/ig/ig_7.webp",
                "url_Profile": "https://www.instagram.com/p/C6jGCPXBg8IdLO_NqVbV_eOpbqE7vpIrPqIabk0/?img_index=2"
            },
            {
                "id": 7,
                "url_Image": "https://api-mfikria.vercel.app/public/assets/ig/ig_8.webp",
                "url_Profile": "https://www.instagram.com/p/C6jGCPXBg8IdLO_NqVbV_eOpbqE7vpIrPqIabk0/?img_index=1"
            },
            {
                "id": 8,
                "url_Image": "https://api-mfikria.vercel.app/public/assets/ig/ig_9.webp",
                "url_Profile": "https://www.instagram.com/p/C6jGCPXBg8IdLO_NqVbV_eOpbqE7vpIrPqIabk0/?img_index=3"
            },
        ]
    });
})

router.get("/blog", (res, req) =>
{
    req.status(200).send({
        status: req.statusCode,
        "data": [
            {
                "id": 1,
                "title": "Man must explore, and this is exploration at its greatest",
                "subtitle": "Problems look mighty small from 150 miles up",
                "slug": "post_1",
                "img_src": "https://startbootstrap.github.io/startbootstrap-clean-blog/assets/img/post-bg.jpg",
                "postBy": {
                    "title": "Posted by",
                    "name": "Admin",
                    "time": "on March 30, 2024"
                }
            },
            {
                "id": 2,
                "title": "Music that I like to hear",
                "subtitle": "The music I like to listen to is mostly pop and rock music",
                "slug": "post_2",
                "img_src": "https://img.freepik.com/free-photo/volumetric-musical-background-with-treble-clef-notes-generative-ai_169016-29576.jpg",
                "postBy": {
                    "title": "Posted by",
                    "name": "Admin",
                    "time": "on April 12, 2024"
                }
            },
             {
                "id": 3,
                "title": "My World Blog",
                "subtitle": "Blog Life My Personal",
                "slug": "post_3",
                "img_src": "https://images.theconversation.com/files/378097/original/file-20210111-23-bqsfwl.jpg?ixlib=rb-4.1.0&rect=36%2C84%2C7980%2C5072&q=20&auto=format&w=320&fit=clip&dpr=2&usm=12&cs=strip",
                "postBy": {
                    "title": "Posted by",
                    "name": "Admin",
                    "time": "on July 04, 2024"
                }
            },
            {
                "id": 4,
                "title": "Harga Game Fifa 22",
                "subtitle": "Game Sepak Bola FIFA 22 Sudah Bisa Dipesan, Ini Harganya",
                "slug": "post_4",
                "img_src": "https://asset.kompas.com/crops/gPfFu9EefFnrMAf-FZDCLYDd_jo=/50x0:601x367/1200x800/data/photo/2021/07/13/60ed04b51e6fa.png",
                "postBy": {
                    "title": "Posted by",
                    "name": "Admin",
                    "time": "on Juni 18, 2024"
                }
            },
        ]
    })
})

router.get("/blog/post_1", (res, req) =>
{
    req.status(200).send({
        status: req.statusCode,
        data: {
            postBy: {
                creator: "Admin",
                img_profile: "https://yt3.googleusercontent.com/Sq6fZZ3v8ksDDOgfULa3LK28CpNTa-kLu1VFyhmHACvG2AfQtkXCwyYl64LpoSMTeTeBCz23=s160-c-k-c0x00ffffff-no-rj",
                status_creator: "Founder Devloper "
            },
            title: "Man must explore, and this is exploration at its greatest",
            time_post: "March 30, 2024",
            subtitle: "Problems look mighty small from 150 miles up",
            img_background: "https://startbootstrap.github.io/startbootstrap-clean-blog/assets/img/post-bg.jpg",
            content:
            {
                descriptions: [
                    "Never in all their history have men been able truly to conceive of the world as one: a single sphere, a globe, having the qualities of a globe, a round earth in which all the directions eventually meet, in which there is no center because every point, or none, is center — an equal earth which all men occupy as equals. The airman's earth, if free men make it, will be truly round: a globe in practice, not in theory.",
                    "Science cuts two ways, of course; its products can be used for both good and evil. But there's no turning back from science. The early warnings about technological dangers also come from science.",
                    "What was most significant about the lunar voyage was not that man set foot on the Moon but that they set eye on the earth.",
                    "A Chinese tale tells of some men sent to harm a young girl who, upon seeing her beauty, become her protectors rather than her violators. That's how I felt seeing the Earth for the first time. I could not help but love and cherish her.",
                    "For those who have seen the Earth from space, and for the hundreds and perhaps thousands more who will, the experience most certainly changes your perspective. The things that we share in our world are far more valuable than those which divide us.",
                    "--- The Final Frontier ---",
                    "There can be no thought of finishing for ‘aiming for the stars.’ Both figuratively and literally, it is a task to occupy the generations. And no matter how much progress one makes, there is always the thrill of just beginning.",
                    "There can be no thought of finishing for ‘aiming for the stars.’ Both figuratively and literally, it is a task to occupy the generations. And no matter how much progress one makes, there is always the thrill of just beginning.",
                    "The dreams of yesterday are the hopes of today and the reality of tomorrow. Science has not yet mastered prophecy. We predict too much for the next year and yet far too little for the next ten.",
                    "Spaceflights cannot be stopped. This is not the work of any one man or even a group of men. It is a historical process which mankind is carrying out in accordance with the natural laws of human development.",
                    "--- Reaching for the Stars ---",
                    "As we got further and further away, it [the Earth] diminished in size. Finally it shrank to the size of a marble, the most beautiful you can imagine. That beautiful, warm, living object looked so fragile, so delicate, that if you touched it with a finger it would crumble and fall apart. Seeing this has to change a man.",
                    "Space, the final frontier. These are the voyages of the Starship Enterprise. Its five-year mission: to explore strange new worlds, to seek out new life and new civilizations, to boldly go where no man has gone before.",
                    "As I stand out here in the wonders of the unknown at Hadley, I sort of realize there’s a fundamental truth to our nature, Man must explore, and this is exploration at its greatest.",
                ],
                copyright: "Placeholder text by Space Ipsum · Images by NASA on The Commons",
                iframe_yt: "https://www.youtube.com/embed/sV5mqMEnC0I?si=hKD4HdSLAv8Rp-vl"
            }
        }
    })
})

router.get("/blog/post_2", (res, req) =>
{
    req.status(200).send({
        status: req.statusCode,
        data: {
            postBy: {
                creator: "Admin",
                img_profile: "https://yt3.googleusercontent.com/Sq6fZZ3v8ksDDOgfULa3LK28CpNTa-kLu1VFyhmHACvG2AfQtkXCwyYl64LpoSMTeTeBCz23=s160-c-k-c0x00ffffff-no-rj",
                status_creator: "Founder Devloper "
            },
            title: "Music that I like to hear",
            time_post: "April 12, 2024",
            subtitle: "The music I like to listen to is mostly pop and rock music",
            img_background: "https://img.freepik.com/free-photo/volumetric-musical-background-with-treble-clef-notes-generative-ai_169016-29576.jpg",
            content:
            {
                descriptions: [
                    "The first thing I like about the pop and rock genres is music that has high artistic value and I like that in my mind and I have to have good taste in choosing the music I like.",
                    "The second thing I like in terms of pop and rock genre music is artists who are very popular among young people today and I like that😁",
                    "The last thing in liking pop rock genre music is the high tempo of the music and the music is very popular among many people",
                    "That's my short blog, I would like to say thank you"
                ],
                copyright: "Placeholder text by Mfikria · Images by Freepik",
                iframe_yt: "https://www.youtube.com/embed/A-nV1o_IBmk?si=Fg-cb_YBwwF3k3Yv"
            }
        }
    })
})

router.get("/blog/post_3", (res, req) =>
{
    req.status(200).send({
        status: req.statusCode,
        data: {
            postBy: {
                creator: "Admin",
                img_profile: "https://yt3.googleusercontent.com/Sq6fZZ3v8ksDDOgfULa3LK28CpNTa-kLu1VFyhmHACvG2AfQtkXCwyYl64LpoSMTeTeBCz23=s160-c-k-c0x00ffffff-no-rj",
                status_creator: "Founder Devloper "
            },
            title: "My World Blog",
            time_post: "July 04, 2024",
            subtitle: "Blog Life My Personal",
            img_background: "https://images.theconversation.com/files/378097/original/file-20210111-23-bqsfwl.jpg?ixlib=rb-4.1.0&rect=36%2C84%2C7980%2C5072&q=20&auto=format&w=320&fit=clip&dpr=2&usm=12&cs=strip",
            content:
            {
                descriptions: [
                    "I like to make a surprise out of myself and I want to be what makes me happy",
                    "and I want to scream as much as I want",
                    "and this is my short blog and I hope to become a good person physically and mentally"
                ],
                copyright: "Personal Blog My World",
                iframe_yt: "https://www.youtube.com/embed/E1SBwfT2Jsw?si=TFekOHJdhP6iwbuz"
            }
        }
    })
})

router.get("/blog/post_4", (res, req) =>
{
    req.status(200).send({
        status: req.statusCode,
        data: {
            postBy: {
                creator: "Admin",
                img_profile: "https://yt3.googleusercontent.com/Sq6fZZ3v8ksDDOgfULa3LK28CpNTa-kLu1VFyhmHACvG2AfQtkXCwyYl64LpoSMTeTeBCz23=s160-c-k-c0x00ffffff-no-rj",
                status_creator: "Founder Devloper "
            },
            title: "Harga Game Fifa 22",
            time_post: "Juni 18, 2026",
            subtitle: "Game Sepak Bola FIFA 22 Sudah Bisa Dipesan, Ini Harganya",
            img_background: "https://asset.kompas.com/crops/gPfFu9EefFnrMAf-FZDCLYDd_jo=/50x0:601x367/1200x800/data/photo/2021/07/13/60ed04b51e6fa.png",
            content:
            {
                descriptions: [
                    "Meski baru akan meluncur 1 Oktober nanti, FIFA 22 sudah bisa dipesan oleh para penggemar dari sekarang.", 
                    "Ada dua edisi yang ditawarkan EA, yaitu FIFA 22 - Standard Edition dan FIFA 22 - Ultimate Edition. Di Indonesia, pengguna sudah bisa memesan game tersebut di situs web resmi EA, atau di perangkat dan konsolnya masing-masing, dengan harga sebagai berikut. FIFA 22 - Standard Edition Baca juga: Alasan Belanda Hobi Tanam Pohon Asam Jawa di Pinggir Jalan - PS4: Rp 849.000 - PS5: Rp 1.009.000 - PC: Rp 659.000 FIFA 22 - Ultimate Edition - PS4 & PS5: Rp 1.409.000 - PC: Rp 999.000 Pengguna yang memesan FIFA 22 - Ultimate Edition tentunya bakal mendapatkan sejumlah benefit ekstra, salah satunya adalah. Artinya, apabila membeli edisi `Ultimate Edition`, pengguna bakal mendapatkan FIFA 22 untuk dua versi konsol game sekaligus secara cuma-cuma (free upgrade), yaitu untuk PS4 dan PS5 atau Xbox One dan Xbox Series X/S. Baca juga: Sony Diskon Harga Game hingga 80 Persen di PlayStation Store, Ini Rekomendasinya Lalu, mereka juga bakal mendapatkan sejumlah hadiah edisi terbatas, seperti in-game items berupa FUT Heroes Player, 4.600 FIFA Points, Team of the Week 1 Player, dan masih banyak lagi. Selain itu, mereka yang memesan FIFA 22 - Ultimate Edition juga bakal bisa memainkan game tersebut lebih awal pada 27 September 2021,",
                    "sebagaimana dirangkum KompasTekno dari EA.com, Selasa (13/7/2021)."
                ],
                copyright: "Kompas.com",
                iframe_yt: "https://www.youtube.com/embed/vUJis1UBI5w?si=LZ-RVn5O2y42VDUL"
            }
        }
    })
})

router.get("/*", (res, req) =>
{
    req.status(404).send({
        status: req.statusCode,
        message: "error Page"
    })
})
module.exports = router
