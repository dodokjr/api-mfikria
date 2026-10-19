require('dotenv').config(); // load .env FIRST so process.env.FRONTEND_ORIGIN is available below

const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');
const favicon = require('serve-favicon');
const path = require('path');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const fileUpload = require('express-fileupload');

// Muat router dengan aman: kalau satu modul gagal dimuat (nama file salah huruf, package kurang, env kosong),
// hanya route itu yang membalas 500 JSON. Route lain (misal /v1/home) tetap hidup, dan header CORS tetap terkirim.
// Penyebab asli tercatat di log dengan awalan "BOOT ERROR". APP_DEBUG=1 menampilkan pesannya di respons.
function loadRouter(label, loader) {
     try {
          return loader();
     } catch (error) {
          console.error(`BOOT ERROR (${label}):`, error && error.stack ? error.stack : error);
          const failed = express.Router();
          failed.use((req, res) => {
               const payload = { status: 'error', message: `500 Modul ${label} gagal dimuat, cek log server.` };
               if (process.env.APP_DEBUG === '1') payload.reason = String(error && error.message ? error.message : error);
               res.status(500).json(payload);
          });
          return failed;
     }
}

const authRoutes = loadRouter('authRoutes', () => require('./routes/mfikria/routes/authRoutes'));
const githubRoutes = loadRouter('githubRoutes', () => require('./routes/mfikria/routes/Githubroutes')); // proxy GitHub (wajib guest token)
const feedbackRoutes = loadRouter('feedbackRoutes', () => require('./routes/mfikria/routes/Feedbackroutes')); // saran & kritik (Google Sheet)

const app = express();
const PORT = process.env.PORT || 5990;

// ---------- helpers (defined first so middleware can use them) ----------
function randomString(len, charSet) {
     charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
     let result = '';
     for (let i = 0; i < len; i++) {
          const randomPoz = Math.floor(Math.random() * charSet.length);
          result += charSet.substring(randomPoz, randomPoz + 1);
     }
     return result;
}

let randomNumber = Math.random().toString();
randomNumber = randomNumber.substring(1);
const randomValue = randomString(5);

// ---------- CORS ----------
// Origin = scheme + host (+ port) only. NO trailing slash, NO path.
const allowedOrigins = [
     'https://mfikria.vercel.app',
     'https://5173-firebase-api-mfikria-1781747502400.cluster-ikxjzjhlifcwuroomfkjrx437g.cloudworkstations.dev',
     process.env.FRONTEND_ORIGIN,
].filter(Boolean);

const corsOptions = {
     origin(origin, callback) {
          // no origin (curl/Postman/server-to-server) is allowed
          if (!origin) return callback(null, true);

          let host = '';
          try {
               host = new URL(origin).hostname;
          } catch {
               return callback(null, false);
          }

          // *.cloudworkstations.dev = Firebase Studio preview
          if (allowedOrigins.includes(origin) || host.endsWith('.cloudworkstations.dev')) {
               return callback(null, true);
          }
          // false (not an Error) so the response is a clean CORS rejection, not a 500
          return callback(null, false);
     },
     methods: ['GET', 'POST', 'OPTIONS'],
     // x-guest-token / x-guest-date / Range ditambahkan untuk guest token 24 jam dan streaming video
     allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token', 'X-Requested-With', 'x-guest-token', 'x-guest-date', 'Range'],
     exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Retry-After'],
     maxAge: 86400,
};

app.set('trust proxy', 1);
app.use(cors(corsOptions)); // also answers preflight (OPTIONS) requests

// ---------- rate limiter ----------
const limiter = rateLimit({
     windowMs: 5 * 60 * 1000, // 5 minutes
     max: 50, // limit each IP to 50 requests per window
     standardHeaders: true,
     legacyHeaders: false,
     statusCode: 500,
     message: {
          status: 500,
          limiter: true,
          type: 'error',
          message: 'You are doing that too much. Please try again in 5 minutes.'
     }
});

// Route yang responsnya di-cache CDN Vercel lewat Cache-Control s-maxage (hemat Fast Origin Transfer):
//   thumb (gambar cuplikan), guest-view (jumlah pengunjung), feedback (daftar saran & kritik), embed (halaman player).
// Response yang membawa Set-Cookie tidak disimpan CDN, dan header "age" palsu mengurangi masa segar cache,
// jadi keduanya TIDAK dipasang untuk route ini.
const CDN_CACHEABLE = /^\/mfikria\/v1\/(thumb\/|guest-view$|feedback$|embed\/)/;

