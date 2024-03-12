
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
     max: 550, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
     standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
     legacyHeaders: false,
     statusCode: 500,
     message: {
          status: 500, // optional, of course
          limiter: true,
          type: "error",
          message: 'You are doing that too much. Please try again in 5 minutes.'
     }
})

app.use(cookieParser());
app.use(cors());
app.use(function (req, res, next)
{
     res.setHeader('Access-Control-Allow-Methods', 'GET');
     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
     res.setHeader('Access-Control-Allow-Credentials', true);
     res.setHeader('age', '20')
     res.setHeader("Content-Language", "id-ID")
     res.setHeader('Date', new Date());
     res.cookie('mfikria', randomValue, { maxAge: 20000, httpOnly: true, sameSite: 'lax', secure: true });
     if (req.method === "OPTIONS") res.send(200);
     else next();
});

app.use(favicon(path.join(__dirname, '/__public', 'logo.ico')));
app.use('/', express.static(__dirname + "/__public/"));
app.use('/link', limiter, require('./routes/v2/link-media/api'));
app.use('/v3/youtube', limiter, require('./routes/v3/youtube/api'))
app.use('/v2/anime', limiter, require('./routes/v2/anime/api'));
app.use('/v2/github', limiter, require('./routes/v2/github/api'));
app.use('/status', limiter, require("./routes/status"))
app.use('/ig', limiter, require("./routes/i/index"))
app.use('/otaku', limiter, require("./routes/otakudesu/api"))
app.use('/lk21', limiter, require("./routes/v3/lk21/api"))
app.use("/u", limiter, require("./routes/v2/link-media/link"))
app.use("/mfikria", limiter, require("./routes/i/fkri_17/api"))
app.use("/mfanimelist", limiter, require("./routes/mfanimelist"))
app.get("/m", (req, res) =>
{
     const q = req.query.q
     res.status(301).redirect(`/u/${q}`)
})

app.get("/op", (req, res) =>
{
     const mediaS = req.query.mediaS
     const name = req.query.name
     res.status(301).redirect(`/${mediaS}/${name}?fop=${randomNumber}&value=${randomValue}`)
})

app.get('/github/:name', (req, res) =>
{
     const name = req.params.name
     res.status(302).redirect(`https://github.com/${name}`)
});

app.get('/instagram/:name', (req, res) =>
{
     const name = req.params.name
     res.status(302).redirect(`https://www.instagram.com/${name}/?hl=en-en`)
});

app.use('/status', limiter, require('./routes/status'));

app.get('/id', function (req, res)
{
     res.json({
          mesagger: "hello"
     })
})

app.get('*', function (req, res)
{
     res.status(404).sendFile(path.join(__dirname + '/__public/404.html'))
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
randomNumber = randomNumber.substring(1 || randomNumber.length);



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




