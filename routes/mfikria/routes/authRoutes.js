const express = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  getFolderPhotos,
  getPhotoAsset,
  getProfilePhoto,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

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

module.exports = router;