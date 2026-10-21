const express = require('express');
const controller = require('../controllers/Githubcontroller');

const router = express.Router();

// Route statis harus di atas '/:user' supaya tidak dianggap username
router.get('/', controller.index);
router.get('/search/users', controller.searchUsers);
router.get('/rate-limit', controller.getRateLimit);
router.get('/l/limit', controller.getRateLimit); // alias lama, tetap didukung

router.get('/:user', controller.getUser);
router.get('/:user/repos', controller.getUserRepos);
router.get('/:user/repos/:repo', controller.getRepo);
router.get('/:user/repos/:repo/events', controller.getRepoEvents);
router.get('/:user/repos/:repo/languages', controller.getRepoLanguages);

module.exports = router;