const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signUp', authController.registerUser);
router.post('/signIn', authController.loginUser);
router.post('/signOut', authController.logoutUser); // baru
router.get('/profile', authController.getFolderPhotos);
router.get('/assets/photo/:photoId', authController.getPhotoAsset);

module.exports = router;