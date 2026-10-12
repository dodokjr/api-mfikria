// Halaman player (HTML) untuk /share/:id dan /embed/:id.
// Simpan di: utilitis/PlayerPage.js  (sejajar dengan Mfikriawebcore.js)
//
// Hanya berisi tampilan: tidak memanggil Drive/database. Controller cukup memanggil
// renderPlayerHtml({ mode, title, views, streamPath, viewPath, share, watch }).

const { escapeHtml } = require('./Mfikriawebcore');

// Link "Video Library" di header halaman share
const FRONTEND_LIBRARY_URL = process.env.FRONTEND_LIBRARY_URL || 'https://mfikria.vercel.app/video';

// Aman dipakai di dalam <script> (mencegah "</script>" dari data)
function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

const ICON = {
  play: '<path d="M8 5v14l11-7z"/>',
  pause: '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>',
  vol: '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z"/>',
  mute: '<path d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16 9l5 6m0-6l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>',
  fs: '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>',
};

const CTRL_BTN =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-pink-500/20 hover:text-pink-400';

// Blok player (video + kontrol kustom bertema hitam-pink), dipakai di mode share maupun embed
function playerBlock({ streamPath, title, embed }) {
  const box = embed
    ? 'h-full w-full'
    : 'aspect-video w-full rounded-2xl ring-1 ring-pink-500/30 shadow-[0_0_60px_-15px_rgba(236,72,153,0.6)]';
  return `<div id="player" class="group relative ${box} overflow-hidden bg-black select-none">
  <video id="v" class="h-full w-full bg-black" src="${escapeHtml(streamPath)}#t=0.1" playsinline preload="metadata" oncontextmenu="return false"></video>

  <button id="big" type="button" aria-label="Putar" class="absolute inset-0 z-[5] flex items-center justify-center">
    <span class="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/40 transition group-hover:scale-110">
      <svg viewBox="0 0 24 24" class="ml-1 h-9 w-9" fill="currentColor">${ICON.play}</svg>
    </span>
  </button>

  <div id="spin" class="pointer-events-none absolute inset-0 z-[6] hidden items-center justify-center">
    <div class="h-12 w-12 animate-spin rounded-full border-4 border-pink-500/30 border-t-pink-500"></div>
  </div>

  <div id="err" class="absolute inset-0 z-20 hidden flex-col items-center justify-center gap-2 bg-black/90 px-4 text-center">
    <p class="text-base font-semibold text-pink-400">Video tidak bisa diputar</p>
    <p class="text-sm text-zinc-400">Link mungkin sudah kedaluwarsa. Muat ulang halaman ini.</p>
  </div>

  <div id="top" class="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/80 to-transparent px-4 pb-10 pt-3">
    <p class="truncate text-sm font-semibold text-white drop-shadow sm:text-base">${escapeHtml(title)}</p>
  </div>

  <div id="bar" class="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2 pt-12">
    <div id="track" class="group/seek relative flex h-4 cursor-pointer touch-none items-center">
      <div class="relative h-1 w-full rounded-full bg-white/25 transition-all group-hover/seek:h-1.5">
        <div id="buf" class="absolute inset-y-0 left-0 w-0 rounded-full bg-white/30"></div>
        <div id="played" class="absolute inset-y-0 left-0 w-0 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"></div>
        <div id="thumb" class="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-pink-500 shadow shadow-pink-500/60 transition group-hover/seek:scale-100"></div>
      </div>
    </div>
    <div class="mt-1 flex items-center gap-1">
      <button id="pp" type="button" aria-label="Putar/Jeda" class="${CTRL_BTN}">
        <svg id="ic-play" viewBox="0 0 24 24" class="h-6 w-6" fill="currentColor">${ICON.play}</svg>
        <svg id="ic-pause" viewBox="0 0 24 24" class="hidden h-6 w-6" fill="currentColor">${ICON.pause}</svg>
      </button>
      <div class="group/vol flex items-center">
        <button id="mute" type="button" aria-label="Suara" class="${CTRL_BTN}">
          <svg id="ic-vol" viewBox="0 0 24 24" class="h-6 w-6" fill="currentColor">${ICON.vol}</svg>
          <svg id="ic-mute" viewBox="0 0 24 24" class="hidden h-6 w-6" fill="currentColor">${ICON.mute}</svg>
        </button>
        <input id="vol" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume"
          class="pink w-0 opacity-0 transition-all focus:ml-1 focus:w-20 focus:opacity-100 group-hover/vol:ml-1 group-hover/vol:w-20 group-hover/vol:opacity-100">
      </div>
      <span id="time" class="ml-2 text-xs tabular-nums text-white/80">0:00 / 0:00</span>
      <div class="ml-auto flex items-center gap-1">
        <button id="speed" type="button" aria-label="Kecepatan" class="h-9 rounded-full px-3 text-xs font-bold text-white/90 transition hover:bg-pink-500/20 hover:text-pink-400">1x</button>
        <button id="fs" type="button" aria-label="Layar penuh" class="${CTRL_BTN}">
          <svg viewBox="0 0 24 24" class="h-6 w-6" fill="currentColor">${ICON.fs}</svg>
        </button>
      </div>
    </div>
  </div>
</div>`;
}

