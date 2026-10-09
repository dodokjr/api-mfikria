const express = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  getFolderPhotos,
  getPhotoAsset,
  getProfilePhoto,
  issueGuestToken,
  getFolderVideos,
  getVideo,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Guest token tanpa login (dicatat di tab "GuestTokens" Google Sheet)
// Response: { userId, Access_Token, pukul, tanggal }
router.post('/guest-token', issueGuestToken);

// Daftar foto dari folder Google Drive (butuh Bearer token)
router.get('/photos', getFolderPhotos);

// Foto dari Google Drive:
// - /assets/photo/{photoId}?q={token}          -> avatar; token = googleDrivePhoto.token, divalidasi, gagal -> 404
// - /assets/photo/{photoId}?query=<token sesi> -> galeri Photos (cara lama)
router.get('/assets/photo/:photoId', (req, res, next) => {
  if (typeof req.query.q === 'string' && req.query.q) {
    return getProfilePhoto(req, res, next);
  }
  return getPhotoAsset(req, res, next);
});

// Library video dari folder Google Drive (URL terenkripsi, tanpa Bearer token)
// - /videos         -> daftar semua video + videoToken + videoUrl
// - /video/{token}  -> stream video (mendukung Range/seek)
// Kalau REQUIRE_GUEST_TOKEN_FOR_VIDEO=true, tambahkan header X-Guest-Token atau ?gt=<Access_Token>
router.get('/videos', getFolderVideos);
router.get('/video/:token', getVideo);

module.exports = router;