const express = require("express");
const router = express.Router()
const contrroller = require("../controllers/contrrolers.js")

router.get("/users", contrroller.getAll)
router.post("/users", contrroller.createUsers)

module.exports = router