app.use(cookieParser());
app.use(function (req, res, next) {
     const cacheable = req.method === 'GET' && CDN_CACHEABLE.test(req.path);

     // NOTE: do not set Access-Control-* headers here, the cors() middleware owns them
     if (!cacheable) res.setHeader('age', '20');
     res.setHeader('Content-Language', 'id-ID');
     res.setHeader('Date', new Date().toUTCString());
     if (!cacheable) res.cookie('mfikria', randomValue, { maxAge: 20000, httpOnly: true, sameSite: 'lax', secure: true });
     if (req.method === 'OPTIONS') return res.sendStatus(200);
     next();
});

app.use(favicon(path.join(__dirname, '/__public', 'logo.ico')));
app.use(express.static(__dirname + '/__public/'));

// ---------- routes ----------
app.use('/link', limiter, require('./routes/v2/link-media/api'));
app.use('/v2/github', limiter, githubRoutes); // ganti router lama ./routes/v2/github/api (sudah dihapus)
app.use('/status', limiter, require('./routes/status'));
app.use('/u', limiter, require('./routes/v2/link-media/link'));

app.use('/contributors', limiter, require('./routes/web/contributors'));
app.use('/v1/', require('./routes/mfikria/home-api'));

// New V2
const access = require('./routes/newV2/controllers/accesstokencontroller');

const must = (name, value) => {
    if (typeof value !== 'function') {
        throw new Error(`"${name}" bukan function (tipe: ${typeof value})`);
    }
    return value;
};

app.use('/v2/token', limiter,
    must('accessTokenRoute', require('./routes/newV2/routes/accessTokenRoute')));

app.use('/v2/anime/otaku', limiter,
    must('requireAccessToken', access.requireAccessToken),
    must('otakudesuRoute', require('./routes/newV2/routes/otakudesuRoute')));

app.use('/v2/donghua/anichi', limiter,
    must('requireAccessToken', access.requireAccessToken),
    must('anichinRoute', require('./routes/newV2/routes/anichinRoute')));

// Portfolio
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());
app.use('/mfikria/c/', require('./routes/i/index'));
app.use('/mfikria/p/', limiter, require('./routes/i/fkri_17/api'));
app.use('/mfikria/store', limiter, require('./routes/mfikria/Store/store-file'));
app.use('/mfikria/myhobbies', limiter, require('./routes/mfikria/MyHobbies/MyHobbies-file'));

const upload = multer({ storage: multer.memoryStorage() });

// API routes
app.use('/mfikria/v1', authRoutes);
app.use('/mfikria/v1', feedbackRoutes);
app.get('/mfikria/v1', (req, res) => {
     res.status(200).send({
          succes: true,
          status: 200,
          message: 'Wellcom To Api Mfikria Official'
     });
});

app.get('/', (req, res) => {
     res.status(200).send({
          status: 200,
          message: 'Wellcom To Api Mfikria Official'
     });
});

app.get('/m', (req, res) => {
     const q = req.query.q;
     res.redirect(301, `/u/${encodeURIComponent(q)}`);
});

app.get('/op', (req, res) => {
     const mediaS = req.query.mediaS;
     const name = req.query.name;
     res.redirect(301, `/${mediaS}/${name}?fop=${randomNumber}&value=${randomValue}`);
});

app.get('/github/:name', (req, res) => {
     res.redirect(302, `https://github.com/${req.params.name}`);
});

app.get('/instagram/:name', (req, res) => {
     res.redirect(302, `https://www.instagram.com/${req.params.name}/?hl=en-en`);
});

app.get('/id', function (req, res) {
     res.json({
          mesagger: 'hello'
     });
});

// ---------- 404 (must stay last) ----------
// ---------- 404 (must stay last) ----------
app.use((req, res) => {
     const now = new Date();
     const timeZone = 'Asia/Jakarta'; // WIB

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
     }).replace(/\./g, ':');

     const code = Math.random().toString(36).substring(2, 10);

     res.status(404).json({
          status: 404,
          code_for_message: code,
          TimeStatus: `${hariTanggal} - ${jamFormat}`,
          message: 'error 404 please contact https://mfikria.vercel.app'
     });
});

// ---------- start ----------
// On Vercel the platform handles the port, so only listen when running locally.
if (!process.env.VERCEL) {
     app.listen(PORT, () => {
          console.log(`http://localhost:${PORT}`);
     });
}

module.exports = app; // required for Vercel serverless