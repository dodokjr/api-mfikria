"use strict";

const express = require("express");
const crypto = require("crypto");

// Data dipisah ke file JSON agar mudah diedit tanpa menyentuh kode.
const profile = require("./data/Profile.json");
const projects = require("./data/Projects.json");
const mediaSosial = require("./data/Media_sosial.json");
const links = require("./data/Links.json");
const instagram = require("./data/Instagram.json");
const blog = require("./data/Blog.json");

const router = express.Router();

// ---------------------------------------------------------------------------
// Konfigurasi
// ---------------------------------------------------------------------------
const TOKEN_TTL_SEC = 60 * 60 * 24 * 30; // 30 hari

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
const notFound = (res, message = "Data tidak ditemukan") =>
    res.status(404).json({ status: 404, message });

// ---------------------------------------------------------------------------
// Token & redirect (link.me style)
// ---------------------------------------------------------------------------
const SOURCES = {
    instagram: "Instagram",
    x: "X",
    youtube: "YouTube",
    linkedin: "LinkedIn",
    github: "GitHub",
    tiktok: "TikTok",
    whatsapp: "WhatsApp",
    spotify: "Spotify",
};

// Alias singkat untuk URL /visit/:id dan /token/:source.
const ALIASES = {
    ig: "Instagram",
    tw: "x",
    twitter: "x",
    yt: "Youtube",
    gh: "Github",
    li: "Linkedin",
    tt: "Tiktok",
    wa: "Whatsapp",
};

const resolveId = (id) => {
    const key = String(id).toLowerCase();
    return ALIASES[key] || key;
};

const b64 = (s) => Buffer.from(s).toString("base64url");

/** Buat token acak (tanpa secret): berisi sumber, masa berlaku, dan nonce acak. */
const createToken = (source, ttlSec = TOKEN_TTL_SEC) =>
    b64(
        JSON.stringify({
            s: source,
            e: Math.floor(Date.now() / 1000) + ttlSec,
            r: crypto.randomBytes(8).toString("hex"),
        })
    );

/** Kembalikan payload jika bentuknya benar dan belum kedaluwarsa, selain itu null. */
const verifyToken = (token) => {
    if (typeof token !== "string" || !token) return null;

    try {
        const data = JSON.parse(Buffer.from(token, "base64url").toString());
        if (!data || !SOURCES[data.s]) return null;
        return data.e > Math.floor(Date.now() / 1000) ? data : null;
    } catch {
        return null;
    }
};

const greetingFrom = (data) => {
    const label = data && SOURCES[data.s];
    return label ? `Selamat datang, ${label}!` : null;
};

/** Tebak sumber kunjungan dari User-Agent (in-app browser) atau Referer. */
const detectSource = (req) =>
{
    const ua = req.get("user-agent") || "";
    const ref = req.get("referer") || "";

    if (/instagram/i.test(ua) || /instagram\.com/i.test(ref)) return "instagram";
    if (/tiktok|musical_ly|bytedance/i.test(ua) || /tiktok\.com/i.test(ref)) return "tiktok";
    if (/twitter/i.test(ua) || /\/\/(t\.co|x\.com|twitter\.com)/i.test(ref)) return "x";
    if (/youtube/i.test(ua) || /youtube\.com|youtu\.be/i.test(ref)) return "youtube";
    if (/linkedin/i.test(ua) || /linkedin\.com|lnkd\.in/i.test(ref)) return "linkedin";
    if (/whatsapp/i.test(ua) || /whatsapp\.com/i.test(ref)) return "whatsapp";
    if (/github\.com/i.test(ref)) return "github";
    if (/spotify/i.test(ua) || /spotify\.com/i.test(ref)) return "spotify";
    return null;
};

/** Pintu masuk: buat token otomatis lalu redirect ke /link. */
const goHandler = (req, res) =>
{
    const fromPath = req.params.source ? resolveId(req.params.source) : null;
    const source = SOURCES[fromPath] ? fromPath : detectSource(req);

    // Sumber tidak dikenal: tetap ke /link, tanpa sapaan.
    if (!source) return res.redirect(302, `${req.baseUrl}/link`);

    const token = createToken(source, 60 * 60 * 24); // berlaku 1 hari
    res.redirect(302, `${req.baseUrl}/link?href=${token}`);
};

/** Tujuan redirect hanya dari data sendiri, jadi tidak bisa jadi open redirect. */
const findTarget = (id) => {
    const key = resolveId(id);
    if (key === "website") {
        const site = links.profile && links.profile.website;
        return site ? { href: site } : undefined;
    }
    return (links.socials || []).find((s) => s.id === key);
};

// ---------------------------------------------------------------------------
// Blog: satu sumber data (data/blog.json) untuk /home, /blog, dan detail post.
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

// --- Go: link pendek untuk bio ---------------------------------------------
// GET /go/instagram  -> redirect ke /link?href=TOKEN  ("Selamat datang, Instagram!")
// GET /go            -> sumber ditebak otomatis dari User-Agent / Referer
router.get("/link/go", goHandler);
router.get("/link/go/:source", goHandler);

// --- Link (link.me style) --------------------------------------------------
// GET /link?href=TOKEN  -> sapaan sesuai sumber, contoh "Selamat datang, Instagram!"
router.get("/link", (req, res) =>
{
    const token = verifyToken(req.query.href);
    res.status(200).json({
        status: res.statusCode,
        greeting: greetingFrom(token),
        source: token ? token.s : null,
        data: links,
    });
});

// GET /link/youtube, /link/spill, /link/shop, dst.
router.get("/link/:section", (req, res) =>
{
    const section = (links.sections || []).find((s) => s.id === req.params.section);
    if (!section) return notFound(res, "Section tidak ditemukan");

    const token = verifyToken(req.query.href);
    res.status(200).json({
        status: res.statusCode,
        greeting: greetingFrom(token),
        profile: links.profile,
        data: section,
    });
});

// GET /visit/ig?href=TOKEN  -> 302 redirect ke link Instagram
router.get("/link/visit/:id", (req, res) =>
{
    const target = findTarget(req.params.id);
    if (!target) return notFound(res, "Link tidak ditemukan");

    const token = verifyToken(req.query.href);
    if (!token)
        return res
            .status(401)
            .json({ status: 401, message: "Token tidak valid atau kedaluwarsa" });

    console.log(`[visit] ${resolveId(req.params.id)} dari ${token.s}`); // tempat analytics klik
    res.redirect(302, target.href);
});

// GET /token/instagram -> buat token acak baru (tanpa header apa pun)
router.get("/link/token/:source", (req, res) =>
{
    const source = resolveId(req.params.source);
    if (!SOURCES[source]) return notFound(res, "Source tidak dikenal");

    const token = createToken(source);
    res.status(200).json({
        status: res.statusCode,
        source,
        token,
        link_page: `/v1/link?href=${token}`,
        link_visit: `/v1/link/visit/ig?href=${token}`,
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