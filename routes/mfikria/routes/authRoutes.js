// routes/mfikriaRoutes.js
// Di-mount di app: app.use('/mfikria/v1', router)

const express = require('express');
const auth = require('../controllers/authController');
const video = require('../controllers/Videocontroller');
const share = require('../controllers/Sharecontroller');
const guest = require('../controllers/Guesttokencontroller');
const github = require('../controllers/githubController');


const router = express.Router();

// auth
router.post('/register', auth.registerUser);
router.post('/login', auth.loginUser);
router.post('/logout', auth.logoutUser);
router.get('/photos', auth.getFolderPhotos);
router.get('/photoProfile/:token', auth.getProfilePhoto);
router.get('/assets/photo/:photoId', auth.getProfilePhoto);        // dipakai front end: ?q={token}
router.get('/assets/session-photo/:photoId', auth.getPhotoAsset);  // validasi sesi: ?query={encryptedQueryToken}

// guest token (24 jam). Dua route ini TIDAK boleh di belakang pengecekan guest token.
// Menggantikan video.issueGuestToken yang lama (itu penyebab 500: masih memakai createGuestToken versi lama).
router.post('/guest-token', guest.rateLimit, guest.createToken);
router.get('/guest-token/status', guest.status);

// video (akses lewat guest token)
router.get('/guest-view', video.getGuestView);
router.get('/videos', video.getFolderVideos);
router.get('/video/:token', video.getVideo);
router.get('/video-info/:token', video.getVideoInfo);
router.post('/video-view/:token', video.registerVideoView);

// share + embed (halaman & stream publik, tanpa guest token)
router.get('/share/:id', share.sharePage);            // halaman share: player + tombol media sosial
router.get('/embed/:id', share.embedPage);            // player polos untuk <iframe>
router.get('/s/:id/stream', share.getSharedVideo);    // stream video bertanda tangan (?e=&s=)
router.post('/s/:id/view', share.registerSharedView); // catat view dari halaman share/embed (?e=&s=)
router.get('/share-info/:id', share.getShareInfo);    // link share + kode iframe (?query=&tgl=)

// github proxy (wajib guest token valid)
router.get('/v2/github', github.index);
router.get('/v2/github/l/limit', github.rateLimit, github.guestAuth, github.getRateLimit); // sebelum '/:user'
router.get('/v2/github/:user', github.rateLimit, github.guestAuth, github.getUser);
router.get('/v2/github/:user/repos', github.rateLimit, github.guestAuth, github.getRepos);
router.get('/v2/github/:user/repos/:reposname', github.rateLimit, github.guestAuth, github.getRepo);
router.get('/v2/github/:user/repos/:reposname/events', github.rateLimit, github.guestAuth, github.getRepoEvents);
router.get('/v2/github/:user/repos/:reposname/languages', github.rateLimit, github.guestAuth, github.getRepoLanguages);

module.exports = router;