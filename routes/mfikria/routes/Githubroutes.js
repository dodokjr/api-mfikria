const express = require('express');
const github = require('../controllers/Githubcontroller');

const router = express.Router();

// Tanpa token
router.get('/', github.index);

// Semua route di bawah ini: rate limit + wajib Access_Token guest (?query=&tgl=)
router.use(github.rateLimit, github.guestAuth);

router.get('/l/limit', github.getRateLimit);
router.get('/:user', github.getUser);
router.get('/:user/repos', github.getRepos);
router.get('/:user/repos/:reposname', github.getRepo);
router.get('/:user/repos/:reposname/events', github.getRepoEvents);
router.get('/:user/repos/:reposname/languages', github.getRepoLanguages);

module.exports = router;