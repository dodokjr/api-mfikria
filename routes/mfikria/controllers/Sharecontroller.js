   const crypto = require('crypto');
   const { ADMIN_SECRET_TOKEN, USER_SECRET_TOKEN } = require('../utilitis/Common');
   const {
     API_BASE_PATH,
     VIDEO_REQUIRE_FETCH_DEST,
     escapeHtml,
     getClientIp,
     getBaseUrl,
     buildShare,
     resolveVideoId,
     getVideoMeta,
     isAllowedVideo,
     videoTitle,
     checkGuestAccess,
     getViewsMap,
     addView,
     alreadyCounted,
     forgetView,
     streamVideo,
   } = require('../utilitis/Mfikriawebcore');
   
   /* ========================= HELPER ========================= */
   
   const SHARE_KEY = crypto
     .createHash('sha256')
     .update(process.env.SHARE_SECRET || `share|${ADMIN_SECRET_TOKEN}|${USER_SECRET_TOKEN}`)
     .digest();
   const SHARE_STREAM_TTL_MS = Number(process.env.SHARE_STREAM_TTL_MS ?? 6 * 60 * 60 * 1000);
   // Situs mana yang boleh menyematkan iframe. "*" = semua. Contoh: "https://situsku.com https://blog.com"
   const EMBED_ALLOWED_ORIGINS = process.env.EMBED_ALLOWED_ORIGINS || '*';
   
   function sameString(a, b) {
     const x = Buffer.from(String(a));
     const y = Buffer.from(String(b));
     return x.length === y.length && crypto.timingSafeEqual(x, y);
   }
   
   // Aman dipakai di dalam <script> (mencegah "</script>" dari data)
   function jsonForScript(value) {
     return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
   }
   
   function signShare(shortId, exp) {
     return crypto.createHmac('sha256', SHARE_KEY).update(`${shortId}.${exp}`).digest('base64url').slice(0, 22);
   }
   
   function checkShareSig(req, shortId) {
     const exp = Number(req.query.e);
     const sig = typeof req.query.s === 'string' ? req.query.s : '';
     if (!Number.isFinite(exp) || Date.now() > exp) return false;
     return sameString(sig, signShare(shortId, exp));
   }
   
   function pageNotFound(res) {
     return res.status(404).type('html').send('<!doctype html><meta charset="utf-8"><title>404</title><body style="font-family:sans-serif;text-align:center;padding:48px">404 - Video tidak ditemukan</body>');
   }
   
   /* ========================= HALAMAN PLAYER ========================= */
   
   function renderPlayerHtml({ mode, title, views, streamPath, viewPath, share }) {
     const isEmbed = mode === 'embed';
     const data = { viewPath, shareUrl: share.shareUrl, embedCode: share.embedCode };
   
     const head = `<!doctype html>
   <html lang="id"><head>
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width,initial-scale=1">
   <title>${escapeHtml(title)}</title>
   <meta name="robots" content="noindex">
   <meta property="og:type" content="video.other">
   <meta property="og:title" content="${escapeHtml(title)}">
   <meta property="og:description" content="Tonton video: ${escapeHtml(title)}">
   <meta property="og:url" content="${escapeHtml(share.shareUrl)}">
   <meta property="og:video" content="${escapeHtml(share.embedUrl)}">
   <meta property="og:video:type" content="text/html">
   <meta property="og:video:width" content="1280">
   <meta property="og:video:height" content="720">
   <meta name="twitter:card" content="summary">
   <meta name="twitter:title" content="${escapeHtml(title)}">`;
   
     const script = `<script>
   (function(){
     var D=${jsonForScript(data)};
     var v=document.getElementById('v'),sent=false;
     v.addEventListener('timeupdate',function(){
       if(!sent&&v.currentTime>=5){sent=true;try{fetch(D.viewPath,{method:'POST'}).catch(function(){});}catch(e){}}
     });
     function copy(text,btn){
       var done=function(){var o=btn.textContent;btn.textContent='Tersalin!';setTimeout(function(){btn.textContent=o;},1500);};
       if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){window.prompt('Salin:',text);});}
       else{window.prompt('Salin:',text);}
     }
     var a=document.getElementById('copy-link'),b=document.getElementById('copy-embed');
     if(a)a.onclick=function(){copy(D.shareUrl,a);};
     if(b)b.onclick=function(){copy(D.embedCode,b);};
   })();
   </script>`;
   
     if (isEmbed) {
       return `${head}
   <style>html,body{margin:0;height:100%;background:#000}video{width:100%;height:100%;display:block;background:#000}</style>
   </head><body>
   <video id="v" src="${escapeHtml(streamPath)}" controls playsinline preload="metadata" controlsList="nodownload" oncontextmenu="return false"></video>
   ${script}
   </body></html>`;
     }
   
     const s = share.social;
     return `${head}
   <style>
     body{margin:0;background:#0f1115;color:#e8eaed;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
     .wrap{max-width:900px;margin:0 auto;padding:16px}
     video{width:100%;max-height:70vh;background:#000;border-radius:10px;display:block}
     h1{font-size:1.25rem;margin:16px 0 4px}
     .meta{color:#9aa0a6;font-size:.9rem;margin-bottom:16px}
     .row{display:flex;flex-wrap:wrap;gap:8px}
     a.btn,button.btn{background:#1f2430;color:#e8eaed;border:1px solid #2d3340;border-radius:8px;padding:8px 14px;font-size:.9rem;cursor:pointer;text-decoration:none}
     a.btn:hover,button.btn:hover{background:#2a3040}
   </style>
   </head><body><div class="wrap">
   <video id="v" src="${escapeHtml(streamPath)}" controls playsinline preload="metadata" controlsList="nodownload" oncontextmenu="return false"></video>
   <h1>${escapeHtml(title)}</h1>
   <div class="meta">${Number(views) || 0} views</div>
   <div class="row">
     <a class="btn" target="_blank" rel="noopener" href="${escapeHtml(s.whatsapp)}">WhatsApp</a>
     <a class="btn" target="_blank" rel="noopener" href="${escapeHtml(s.facebook)}">Facebook</a>
     <a class="btn" target="_blank" rel="noopener" href="${escapeHtml(s.twitter)}">X / Twitter</a>
     <a class="btn" target="_blank" rel="noopener" href="${escapeHtml(s.telegram)}">Telegram</a>
     <a class="btn" target="_blank" rel="noopener" href="${escapeHtml(s.linkedin)}">LinkedIn</a>
     <button class="btn" id="copy-link" type="button">Salin link</button>
     <button class="btn" id="copy-embed" type="button">Salin kode iframe</button>
   </div>
   </div>
   ${script}
   </body></html>`;
   }
   
   async function renderSharePage(req, res, mode) {
     try {
       const shortId = req.params.id;
       const videoId = await resolveVideoId(shortId);
       if (!videoId) return pageNotFound(res);
   
       let meta;
       try {
         meta = await getVideoMeta(videoId);
       } catch (err) {
         return pageNotFound(res);
       }
       if (!isAllowedVideo(meta)) return pageNotFound(res);
   
       const exp = Date.now() + SHARE_STREAM_TTL_MS;
       const qs = `?e=${exp}&s=${signShare(shortId, exp)}`;
       const title = videoTitle(meta);
       const viewsMap = await getViewsMap();
   
       const html = renderPlayerHtml({
         mode,
         title,
         views: viewsMap.get(videoId) || 0,
         streamPath: `${API_BASE_PATH}/s/${shortId}/stream${qs}`,
         viewPath: `${API_BASE_PATH}/s/${shortId}/view${qs}`,
         share: buildShare(getBaseUrl(req), shortId, title),
       });
   
       // Boleh disematkan di iframe (atur EMBED_ALLOWED_ORIGINS untuk membatasi)
       res.removeHeader('X-Frame-Options');
       res.setHeader(
         'Content-Security-Policy',
         `default-src 'none'; media-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors ${EMBED_ALLOWED_ORIGINS}`
       );
       res.setHeader('Cache-Control', 'no-cache');
       return res.status(200).type('html').send(html);
     } catch (error) {
       console.error('renderSharePage:', error.message);
       return res.status(500).type('html').send('<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;text-align:center;padding:48px">Terjadi kesalahan pada server.</body>');
     }
   }
   
   /* ========================= ENDPOINT ========================= */
   
   // GET /share/:id  -> halaman publik (player + tombol share + meta Open Graph untuk preview di media sosial)
   exports.sharePage = (req, res) => renderSharePage(req, res, 'share');
   
   // GET /embed/:id  -> halaman player polos, untuk <iframe src="...">
   exports.embedPage = (req, res) => renderSharePage(req, res, 'embed');
   
   // GET /s/:id/stream?e=&s=  -> stream video untuk halaman share/embed (URL bertanda tangan)
   exports.getSharedVideo = async (req, res) => {
     const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });
   
     try {
       const shortId = req.params.id;
       if (!checkShareSig(req, shortId)) return notFound();
   
       const dest = req.headers['sec-fetch-dest'];
       if (VIDEO_REQUIRE_FETCH_DEST && dest && dest !== 'video') return notFound();
   
       const videoId = await resolveVideoId(shortId);
       if (!videoId) return notFound();
   
       let meta;
       try {
         meta = await getVideoMeta(videoId);
       } catch (err) {
         return notFound();
       }
       if (!isAllowedVideo(meta) || meta.size === undefined) return notFound();
   
       return await streamVideo(req, res, videoId, meta);
     } catch (error) {
       console.error('getSharedVideo:', error);
       const code = error.code || (error.response && error.response.status);
       if (code === 404) return notFound();
       if (!res.headersSent) {
         return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mengambil video.' });
       }
     }
   };
   
   // POST /s/:id/view?e=&s=  -> catat 1 view dari halaman share/embed (dedupe per IP)
   exports.registerSharedView = async (req, res) => {
     const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });
   
     let viewerId = null;
     let videoId = null;
     try {
       const shortId = req.params.id;
       if (!checkShareSig(req, shortId)) return notFound();
   
       videoId = await resolveVideoId(shortId);
       if (!videoId) return notFound();
   
       let meta;
       try {
         meta = await getVideoMeta(videoId);
       } catch (err) {
         return notFound();
       }
       if (!isAllowedVideo(meta)) return notFound();
   
       viewerId = `ip:${getClientIp(req)}`;
       if (alreadyCounted(viewerId, videoId)) {
         const map = await getViewsMap();
         return res.status(200).json({ status: 'success', data: { views: map.get(videoId) || 0, counted: false } });
       }
   
       const views = await addView(videoId, videoTitle(meta));
       return res.status(200).json({ status: 'success', data: { views, counted: true } });
     } catch (error) {
       if (viewerId && videoId) forgetView(viewerId, videoId);
       console.error('registerSharedView:', error.message, error.errors || '');
       return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mencatat view.' });
     }
   };
   
   // GET /share-info/:id?query=&tgl=  -> link share, kode iframe, dan link media sosial 1 video (untuk tombol Share di front end)
   exports.getShareInfo = async (req, res) => {
     const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });
   
     if (!checkGuestAccess(req, res)) return;
   
     try {
       const shortId = req.params.id;
       const videoId = await resolveVideoId(shortId);
       if (!videoId) return notFound();
   
       let meta;
       try {
         meta = await getVideoMeta(videoId);
       } catch (err) {
         return notFound();
       }
       if (!isAllowedVideo(meta)) return notFound();
   
       return res.status(200).json({
         status: 'success',
         data: buildShare(getBaseUrl(req), shortId, videoTitle(meta)),
       });
     } catch (error) {
       console.error('getShareInfo:', error);
       return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat membuat link share.' });
     }
   };