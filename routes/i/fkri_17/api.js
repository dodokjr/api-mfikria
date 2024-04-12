const express = require('express');
const router = express.Router();
const data = require("../../../data.json")
const anime_list = require("../../../json/history/anime_list.json")
const api_mfikria = require("../../../json/history/api_mfikria.json")
const dodok_store = require("../../../json/history/dodok_store.json")
const token_and_password_random = require("../../../json/history/token_and_password_random.json")
const portofolioTamplate = require("../../../json/history/portofolioTamplate.json")

router.get("/", function (res, req)
{
    req.send(data);
})

router.get("/dodok-store", function (res, req)
{
    req.send(dodok_store);
})

router.get("/token-and-password-random", function (res, req)
{
    req.send(token_and_password_random);
})

router.get("/anime-list", function (res, req)
{
    req.send(anime_list);
})

router.get("/api-mfikria", function (res, req)
{
    req.send(api_mfikria);
})

router.get("/Portofolio-Tamplate", function (res, req)
{
    req.send(portofolioTamplate);
})

router.get("*", function (res, req)
{
    req.status(404).json({ status: 404 });
})

module.exports = router