   const { spreadsheetId, sheets } = require('../config/spreadsheetConfig');
   const { defaultFolderId } = require('../config/driveConfig');
   const { APP_TIMEZONE, nowStamp, withLock } = require('../utilitis/Common');
   const {
     API_BASE_PATH,
     VIDEO_REQUIRE_FETCH_DEST,
     VIEWS_SHEET,
     getClientIp,
     getBaseUrl,
     buildShare,
     makeShortId,
     getVideoList,
     resolveVideoId,
     getVideoMeta,
     isAllowedVideo,
     videoTitle,
     createGuestToken,
     readGuestToken,
     getGuestParams,
     checkGuestAccess,
     getViewsMap,
     addView,
     alreadyCounted,
     forgetView,
     streamVideo,
   } = require('../utilitis/Mfikriawebcore');
   
   /* ========================= HELPER ========================= */
   
   // Tanggal upload video mengikuti APP_TIMEZONE (WIB), bukan UTC
   function formatUploadDate(iso) {
     if (!iso) return null;
     const d = new Date(iso);
     if (Number.isNaN(d.getTime())) return null;
     const parts = new Intl.DateTimeFormat('en-GB', {
       timeZone: APP_TIMEZONE,
       day: '2-digit',
       month: '2-digit',
       year: 'numeric',
       hour: '2-digit',
       minute: '2-digit',
       hourCycle: 'h23',
     }).formatToParts(d);
     const get = (type) => parts.find((p) => p.type === type).value;
     return {
       tanggal: `${get('day')}-${get('month')}-${get('year')}`, // 09-10-2026
       pukul: `${get('hour')}:${get('minute')}`,                // 15:35
     };
   }
   
   /* ========================= GUEST TOKEN (tanpa login, dicatat di Google Sheet) ========================= */
   // Kolom tab GuestTokens: A userId | B Access_Token | C tanggal (DDMMYY) | D pukul (HHMM)
   // Buat dulu tab bernama "GuestTokens" (header baris 1: userId, Access_Token, tanggal, pukul)
   // di spreadsheet yang sama. Tanggal & pukul = waktu user masuk ke website.
   
   const GUEST_SHEET = process.env.GUEST_SHEET_NAME || 'GuestTokens';
   const GUEST_TOKEN_TTL_MS = Number(process.env.GUEST_TOKEN_TTL_MS ?? 24 * 60 * 60 * 1000);
   const GUEST_TOKEN_MAX_PER_HOUR = Number(process.env.GUEST_TOKEN_MAX_PER_HOUR ?? 10);
   
   // ID guest urut berdasarkan isi sheet: angka terbesar di kolom A + 1. Contoh: G001, G002, ...
   // Dipanggil di dalam withLock.
   async function nextGuestId() {
     const response = await sheets.spreadsheets.values.get({
       spreadsheetId,
       range: `${GUEST_SHEET}!A2:A`,
     });
     const rows = response.data.values || [];
     const maxNumber = rows.reduce((max, row) => {
       const n = parseInt(String(row[0] || '').replace(/\D/g, ''), 10);
       return Number.isNaN(n) ? max : Math.max(max, n);
     }, 0);
     return `G${String(maxNumber + 1).padStart(3, '0')}`;
   }
   
   // Batasi jumlah token per IP per jam (melindungi kuota Sheets API). In-memory, 1 instance server.
   const guestRate = new Map();
   function guestRateLimited(ip) {
     const now = Date.now();
     if (guestRate.size > 5000) {
       for (const [k, v] of guestRate) if (now > v.resetAt) guestRate.delete(k);
     }
     const entry = guestRate.get(ip);
     if (!entry || now > entry.resetAt) {
       guestRate.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
       return false;
     }
     entry.count += 1;
     return entry.count > GUEST_TOKEN_MAX_PER_HOUR;
   }
   
   const GUEST_VIEW_CACHE_MS = 30 * 1000;
   let guestViewCache = { count: 0, at: 0 };
   
   // POST /guest-token  (tanpa Bearer token, tanpa body)
   // Dipanggil front end saat user pertama kali masuk ke website. Mengembalikan:
   // { userId, Access_Token, pukul, tanggal } dan mencatat baris yang sama di tab "GuestTokens".
   exports.issueGuestToken = async (req, res) => {
     if (guestRateLimited(getClientIp(req))) {
       return res.status(429).json({ status: 'error', message: '429 Too Many Requests: Terlalu banyak permintaan token, coba lagi nanti.' });
     }
   
     try {
       // Baca-lalu-tulis diantre lewat withLock supaya dua guest tidak dapat ID yang sama
       const { userId, accessToken, tgllogin, pukullogin } = await withLock(async () => {
         const userId = await nextGuestId();
         const { tgllogin, pukullogin } = nowStamp();
         const expiresAt = GUEST_TOKEN_TTL_MS > 0 ? Date.now() + GUEST_TOKEN_TTL_MS : 0;
         const accessToken = createGuestToken(userId, tgllogin, expiresAt);
   
         // RAW: "0850" tetap string dan tidak bisa jadi formula
         await sheets.spreadsheets.values.append({
           spreadsheetId,
           range: `${GUEST_SHEET}!A:D`,
           valueInputOption: 'RAW',
           requestBody: { values: [[userId, accessToken, tgllogin, pukullogin]] },
         });
         return { userId, accessToken, tgllogin, pukullogin };
       });
       guestViewCache.at = 0; // guest baru masuk: hitungan /guest-view dibaca ulang
   
       return res.status(200).json({
         status: 'success',
         message: 'Guest token berhasil dibuat.',
         data: {
           userId,
           Access_Token: accessToken,
           pukul: pukullogin,
           tanggal: tgllogin,
         },
       });
     } catch (error) {
       console.error('issueGuestToken:', error.message, error.errors || '');
       const msg = String(error.message || '');
       let hint = null;
       if (/Unable to parse range/i.test(msg)) {
         hint = `Tab Google Sheet "${GUEST_SHEET}" tidak ditemukan. Buat tab dengan nama itu.`;
       } else if (error.code === 403 || /permission|caller does not have/i.test(msg)) {
         hint = 'Service account belum punya akses Editor ke spreadsheet.';
       }
       return res.status(500).json({
         status: 'error',
         message: 'Terjadi kesalahan pada server saat membuat guest token.',
         ...(hint ? { hint } : {}),
       });
     }
   };
   
   // GET /guest-view  -> { status, view } : jumlah baris di tab "GuestTokens" yang kolom A (userId) terisi.
   // Di-cache 30 detik supaya endpoint publik ini tidak menghabiskan kuota Sheets API.
   exports.getGuestView = async (req, res) => {
     try {
       if (guestViewCache.at && Date.now() - guestViewCache.at < GUEST_VIEW_CACHE_MS) {
         return res.status(200).json({ status: 'success', view: guestViewCache.count });
       }
   
       const response = await sheets.spreadsheets.values.get({
         spreadsheetId,
         range: `${GUEST_SHEET}!A2:A`, // lewati header baris 1
       });
       const rows = response.data.values || [];
       const count = rows.filter((row) => row[0] && String(row[0]).trim() !== '').length;
   
       guestViewCache = { count, at: Date.now() };
       return res.status(200).json({ status: 'success', view: count });
     } catch (error) {
       console.error('getGuestView:', error.message, error.errors || '');
       const hint = /Unable to parse range/i.test(String(error.message))
         ? `Tab Google Sheet "${GUEST_SHEET}" tidak ditemukan. Buat tab dengan nama itu.`
         : null;
       return res.status(500).json({
         status: 'error',
         message: 'Terjadi kesalahan pada server saat mengambil jumlah view.',
         ...(hint ? { hint } : {}),
       });
     }
   };
   
   /* ========================= VIDEO (akses lewat guest token, token pendek 10 karakter) ========================= */
   
   // GET /videos?query=&tgl=  -> daftar video + token pendek + tanggal upload + views + info share
   exports.getFolderVideos = async (req, res) => {
     if (!checkGuestAccess(req, res)) return;
   
     if (!defaultFolderId) {
       return res.status(500).json({ status: 'error', message: 'Folder Drive belum dikonfigurasi.' });
     }
   
     try {
       const files = await getVideoList(); // di-cache 60 detik + mengisi index token pendek
       const viewsMap = await getViewsMap(); // views dari tab "VideoViews"
       // URL video langsung bisa diputar: query & tgl milik guest yang memanggil ikut ditempel
       const { q, tgl } = getGuestParams(req);
       const guestSuffix = `?query=${encodeURIComponent(q)}&tgl=${encodeURIComponent(tgl)}`;
       const base = getBaseUrl(req);
   
       return res.status(200).json({
         status: 'success',
         message: 'Berhasil mengambil daftar video.',
         totalVideos: files.length,
         data: files.map((file) => {
           const token = makeShortId(file.id); // 10 karakter, stabil
           const title = file.name.replace(/\.[^.]+$/, ''); // tanpa ekstensi
           return {
             title,
             mimeType: file.mimeType,
             size: Number(file.size) || null,
             videoToken: token,
             views: viewsMap.get(file.id) || 0,
             uploadedAt: file.createdTime || null, // tanggal upload ke Drive (ISO UTC)
             uploadedAtLocal: formatUploadDate(file.createdTime), // { tanggal, pukul } WIB
             videoUrl: `${API_BASE_PATH}/video/${token}${guestSuffix}`, // videoId asli tidak terlihat
             share: buildShare(base, token, title), // { shareUrl, embedUrl, embedCode, social }
             expiresAt: null, // token pendek tidak kedaluwarsa; akses tetap dijaga guest token
           };
         }),
       });
     } catch (error) {
       console.error('getFolderVideos:', error);
       return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mengambil daftar video.' });
     }
   };
   
   // GET /video/:token?query=&tgl=  -> stream video
   exports.getVideo = async (req, res) => {
     const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });
   
     if (!checkGuestAccess(req, res)) return;
   
     try {
       // Tolak hanya kalau header ada dan jelas bukan dari elemen <video>
       const dest = req.headers['sec-fetch-dest'];
       if (VIDEO_REQUIRE_FETCH_DEST && dest && dest !== 'video') return notFound();
   
       const videoId = await resolveVideoId(req.params.token);
       if (!videoId) return notFound();
   
       let meta;
       try {
         meta = await getVideoMeta(videoId); // di-cache, tidak memanggil Drive tiap request Range
       } catch (err) {
         return notFound();
       }
   
       if (!isAllowedVideo(meta) || meta.size === undefined) return notFound();
   
       return await streamVideo(req, res, videoId, meta);
     } catch (error) {
       console.error('getVideo:', error);
       const code = error.code || (error.response && error.response.status);
       if (code === 404) return notFound();
       if (!res.headersSent) {
         return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mengambil video.' });
       }
     }
   };
   
   // GET /video-info/:token?query=&tgl=  -> info video (judul, ukuran, views, tanggal upload, share)
   exports.getVideoInfo = async (req, res) => {
     const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });
   
     if (!checkGuestAccess(req, res)) return;
   
     try {
       const videoId = await resolveVideoId(req.params.token);
       if (!videoId) return notFound();
   
       let file;
       try {
         file = await getVideoMeta(videoId);
       } catch (err) {
         return notFound();
       }
   
       if (!isAllowedVideo(file)) return notFound();
   
       const viewsMap = await getViewsMap();
       const title = videoTitle(file);
   
       return res.status(200).json({
         status: 'success',
         data: {
           title,
           mimeType: file.mimeType,
           size: Number(file.size) || null,
           views: viewsMap.get(videoId) || 0,
           uploadedAt: file.createdTime || null,
           uploadedAtLocal: formatUploadDate(file.createdTime),
           share: buildShare(getBaseUrl(req), req.params.token, title),
           expiresAt: null,
         },
       });
     } catch (error) {
       console.error('getVideoInfo:', error);
       return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan pada server saat mengambil info video.' });
     }
   };
   
   // POST /video-view/:token?query=&tgl=  -> catat 1 view ke Google Sheet (tab "VideoViews")
   // Dipanggil front end SEKALI setelah video benar-benar diputar beberapa detik (bukan tiap request stream).
   exports.registerVideoView = async (req, res) => {
     const notFound = () => res.status(404).json({ status: 'error', message: '404 Not Found' });
   
     if (!checkGuestAccess(req, res)) return;
   
     let guestId = null;
     let videoId = null;
     try {
       videoId = await resolveVideoId(req.params.token);
       if (!videoId) return notFound();
   
       let file;
       try {
         file = await getVideoMeta(videoId);
       } catch (err) {
         return notFound();
       }
   
       if (!isAllowedVideo(file)) return notFound();
   
       const guest = readGuestToken(getGuestParams(req).q);
       guestId = guest.u;
   
       if (alreadyCounted(guestId, videoId)) {
         const map = await getViewsMap();
         return res.status(200).json({ status: 'success', data: { views: map.get(videoId) || 0, counted: false } });
       }
   
       const views = await addView(videoId, videoTitle(file));
       return res.status(200).json({ status: 'success', data: { views, counted: true } });
     } catch (error) {
       if (guestId && videoId) forgetView(guestId, videoId); // gagal tulis: boleh dicoba lagi
       console.error('registerVideoView:', error.message, error.errors || '');
       const hint = /Unable to parse range/i.test(String(error.message))
         ? `Tab Google Sheet "${VIEWS_SHEET}" tidak ditemukan. Buat tab dengan nama itu.`
         : null;
       return res.status(500).json({
         status: 'error',
         message: 'Terjadi kesalahan pada server saat mencatat view.',
         ...(hint ? { hint } : {}),
       });
     }
   };