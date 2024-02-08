
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
app.use('/link', require('./routes/v2/link-media/api'));
app.use('/v3/youtube', require('./routes/v3/youtube/api'))
app.use('/v2/anime', require('./routes/v2/anime/api'));
app.use('/v2/github', require('./routes/v2/github/api'));
app.use('/status', require("./routes/status"))
app.use('/ig', require("./routes/i/index"))
app.use('/otaku', require("./routes/otakudesu/api"))
app.use('/lk21', require("./routes/v3/lk21/api"))
app.use("/u", require("./routes/v2/link-media/link"))
app.get("/m", (req, res) =>
{
     const q = req.query.q
     res.status(301).redirect(`/u/${q}`)
})


app.get('/github/:name', (req, res) =>
{
     const name = req.params.name
     res.status(302).redirect(`https://github.com/${name}`)
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




