const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const port = 5000
const cors = require('cors')

const github = require('./routes/github/api');
const anime = require('./routes/anime/api');
const crypto = require('./routes/crypto/api');
const public = require('./routes/public/api');

app.use(bodyParser.json());
app.use(cors());
app.use(function (req, res, next)
{
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
     res.setHeader('Access-Control-Allow-Credentials', true);
     next()
});

app.use('/v3/', crypto);
app.use('/v2/', anime);
app.use('/v1/', github);
app.get('/', function (req, res)
{
     res.json({ message: "Selamat datang di api mfikria " });

});
app.get('/media-url', function (req, res)
{
     res.json({
          github: "https://github.com/dodokjr",
          instagram: "https://www.instagram.com/fkri__17/",
          youtube: "https://www.youtube.com/channel/UCLP0I71nvbJ2D_Y5y-mwbEw",
          linkendi: "https://www.linkedin.com/in/muhammad-fikri-ardiyansah-952752194/",
          discord: "https://discord.gg/DnNTUuGP"
     })
})

app.listen(port, () =>
{
     console.log(`masuk ${port}`)
})