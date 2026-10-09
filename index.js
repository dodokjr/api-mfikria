
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const cors = require('cors');
var favicon = require('serve-favicon');
var path = require('path');
const rateLimit = require('express-rate-limit');
const dotenv = require("dotenv");
const multer = require('multer');
const fileUpload = require('express-fileupload');
const authRoutes = require("./routes/mfikria/routes/authRoutes")

const PORT = process.env.PORT || 5991

app.listen(PORT, () =>
{
     console.log(`http://localhost:${PORT}`)
});

const allowedOrigins = [
     'http://localhost:5173',
     'https://5173-firebase-api-mfikria-1781747502400.cluster-ikxjzjhlifcwuroomfkjrx437g.cloudworkstations.dev/app',
     'https://mfikria.vercel.app/',          // domain produksi
     process.env.FRONTEND_ORIGIN,                   // opsional, dari env
   ].filter(Boolean);
   
   const corsOptions = {
     origin(origin, callback) {
       // tanpa origin (curl/Postman) boleh; *.cloudworkstations.dev = preview Firebase Studio
       if (!origin || allowedOrigins.includes(origin) || /\.cloudworkstations\.dev$/.test(new URL(origin).hostname)) {
         return callback(null, true);
       }
       return callback(new Error('Origin tidak diizinkan oleh CORS'));
     },
     methods: ['GET', 'POST', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
     maxAge: 86400,
   };
   
   app.use(cors(corsOptions));
   app.options('*', cors(corsOptions)); // balas preflight
   app.set('trust proxy', 1);  

require('dotenv').config();


const limiter = rateLimit({
     windowMs: 5 * 60 * 1000, // 5 minutes
     max: 50, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
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
app.use(function (req, res, next)
{
     res.setHeader('Access-Control-Allow-Methods', 'GET');
     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
     res.setHeader('age', '20')
     res.setHeader("Content-Language", "id-ID")
     res.setHeader('Date', new Date());
     res.cookie('mfikria', randomValue, { maxAge: 20000, httpOnly: true, sameSite: 'lax', secure: true });
     if (req.method === "OPTIONS") res.send(200);
     else next();
});

app.use(favicon(path.join(__dirname, '/__public', 'logo.ico')));
app.use(express.static(__dirname + "/__public/"));
app.use('/link', limiter, require('./routes/v2/link-media/api'));
app.use('/v3/youtube', limiter, require('./routes/v3/youtube/api'))
app.use('/v2/anime', limiter, require('./routes/v2/anime/api'));
app.use('/v2/github', limiter, require('./routes/v2/github/api'));
app.use('/status', limiter, require("./routes/status"))
app.use('/lk21', limiter, require("./routes/v3/lk21/api"))
app.use("/u", limiter, require("./routes/v2/link-media/link"))

app.use("/mfanimelist", limiter, require("./routes/mfanimelist"))
app.use("/contributors", limiter, require("./routes/web/contributors"))
app.use("/v1/", require("./routes/mfikria/home-api"))

// Portofolio
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());
app.use('/mfikria/c/', require("./routes/i/index"))
app.use("/mfikria/p/", limiter, require("./routes/i/fkri_17/api"))
app.use("/mfikria/store", limiter, require("./routes/mfikria/Store/store-file"))
app.use("/mfikria/myhobbies", limiter, require("./routes/mfikria/MyHobbies/MyHobbies-file"))
const upload = multer({ storage: multer.memoryStorage() });
// Rute API
app.use('/mfikria/v1', authRoutes);
app.get('/mfikria/v1', (req, res) =>
     {
          res.status(200).send({
               succes: true,
               status: 200,
               message: "Wellcom To Api Mfikria Official"
          })
     });

app.get("/", (req, res) =>
{
     res.status(200).send({
          status: 200,
          message: "Wellcom To Api Mfikria Official"
     })
})

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


app.get('/id', function (req, res)
{
     res.json({
          mesagger: "hello"
     })
})


app.get('*', (req, res) => {
  const now = new Date();

  // Memaksa zona waktu ke Asia/Jakarta (WIB)
  const timeZone = 'Asia/Jakarta';

  const hariTanggal = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone
  });

  const jamFormat = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone
  }).replace(/\./g, ':'); // Mengubah titik bawaan id-ID menjadi titik dua (:)

  const randomValue = Math.random().toString(36).substring(2, 10);

  res.status(404).json({
    status: res.statusCode,
    code_for_message: randomValue,
    TimeStatus: `${hariTanggal} - ${jamFormat}`,
    message: "error 404 please contact https://mfikria.vercel.app"
  });
});






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





