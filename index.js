
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const cors = require('cors');
var favicon = require('serve-favicon');
var path = require('path');
const rateLimit = require('express-rate-limit');
const router = express.Router();
require('dotenv').config();


const PORT = process.env.PORT || 5000

app.listen(PORT, () =>
{
     console.log(`http://localhost:${PORT}`)
});


const limiter = rateLimit({
     windowMs: 5 * 60 * 1000, // 5 minutes
     max: 25, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
     standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
     legacyHeaders: false,
})

app.use(cookieParser());
app.use(cors());
app.use(function (req, res, next)
{
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Access-Control-Allow-Methods', 'GET');
     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
     res.setHeader('age', '15')
     res.setHeader('Vary', '*');
     res.set('Cache-Control', 's-maxage=1, stale-while-revalidate=59');
     res.setHeader('Access-Control-Allow-Credentials', true);
     res.cookie('mfikria', randomValue, { maxAge: 100000, httpOnly: true, sameSite: 'lax', secure: true });
     next()
});

app.use(favicon(path.join(__dirname, '/__public', 'logo.ico')));
app.use('/', express.static(__dirname + "/__public/"));
app.use('/link', require('./routes/v2/link-media/api'));
app.use('/v3/youtube', require('./routes/v3/youtube/api'))
app.use('/v2/anime', require('./routes/v2/anime/api'));
app.use('/v2/github', require('./routes/v2/github/api'));

app.get('*', function (req, res)
{
     res.status(404).sendFile(path.join(__dirname + '/__public/404.html'))
})

app.get("/website", (req, res) =>
{

     res.status(301).redirect("https://mfikria.vercel.app/")

});

app.get('/instagram', (req, res) =>
{
     res.status(302).redirect('https://www.instagram.com/fkri__17/')
});

app.get('/github', (req, res) =>
{
     res.status(302).redirect('https://github.com/dodokjr')
});

app.get('/linkedin', (req, res) =>
{
     res.status(302).redirect('https://www.linkedin.com/in/muhammad-fikri-ardiyansah-952752194/')
});

app.get('/discord', (req, res) =>
{
     res.status(302).redirect('https://discord.gg/xHQhrDm4dA')
});

app.get('/steam', (req, res) =>
{
     res.status(302).redirect('https://steamcommunity.com/id/hokage_17/')
});

app.get('/youtube', (req, res) =>
{
     res.status(302).redirect('https://www.youtube.com/channel/UCLP0I71nvbJ2D_Y5y-mwbEw?sub_confirmation=1')
});

app.get('/facebook', (req, res) =>
{
     res.status(302).redirect('https://www.facebook.com/muhammad.f.ardiyansah.16/')
});

app.use('/status', limiter, require('./routes/status'));

// app.use('/status', function (req, res)
// {
//      res.status(200).send({ Number: randomNumber })
// })





function errorHandler(err, req, res, next)
{
     if (req.xhr)
     {
          res.ststus(500).sand({ error: 'Api Tidak Ditemukan' })
     } else
     {
          next(err)
     }
}


var randomNumber = Math.random().toString();
randomNumber = randomNumber.substring(2, randomNumber.length);



function randomString(len, charSet)
{
     charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
     var randomString = '';
     for (var i = 0; i < len; i++)
     {
          var randomPoz = Math.floor(Math.random() * charSet.length);
          randomString += charSet.substring(randomPoz, randomPoz + 1);
     }
     return randomString;
}

var randomValue = randomString(5);

var cookieName = 'Root'


