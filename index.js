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
app.use('/public', express.static(__dirname + "/public"));
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


app.listen(port, () =>
{
     console.log(`masuk ${port}`)
});