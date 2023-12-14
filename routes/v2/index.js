const express = require('express');
const router = express.Router();
router.get("/", function (res, req)
{
    req.json({
        "message": "Selamat datang di api-mfikria.vercel.app/v2/",
        "status": json.status
    })
});

module.exports = router