const express = require('express');
const auth = require('../controllers/authController');
const video = require('../controllers/Videocontroller');

const router = express.Router();

// auth
router.post('/register', auth.registerUser);
router.post('/login', auth.loginUser);
router.post('/logout', auth.logoutUser);
router.get('/photos', auth.getFolderPhotos);
router.get('/photoProfile/:token', auth.getProfilePhoto);
router.get('/assets/photo/:photoId', auth.getProfilePhoto);        // dipakai front end: ?q={token}
router.get('/assets/session-photo/:photoId', auth.getPhotoAsset);  // validasi sesi: ?query={encryptedQueryToken}

// video
router.post('/guest-token', video.issueGuestToken);
router.get('/videos', video.getFolderVideos);
router.get('/video/:token', video.getVideo);
router.get('/video-info/:token', video.getVideoInfo);
router.post('/video-view/:token', video.registerVideoView);

module.exports = router;