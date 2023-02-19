const bodyParser = require('body-parser');
var cookieSession = require('cookie-session')
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
     res.setHeader('Vary', '*');
     res.setHeader('Access-Control-Allow-Credentials', true);
     next()
});


app.set('trust proxy', 1)
app.use(cookieSession({
     name: 'session',
     keys: ['2098xxpotn', '0924hfjahsjf'],
}))

app.use('/v3/', crypto);
app.use('/v2/', anime);
app.use('/v1/', github);
app.get('/', function (req, res)
{
     res.json({ message: "Selamat datang di api mfikria " });
     req.session.views = (req.session.views || 0) + 1
});


app.get('/media-url/link', function (req, res)
{
     res.json({
          github: "https://github.com/dodokjr",
          instagram: "https://www.instagram.com/fkri__17/",
          youtube: "https://www.youtube.com/channel/UCLP0I71nvbJ2D_Y5y-mwbEw",
          linkendi: "https://www.linkedin.com/in/muhammad-fikri-ardiyansah-952752194/",
          discord: "https://discord.gg/DnNTUuGP"
     })
})

app.get('/media-url/img', function (req, res)
{
     res.json({
          data: {
               One: {
                    "src": "https://i.pinimg.com/236x/46/63/c1/4663c1a34ec2c158551d6c85c5e7bb87.jpg",
                    "des": "Hallo kawankawan",
                    "title": "Hallo dek"
               },
               Two: {
                    "src": "https://i.pinimg.com/236x/d3/7b/d0/d37bd0f69a5ff9ca11351691d42a416e.jpg",
                    "des": "Hallo kawankawan",
                    "title": "Hallo dek"
               },
               Three: {
                    "src": "https://i.pinimg.com/736x/00/a7/19/00a7190504eea461bbce8c3b5c12dd41.jpg",
                    "des": "Hallo kawankawan",
                    "title": "Hallo dek"
               },
          }
     })
})

app.listen(port, () =>
{
     console.log(`masuk ${port}`)
})