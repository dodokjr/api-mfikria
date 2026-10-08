const express = require('express');
const {
  registerUser,
  loginUser,
  logoutUser,
  getFolderPhotos,
  getPhotoAsset,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Daftar foto dari folder Google Drive (butuh Bearer token)
router.get('/photos', getFolderPhotos);

// Stream foto dari Google Drive (butuh ?query=<encryptedQueryToken>)
router.get('/assets/photo/:photoId', getPhotoAsset);

module.exports = router;