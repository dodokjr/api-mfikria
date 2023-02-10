const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const port = 5000
const cors = require('cors')

const github = require('./routes/github/api');
const anime = require('./routes/anime/api')
const crypto = require('./routes/crypto/api')

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
app.post('/', function (req, res)
{
     res.json({ message: "Selamat datang di api mfikria " });
     console.log(res);
});

app.use(express.static(__dirname + '/public'));
app.get('/img/1', function (req, res)
{
     res.sendFile(__dirname + '/public/assets/about.png');
});

app.get('/img/2', function (req, res)
{
     res.sendFile(__dirname + '/public/assets/me.webp');
});

app.get('/img/3', function (req, res)
{
     res.sendFile(__dirname + '/public/assets/giphy1.gif');
});

app.get('/img/4', function (req, res)
{
     res.sendFile(__dirname + '/public/assets/giphy.gif');
});

app.get('/img/5', function (req, res)
{
     res.sendFile(__dirname + '/public/assets/milly-anime.gif');
});

app.get('/img/6', function (req, res)
{
     res.sendFile(__dirname + '/public/assets/shiki-mori-shikimoris-not-just-cute.gif');
});

app.get('/img/7', function (req, res)
{
     res.sendFile(__dirname + '/public/assets/DodokStore.png');
});

app.get('/img/8', function (req, res)
{
     res.sendFile(__dirname + '/public/assets/Background.png');
});

app.get('/vidio/1', function (req, res)
{
     res.sendFile(__dirname + '/public/assets/video/Official髭男dism  I LOVEOfficial Video_1080p.mp4');
});


app.listen(port, () =>
{
     console.log(`masuk ${port}`)
})