const PLAYER_SCRIPT = (data) => `<script>
(function(){
  var D=${jsonForScript(data)};
  var $=function(id){return document.getElementById(id);};
  var P=$('player'),v=$('v'),big=$('big'),spin=$('spin'),err=$('err'),track=$('track'),played=$('played'),buf=$('buf'),
      thumb=$('thumb'),tm=$('time'),icPlay=$('ic-play'),icPause=$('ic-pause'),icVol=$('ic-vol'),icMute=$('ic-mute'),
      vol=$('vol'),spd=$('speed');
  var sent=false,idleT=null,clickT=null,dragging=false,rates=[1,1.25,1.5,2,0.5],ri=0;

  function fmt(s){
    if(!isFinite(s)||s<0)s=0;
    var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),x=Math.floor(s%60);
    return (h?h+':'+(m<10?'0':''):'')+m+':'+(x<10?'0':'')+x;
  }
  function toggle(){
    if(v.paused||v.ended){var p=v.play();if(p&&p.catch)p.catch(function(){});}
    else v.pause();
  }
  function wake(){
    P.classList.remove('idle');
    clearTimeout(idleT);
    if(!v.paused&&!dragging)idleT=setTimeout(function(){P.classList.add('idle');},2500);
  }
  function ui(){
    var pl=!v.paused&&!v.ended;
    icPlay.classList.toggle('hidden',pl);
    icPause.classList.toggle('hidden',!pl);
    big.classList.toggle('hidden',pl);
    if(pl)wake();else{clearTimeout(idleT);P.classList.remove('idle');}
  }
  function prog(){
    var d=v.duration||0,r=d?v.currentTime/d:0;
    played.style.width=(r*100)+'%';
    thumb.style.left=(r*100)+'%';
    tm.textContent=fmt(v.currentTime)+' / '+fmt(d);
  }
  function buffered(){
    try{
      var d=v.duration||0;
      if(d&&v.buffered.length)buf.style.width=(v.buffered.end(v.buffered.length-1)/d*100)+'%';
    }catch(e){}
  }
  function seekTo(e){
    var r=track.getBoundingClientRect();
    var x=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));
    if(v.duration)v.currentTime=x*v.duration;
    prog();
  }
  function fs(){
    var d=document;
    if(d.fullscreenElement||d.webkitFullscreenElement){(d.exitFullscreen||d.webkitExitFullscreen).call(d);}
    else if(P.requestFullscreen){P.requestFullscreen();}
    else if(P.webkitRequestFullscreen){P.webkitRequestFullscreen();}
    else if(v.webkitEnterFullscreen){v.webkitEnterFullscreen();}
  }

  v.addEventListener('play',ui);
  v.addEventListener('pause',ui);
  v.addEventListener('ended',ui);
  v.addEventListener('loadedmetadata',function(){prog();buffered();});
  v.addEventListener('progress',buffered);
  v.addEventListener('waiting',function(){spin.classList.remove('hidden');spin.classList.add('flex');});
  v.addEventListener('playing',function(){spin.classList.add('hidden');});
  v.addEventListener('canplay',function(){spin.classList.add('hidden');});
  v.addEventListener('error',function(){spin.classList.add('hidden');err.classList.remove('hidden');err.classList.add('flex');});
  v.addEventListener('volumechange',function(){
    var m=v.muted||v.volume===0;
    icVol.classList.toggle('hidden',m);
    icMute.classList.toggle('hidden',!m);
    vol.value=v.muted?0:v.volume;
  });
  v.addEventListener('timeupdate',function(){
    prog();
    if(!sent&&v.currentTime>=5){
      sent=true;
      try{
        fetch(D.viewPath,{method:'POST'})
          .then(function(r){return r.json();})
          .then(function(j){
            var el=$('views');
            if(el&&j&&j.data&&j.data.counted)el.textContent=Number(j.data.views).toLocaleString('id-ID');
          }).catch(function(){});
      }catch(e){}
    }
  });

  big.addEventListener('click',toggle);
  $('pp').addEventListener('click',toggle);
  $('fs').addEventListener('click',fs);
  $('mute').addEventListener('click',function(){v.muted=!v.muted;});
  vol.addEventListener('input',function(){v.muted=false;v.volume=Number(vol.value);});
  spd.addEventListener('click',function(){ri=(ri+1)%rates.length;v.playbackRate=rates[ri];spd.textContent=rates[ri]+'x';});

  // klik 1x = putar/jeda, klik 2x = layar penuh
  v.addEventListener('click',function(){clearTimeout(clickT);clickT=setTimeout(toggle,220);});
  v.addEventListener('dblclick',function(){clearTimeout(clickT);fs();});

  track.addEventListener('pointerdown',function(e){dragging=true;track.setPointerCapture(e.pointerId);seekTo(e);});
  track.addEventListener('pointermove',function(e){if(dragging)seekTo(e);});
  track.addEventListener('pointerup',function(){dragging=false;wake();});
  track.addEventListener('pointercancel',function(){dragging=false;});

  ['mousemove','touchstart'].forEach(function(n){P.addEventListener(n,wake,{passive:true});});
  P.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button');if(b)b.blur();});

  document.addEventListener('keydown',function(e){
    var t=e.target&&e.target.tagName;
    if(t==='INPUT'||t==='TEXTAREA'||t==='BUTTON'||t==='A')return;
    var k=e.key;
    if(k===' '||k==='k'){e.preventDefault();toggle();}
    else if(k==='f'){fs();}
    else if(k==='m'){v.muted=!v.muted;}
    else if(k==='ArrowLeft'){v.currentTime=Math.max(0,v.currentTime-5);}
    else if(k==='ArrowRight'){v.currentTime=Math.min(v.duration||0,v.currentTime+5);}
    else if(k==='j'){v.currentTime=Math.max(0,v.currentTime-10);}
    else if(k==='l'){v.currentTime=Math.min(v.duration||0,v.currentTime+10);}
    else return;
    wake();
  });

  // Salin link / kode iframe
  function copy(text,btn){
    var label=btn.getAttribute('data-label')||btn.textContent;
    btn.setAttribute('data-label',label);
    var done=function(){btn.textContent='Tersalin!';setTimeout(function(){btn.textContent=label;},1500);};
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done,function(){window.prompt('Salin:',text);});
    }else{window.prompt('Salin:',text);}
  }
  var cps=document.querySelectorAll('[data-copy]');
  for(var i=0;i<cps.length;i++){
    (function(b){b.addEventListener('click',function(){copy(D[b.getAttribute('data-copy')],b);});})(cps[i]);
  }
  var ns=$('native');
  if(ns&&navigator.share){
    ns.classList.remove('hidden');
    ns.addEventListener('click',function(){navigator.share({title:D.title,url:D.shareUrl}).catch(function(){});});
  }

  ui();prog();
})();
</script>`;

