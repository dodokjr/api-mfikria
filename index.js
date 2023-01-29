const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const port = 5000
const cors = require('cors')

const api = require('./routes/api');
const anime = require('./routes/anime/animeapi')

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

app.use('/api/anime', anime)
app.use('/api', api);
app.get('/', function (req, res)
{
     res.send(`server up ${port}`)
})


app.listen(port, () =>
{
     console.log(`masuk ${port}`)
})