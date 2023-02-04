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


app.listen(port, () =>
{
     console.log(`masuk ${port}`)
})