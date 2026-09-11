const express = require('express');
const router = express.Router();
router.get("/", function (res, req)
{
    req.status(200).json({
        "status": req.statusCode,
        "message": "Selamat datang di api-mfikria.vercel.app/v1/mfikria/hobbies",
        "data" : {
            "Link1" : "/assets",
            "link2" : "/profile"
        }
    })
});

router.get("/music", async (res, req) => {
    const url = "https://"
    const link = "api-mfikria.vercel.app"
    const path = "/public/assets/store"
    req.status(200).json({
        status: req.statusCode,
        assets_data: {
            name: "My Hobbies || Music",
            music: [
                {
                  songName: 'ONLY',
                  songArtist: 'Lee Hi',
                  songSrc: 'https://mfikria-2021.netlify.app/assets/03.ONLY%20-%20Lee%20Hi%20(Melisa%20Hart%20ft.%20Roomate%20Project%20Cover)%20Live%20Session.mp3',
                  songAvatar: 'https://mfikria-2021.netlify.app/assets/logo.png'
                },
                {
                  songName: 'Wanita Masih Banyak',
                  songArtist: 'Stand Hero Alone',
                  songSrc: 'https://mfikria-2021.netlify.app/assets/10.Wanita%20Masih%20Banyak.mp3',
                  songAvatar: 'https://mfikria-2021.netlify.app/assets/logo.png'
                },
                {
                  songName: 'Cinta Itu Asu',
                  songArtist: 'Unknown',
                  songSrc: 'https://mfikria-2021.netlify.app/assets/05.Cinta%20Itu%20Asu.mp3',
                  songAvatar: 'https://mfikria-2021.netlify.app/assets/logo.png'
                },
                {
                  songName: 'Kita Lawan Mereka',
                  songArtist: 'Stand Hero Alone',
                  songSrc: 'https://mfikria-2021.netlify.app/assets/09.Kita%20Lawan%20Mereka.mp3',
                  songAvatar: 'https://mfikria-2021.netlify.app/assets/logo.png'
                },
                {
                  songName: 'Spesial',
                  songArtist: 'Kat',
                  songSrc: 'https://mfikria-2021.netlify.app/assets/kat.mp3',
                  songAvatar: 'https://mfikria-2021.netlify.app/assets/logo.png'
                },
                {
                  songName: 'Aku Kamu dan Samudra',
                  songArtist: 'Rebellion Rose',
                  songSrc: 'https://mfikria-2021.netlify.app/assets/08.Rebellion%20Rose%20%20Aku%20Kamu%20dan%20Samudra%20Official%20Video%20Lirik.mp3',
                  songAvatar: 'https://mfikria-2021.netlify.app/assets/logo.png'
                },
                {
                    songName: 'The Weeknd Playlist 2025   Award-Winning US-UK R&B & Pop Anthems',
                    songArtist: 'The Weeknd',
                    songSrc: 'https://helpful-daffodil-43afac.netlify.app/The%20Weeknd%20Playlist%202025%20%20%20Award-Winning%20US-UK%20R&B%20&%20Pop%20Anthems.mp3',
                    songAvatar: 'https://mfikria-2021.netlify.app/assets/logo.png'
                  },
                  {
                    songName: 'MENTERI DURMAGATI - Kajawi  CINTAMU SEPAHIT TOPI MIRING  SUWUNG  LAGU HIP HOP JAWA VIRAL',
                    songArtist: 'Hiphop Jawa',
                    songSrc: 'https://helpful-daffodil-43afac.netlify.app/MENTERI%20DURMAGATI%20-%20Kajawi%20%20CINTAMU%20SEPAHIT%20TOPI%20MIRING%20%20SUWUNG%20%20LAGU%20HIP%20HOP%20JAWA%20VIRAL.mp3',
                    songAvatar: 'https://mfikria-2021.netlify.app/assets/logo.png'
                  },
                  {
                    songName: 'Taylor Swift Playlist Mix - Chill Night Ride With Me',
                    songArtist: 'Taylor Swift',
                    songSrc: 'https://helpful-daffodil-43afac.netlify.app/Taylor%20Swift%20Playlist%20Mix%20-%20Chill%20Night%20Ride%20With%20Me.mp3',
                    songAvatar: 'https://mfikria-2021.netlify.app/assets/logo.png'
                  },
                  {
                    songName: 'Sangar',
                    songArtist: 'Phonk',
                    songSrc: 'https://helpful-daffodil-43afac.netlify.app/Most%20Viral%20PhonkFunk%202026.mp3',
                    songAvatar: 'https://mfikria-2021.netlify.app/assets/logo.png'
                  },
              ]
        }
    })
})



module.exports = router