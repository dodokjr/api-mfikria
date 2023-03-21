const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const port = 5000
const cors = require('cors')
var favicon = require('serve-favicon')
var path = require('path')

const github = require('./routes/github/api');
const anime = require('./routes/anime/api');
const crypto = require('./routes/crypto/api');
const link = require('./routes/media-url/link/api');


app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors());
app.use(function (req, res, next)
{
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Access-Control-Allow-Methods', 'GET');
     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
     res.setHeader('age', '5')
     res.setHeader('Vary', '*');
     res.set('Cache-Control', 's-maxage=1, stale-while-revalidate=59');
     res.setHeader('Access-Control-Allow-Credentials', true);
     res.cookie('mfikria', '913698yg3l1qjxuj14RF634NZHV', { maxAge: 900000, httpOnly: true });
     next()
});

app.use(favicon(path.join(__dirname, 'public', 'logo.ico')));

app.use('/link', link)
app.use('/v2/crypto', crypto);
app.use('/v2/anime', anime);
app.use('/v2/github', github);
app.get('/v2', function (req, res)
{
     res.json({ url: "/v2 /github/{name}, /anime/{name}, /crypto " });
     req.session.views = (req.session.views || 0) + 1
});
app.get('/', function (req, res)
{
     res.json({ message: "Selamat datang di api mfikria " });
     req.session.views = (req.session.views || 0) + 1
});

app.get('/like', function (req, res)
{
     res.json({
          one: 'https://i.pinimg.com/750x/07/a5/33/07a533c3c90cb142604d63a1de4626d2.jpg',
          two: 'https://i.pinimg.com/736x/44/91/ae/4491ae96bdba7c06b09bf19656aafd01.jpg',
          three: 'https://i.pinimg.com/736x/12/ec/96/12ec96842cae66a809ec019da9cadfce.jpg'
     })
})

app.listen(port, () =>
{
     console.log(`masuk ${port}`)
});