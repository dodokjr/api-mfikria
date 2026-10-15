"use strict";

const express = require("express");

// Data dipisah ke file JSON agar mudah diedit tanpa menyentuh kode.
const profile = require("./data/Profile.json");
const projects = require("./data/Projects.json");
const mediaSosial = require("./data/Media_sosial.json");
const links = require("./data/Links.json");
const instagram = require("./data/Instagram.json");
const blog = require("./data/Blog.json");

const router = express.Router();

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
const notFound = (res, message = "Data tidak ditemukan") =>
    res.status(404).json({ status: 404, message });

// ---------------------------------------------------------------------------
// Blog: satu sumber data (data/blog.json) untuk /home, /blog, dan detail post.
// Bentuk JSON respons sama seperti sebelumnya.
// ---------------------------------------------------------------------------
const { author: BLOG_AUTHOR, avatars: BLOG_AVATARS, posts: blogPosts } = blog;

const toHomeBlog = (p) => ({
    id: p.id,
    title: p.title,
    descriptions: p.excerpt,
    slug: p.slug,
    img_src: p.img,
    type: p.type,
    postBy: { title: "Posted by", name: BLOG_AUTHOR, img_src: BLOG_AVATARS.home, time: `on ${p.date}` },
});

const toBlogListItem = (p) => ({
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    slug: p.slug,
    img_src: p.img,
    postBy: { title: "Posted by", name: BLOG_AUTHOR, time: `on ${p.date}` },
});

const toBlogDetail = (p) => ({
    postBy: {
        creator: BLOG_AUTHOR,
        img_profile: BLOG_AVATARS.detail,
        status_creator: "Founder Developer",
    },
    title: p.title,
    time_post: p.date,
    subtitle: p.subtitle,
    img_background: p.img,
    content: {
        descriptions: p.descriptions,
        copyright: p.copyright,
        iframe_yt: p.iframe_yt,
    },
});

/** Cari post berdasarkan slug ("post_1") atau id angka ("1"). */
const findBlogPost = (key) =>
    blogPosts.find((p) => p.slug === key || String(p.id) === key);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
router.get("/", (req, res) =>
{
    res.status(200).json({
        status: res.statusCode,
        message: "Selamat datang di api-mfikria.vercel.app/v1/mfikria",
    });
});

router.get("/home", (req, res) =>
{
    res.status(200).json({
        status: res.statusCode,
        data: {
            ...profile,
            project: projects,
            blog: blogPosts.map(toHomeBlog),
            media_sosial: mediaSosial,
        },
    });
});

router.get("/ig", (req, res) =>
{
    res.status(200).json({
        status: res.statusCode,
        owner: instagram.owner,
        data: instagram.data,
    });
});

router.get("/link", (req, res) =>
{
    res.status(200).json({
        status: res.statusCode,
        data: links,
    });
});

// --- Blog ------------------------------------------------------------------
router.get("/blog", (req, res) =>
{
    res.status(200).json({
        status: res.statusCode,
        data: blogPosts.map(toBlogListItem),
    });
});

// Bentuk lama: /blog/post/:id. Menerima id angka maupun slug.
router.get("/blog/post/:id", (req, res) =>
{
    const post = findBlogPost(req.params.id);
    if (!post) return notFound(res, "Post tidak ditemukan");

    res.status(200).json({
        status: res.statusCode,
        id: req.params.id,
        data: toBlogDetail(post),
    });
});

// Bentuk lama dari file kedua: /blog/post_1 ... /blog/post_4.
router.get("/blog/:slug", (req, res) =>
{
    const post = findBlogPost(req.params.slug);
    if (!post) return notFound(res, "Post tidak ditemukan");

    res.status(200).json({
        status: res.statusCode,
        data: toBlogDetail(post),
    });
});

// --- 404 (harus paling akhir) ----------------------------------------------
// router.use dipakai (bukan router.get("/*")) karena pola "/*" tidak valid di Express 5.
router.use((req, res) =>
{
    res.status(404).json({ status: 404, message: "error Page" });
});

module.exports = router;