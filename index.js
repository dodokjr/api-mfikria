const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const port = 5000
const cors = require('cors')

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
     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

     res.setHeader('Vary', '*');
     res.set('Cache-Control', 'public, max-age=31557600, s-maxage=31557600');
     res.setHeader('Access-Control-Allow-Credentials', true);
     res.cookie('mfikria', '913698yg3l1qjxuj14RF634NZHV', { maxAge: 900000, httpOnly: true });
     next()
});


app.set('trust proxy', 1)
app.use(cookieSession({
     name: 'session',
     keys: ['2098xxpotn', '0924hfjahsjf'],
}))

app.use('/link', link)
app.use('/v2/crypto', crypto);
app.use('/v2/anime', anime);
app.use('/v2/github', github);
app.get('/', function (req, res)
{
     res.json({ message: "Selamat datang di api mfikria " });
     req.session.views = (req.session.views || 0) + 1
});

app.listen(port, () =>
{
     console.log(`masuk ${port}`)
})