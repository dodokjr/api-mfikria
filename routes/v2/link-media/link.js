const express = require('express');
const router = express.Router();

router.get('/website', async function (req, res)
{
    res.status(301).redirect("https://mfikria.vercel.app/")
});

router.get('/instagram', async function (req, res)
{
    res.status(302).redirect('https://www.instagram.com/fkri__22/')
});

router.get('/github', function (req, res)
{
    res.status(302).redirect('https://github.com/dodokjr')
});


router.get('/linkedin', async function (req, res)
{
    res.status(302).redirect('https://www.linkedin.com/in/muhammad-fikri-ardiyansah-952752194/')
});


router.get('/discord', async function (req, res)
{
    res.status(302).redirect('https://discord.gg/xHQhrDm4dA')
});

router.get('/steam', async function (req, res)
{
    res.status(302).redirect('https://steamcommunity.com/id/hokage_17/')
});

router.get('/youtube', async function (req, res)
{
    res.status(302).redirect('https://www.youtube.com/channel/UCLP0I71nvbJ2D_Y5y-mwbEw?sub_confirmation=1')
});

router.get('/facebook', async function (req, res)
{
    res.status(302).redirect('https://www.facebook.com/muhammad.f.ardiyansah.16/')
});

router.get('/twitter', async function (req, res)
{
    res.status(302).redirect('https://twitter.com/bintangFikri3')
});

module.exports = router
