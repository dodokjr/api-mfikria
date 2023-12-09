
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const cors = require('cors');
var favicon = require('serve-favicon');
var path = require('path');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const github = require('./routes/v2/github/api');
const anime = require('./routes/v2/anime/api');
const link = require('./routes/v2/link-media/api');
const youtube = require('./routes/v3/youtube/api');
const status = require('./routes/status')
const movies = require('./routes/v3/lk21/Movies');
const dramaseries = require('./routes/v3/lk21/DramaSeries')
const alat = require('./routes/v3/lk21/AlatApi');
const redirectt = require('./routes/v3/mediasocial/redirect')

const port = 5000

app.listen(port, () =>
{
     console.log(`http://localhost:${port}`)
});


const limiter = rateLimit({
     windowMs: 5 * 60 * 1000, // 5 minutes
     max: 25, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
     standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
     legacyHeaders: false,
})
app.use(bodyParser.urlencoded({
     extended: true
}))
app.use(cookieParser());
app.use(bodyParser.json());
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

app.use(favicon(path.join(__dirname, 'public', 'logo.ico')));
app.use('/', express.static(__dirname + "/public"));
app.use('/link', link);
app.use('/v3/youtube', youtube)
app.use('/v2/anime', anime);
app.use('/v2/github', github);
// V3
app.use('/v3/lk21/', alat)
app.use('/v3/lk21/movies', movies)
app.use('/v3/lk21/dramaseries', dramaseries)

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

app.use('/status', limiter, status);

// app.use('/status', function (req, res)
// {
//      res.status(200).send({ Number: randomNumber })
// })

app.get('*', function (req, res)
{
     res.status(404).sendFile(path.join(__dirname + '/public/404.html'))
})



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


