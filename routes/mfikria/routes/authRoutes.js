// routes/mfikria/routes/authRoutes.js
// Di-mount di app.js: app.use('/mfikria/v1', authRoutes)
// Route GitHub TIDAK ada di sini: sudah dilayani Githubroutes di app.use('/v2/github', ...)

const express = require('express');
const auth = require('../controllers/authController');
const video = require('../controllers/Videocontroller');
const share = require('../controllers/Sharecontroller');
const guestScope = require('../controllers/Guesttokenparamscontroller'); // guest token per scope (spreadsheet sendiri)

const router = express.Router();

// auth
router.post('/register', auth.registerUser);
router.post('/login', auth.loginUser);
router.post('/logout', auth.logoutUser);
router.get('/photos', auth.getFolderPhotos);
router.get('/photoProfile/:token', auth.getProfilePhoto);
router.get('/assets/photo/:photoId', auth.getProfilePhoto);        // dipakai front end: ?q={token}
router.get('/assets/session-photo/:photoId', auth.getPhotoAsset);  // validasi sesi: ?query={encryptedQueryToken}

// guest token (berlaku 24 jam). Route guest-token TIDAK boleh di belakang pengecekan guest token.
router.post('/guest-token', video.issueGuestToken);                                  // tab GuestTokens (asli)
router.get('/guest-token/status', video.guestTokenStatus);                           // frontend cek token dari sessionStorage masih berlaku atau tidak
router.post('/guest-token/:scope', guestScope.rateLimit, guestScope.createToken);    // params: /guest-token/app, /guest-token/project -> tab GuestTokens_Params

// video (akses lewat guest token)
router.get('/guest-view', video.getGuestView);
router.get('/videos', video.getFolderVideos);              // urutan diacak; &shuffle=0 untuk urutan asli
router.get('/video/:token', video.getVideo);
router.get('/video-info/:token', video.getVideoInfo);
router.post('/video-view/:token', video.registerVideoView);

// share + embed (halaman & stream publik, tanpa guest token)
router.get('/share/:id', share.sharePage);            // halaman share: player + tombol media sosial
router.get('/embed/:id', share.embedPage);            // player polos untuk <iframe>
router.get('/s/:id/stream', share.getSharedVideo);    // stream video bertanda tangan (?e=&s=)
router.post('/s/:id/view', share.registerSharedView); // catat view dari halaman share/embed (?e=&s=)
router.get('/share-info/:id', share.getShareInfo);    // link share + kode iframe (?query=&tgl=)

module.exports = router;