function renderPlayerHtml({ mode, title, views, streamPath, viewPath, share, watch }) {
  const isEmbed = mode === 'embed';
  const data = { viewPath, shareUrl: share.shareUrl, embedCode: share.embedCode, title };

  const head = `<!doctype html>
<html lang="id"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#000000">
<meta property="og:type" content="video.other">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="Tonton video: ${escapeHtml(title)}">
<meta property="og:url" content="${escapeHtml(share.shareUrl)}">
<meta property="og:video" content="${escapeHtml(share.embedUrl)}">
<meta property="og:video:type" content="text/html">
<meta property="og:video:width" content="1280">
<meta property="og:video:height" content="720">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(title)}">
<script src="https://cdn.tailwindcss.com/3.4.17"></script>
<style>
  html,body{margin:0}
  #bar,#top{transition:opacity .25s}
  #player.idle{cursor:none}
  #player.idle #bar,#player.idle #top{opacity:0;pointer-events:none}
  input[type=range].pink{-webkit-appearance:none;appearance:none;height:4px;border-radius:9999px;background:rgba(255,255,255,.3);outline:none}
  input[type=range].pink::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#ec4899;cursor:pointer}
  input[type=range].pink::-moz-range-thumb{width:12px;height:12px;border:0;border-radius:50%;background:#ec4899;cursor:pointer}
</style>`;

  if (isEmbed) {
    return `${head}
</head><body class="h-screen w-screen overflow-hidden bg-black">
${playerBlock({ streamPath, title, embed: true })}
${PLAYER_SCRIPT(data)}
</body></html>`;
  }

  const s = share.social || {};
  const socials = [
    ['whatsapp', 'WhatsApp'],
    ['facebook', 'Facebook'],
    ['twitter', 'X / Twitter'],
    ['telegram', 'Telegram'],
    ['linkedin', 'LinkedIn'],
  ]
    .filter(([key]) => s[key])
    .map(
      ([key, label]) =>
        `<a href="${escapeHtml(s[key])}" target="_blank" rel="noopener" class="rounded-full border border-pink-500/30 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-pink-500 hover:bg-pink-500 hover:text-black">${label}</a>`
    )
    .join('\n      ');

  const pill =
    'inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-pink-500 hover:bg-pink-500 hover:text-black';
  const pillPrimary =
    'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110';
  const field =
    'min-w-0 flex-1 rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-pink-500';

  return `${head}
</head><body class="min-h-screen bg-black text-zinc-100 antialiased">
<div class="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_40%_at_50%_0%,rgba(236,72,153,0.2),transparent)]"></div>

<header class="sticky top-0 z-30 flex items-center gap-3 border-b border-pink-500/10 bg-black/80 px-4 py-3 backdrop-blur">
  <a href="${escapeHtml(FRONTEND_LIBRARY_URL)}" class="flex items-center gap-2 text-lg font-extrabold tracking-tight">
    <span class="flex h-8 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white">
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor">${ICON.play}</svg>
    </span>
    <span>mfikria<span class="text-pink-500">Video</span></span>
  </a>
  <a href="${escapeHtml(FRONTEND_LIBRARY_URL)}" class="${pill} ml-auto">Video Library</a>
</header>

<main class="mx-auto max-w-5xl px-4 py-6">
  ${playerBlock({ streamPath, title, embed: false })}

  <h1 class="mt-5 text-xl font-bold leading-snug sm:text-2xl">${escapeHtml(title)}</h1>

  <div class="mt-3 flex flex-wrap items-center gap-2">
    <span class="rounded-full bg-zinc-900 px-4 py-2 text-sm text-zinc-300"><b id="views" class="text-pink-400">${(Number(views) || 0).toLocaleString('id-ID')}</b> kali ditonton</span>
    <button id="native" type="button" class="${pillPrimary} hidden">Bagikan</button>
    <button type="button" data-copy="shareUrl" class="${pillPrimary}">Salin link</button>
    <button type="button" data-copy="embedCode" class="${pill}">Salin kode iframe</button>
    <a href="${escapeHtml(watch)}" class="${pill}">Buka di situs</a>
  </div>

  <section class="mt-6 rounded-2xl border border-pink-500/15 bg-zinc-900/60 p-4 sm:p-5">
    <h2 class="text-sm font-bold uppercase tracking-wider text-pink-400">Bagikan video ini</h2>
    <div class="mt-3 flex flex-wrap gap-2">
      ${socials}
    </div>
    <div class="mt-5 space-y-3">
      <div>
        <p class="mb-1 text-xs font-medium text-zinc-400">Link</p>
        <input readonly value="${escapeHtml(share.shareUrl)}" onfocus="this.select()" class="${field} w-full">
      </div>
      <div>
        <p class="mb-1 text-xs font-medium text-zinc-400">Kode embed (iframe)</p>
        <textarea readonly rows="3" onfocus="this.select()" class="${field} w-full resize-none font-mono text-xs">${escapeHtml(share.embedCode)}</textarea>
      </div>
    </div>
  </section>

  <p class="mt-8 text-center text-xs text-zinc-600">Pintasan: spasi/K putar-jeda &bull; F layar penuh &bull; M bisu &bull; &larr; &rarr; geser 5 detik &bull; J/L geser 10 detik</p>
</main>
${PLAYER_SCRIPT(data)}
</body></html>`;
}

module.exports = { renderPlayerHtml };