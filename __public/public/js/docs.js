/*
 * docs.js - seluruh isi halaman dokumentasi ada di file ini.
 * docs.html hanya kerangka: memuat file ini lalu menampilkan hasilnya.
 * Untuk menambah / mengubah dokumentasi, edit array SECTIONS di bawah.
 */
(function () {
    'use strict';
  
    var CLS_P = 'mt-2 text-sm text-slate-500 dark:text-slate-400';
  
    /* ------------------------------------------------------------------ */
    /* DATA: setiap seksi = { id, nav (label sidebar), html (isi) }        */
    /* ------------------------------------------------------------------ */
    var SECTIONS = [
      /* ============================ Getting Started ============================ */
      {
        id: 'mulai',
        nav: 'Getting Started',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">Getting Started</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Semua endpoint memakai method yang tertera dan membalas JSON. Respons sukses berisi <code>"status": "success"</code>, respons gagal berisi <code>"status": "error"</code> dan <code>"message"</code>.</p>
  
            <div class="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800">
              <p class="text-slate-600 dark:text-slate-300">Endpoint <code>/v2/anime/otaku</code>, <code>/v2/donghua/anichi</code>, <code>/v2/world</code>, <code>/v2/country</code>, <code>/v2/currencies</code>, <code>/v2/currency</code>, dan <code>/v2/public/github</code> memakai <strong>Access Token</strong> yang dikirim lewat header <code>Authorization: Bearer</code>. Endpoint lain (video, share-info) memakai guest token.</p>
              <a href="./InputToken.html" class="mt-3 inline-block rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Buat Access Token</a>
            </div>
  
            <h3 class="mt-6 text-sm font-semibold">Langkah pertama: dapatkan token</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Sebelum memakai endpoint apa pun yang butuh token (video, share-info), kirim request <code>POST</code> ke URL berikut untuk mendapatkan guest token, lalu <strong>simpan token tersebut</strong>.</p>
            <ul class="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">POST</span> https://api-mfikria.vercel.app/mfikria/v1/guest-token</code><span class="text-slate-500 dark:text-slate-400">Tanpa body dan tanpa header</span></li>
            </ul>
  
            <pre class="mt-3 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>const res = await fetch('https://api-mfikria.vercel.app/mfikria/v1/guest-token', { method: 'POST' });
  const { Access_Token, tanggal } = (await res.json()).data;
  
  // simpan token supaya bisa dipakai ulang
  localStorage.setItem('guest_token', Access_Token);
  localStorage.setItem('guest_tgl', tanggal);</code></pre>
  
            <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">Simpan <code>Access_Token</code> dan <code>tanggal</code> dari respons (misalnya di <code>localStorage</code>, variabel environment, atau database). Token berlaku 24 jam dan dibatasi 10 token per IP per jam, jadi pakai ulang token yang sudah tersimpan dan jangan buat token baru di setiap request. Buat token baru hanya jika belum punya atau sudah kedaluwarsa (dibalas 401).</p>
  
            <h3 class="mt-6 text-sm font-semibold">Base URL</h3>
            <ul class="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0">https://api-mfikria.vercel.app/mfikria/v1</code><span class="text-slate-500 dark:text-slate-400">Guest token, video, share/embed, dan akun</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0">https://api-mfikria.vercel.app/v2/public/github</code><span class="text-slate-500 dark:text-slate-400">GitHub (butuh access token)</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0">https://api-mfikria.vercel.app/v2/anime</code><span class="text-slate-500 dark:text-slate-400">Anime</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0">https://api-mfikria.vercel.app/v2/token</code><span class="text-slate-500 dark:text-slate-400">Access token (buat dan cek status)</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0">https://api-mfikria.vercel.app/v2/anime/otaku</code><span class="text-slate-500 dark:text-slate-400">Anime Otakudesu (butuh access token)</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0">https://api-mfikria.vercel.app/v2/donghua/anichi</code><span class="text-slate-500 dark:text-slate-400">Donghua Anichin (butuh access token)</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0">https://api-mfikria.vercel.app/v2/world</code><span class="text-slate-500 dark:text-slate-400">Ekonomi dunia, semua negara (butuh access token)</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0">https://api-mfikria.vercel.app/v2/country</code><span class="text-slate-500 dark:text-slate-400">Cari satu negara, contoh <code>/v2/country/ID</code> (butuh access token)</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0">https://api-mfikria.vercel.app/v2/currency</code><span class="text-slate-500 dark:text-slate-400">Kurs dan daftar mata uang, termasuk <code>/v2/currencies</code> (butuh access token)</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0">https://api-mfikria.vercel.app/v2/time</code><span class="text-slate-500 dark:text-slate-400">Waktu dunia dan negara, real time (tanpa token)</span></li>
            </ul>
  
            <h3 class="mt-6 text-sm font-semibold">Alur singkat</h3>
            <ol class="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-500 dark:text-slate-400">
              <li>Kirim <code>POST /mfikria/v1/guest-token</code> untuk mendapatkan token, lalu <strong>simpan</strong> <code>Access_Token</code> dan <code>tanggal</code>.</li>
              <li>Tempelkan <code>?query={Access_Token}&amp;tgl={tanggal}</code> pada endpoint yang butuh guest token (video, share-info).</li>
              <li>Pakai ulang token yang tersimpan sampai kedaluwarsa, jangan buat token baru di setiap request.</li>
              <li>Untuk <code>/v2/anime/otaku</code>, <code>/v2/donghua/anichi</code>, dan <code>/v2/public/github</code>, buat Access Token di halaman <a href="./InputToken.html" class="text-red-600 hover:underline">Access Token</a>, lalu kirim di header <code>Authorization: Bearer</code>.</li>
            </ol>
  
            <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">Endpoint publik tanpa token: <code>/guest-token</code>, <code>/guest-view</code>, <code>/share</code>, <code>/embed</code>, <code>/s/{id}/stream</code>, <code>/s/{id}/view</code>, serta <code>POST /v2/token</code> dan <code>GET /v2/token/status</code>, juga seluruh endpoint <code>/v2/time</code>.</p>
  `
      },
  
      /* ============================ Access Token ============================ */
      {
        id: 'token',
        nav: 'Access Token',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">Access Token</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Token untuk memanggil <code>/v2/anime/otaku</code>, <code>/v2/donghua/anichi</code>, <code>/v2/public/github</code>, <code>/v2/world</code>, <code>/v2/country</code>, <code>/v2/currencies</code>, dan <code>/v2/currency</code>. Token berlaku <strong>10 hari</strong> dan setiap token tercatat di Google Sheet (tab <code>AccessTokens</code>). Cara termudah: buat lewat halaman Access Token.</p>
            <a href="./InputToken.html" class="mt-4 inline-block rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Buat Access Token</a>
  
            <ul class="mt-5 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">POST</span> /v2/token</code><span class="text-slate-500 dark:text-slate-400">Buat access token. Body JSON <code>{ "name": "..." }</code>, opsional (teks bebas maksimal 15 karakter, kosong = nama acak 15 karakter)</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/token/status</code><span class="text-slate-500 dark:text-slate-400">Cek token masih berlaku atau tidak (header <code>Authorization: Bearer {token}</code>)</span></li>
            </ul>
  
            <h3 class="mt-6 text-sm font-semibold">Contoh membuat token</h3>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>const API = 'https://api-mfikria.vercel.app';
  
  const res = await fetch(\`\${API}/v2/token\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Budi' }) // opsional, maks 15 karakter
  });
  const { data } = await res.json();
  
  // simpan token dan waktu kedaluwarsanya
  localStorage.setItem('access_token', data.token);
  localStorage.setItem('access_token_exp', String(data.expiresAt));</code></pre>
  
            <h3 class="mt-6 text-sm font-semibold">Contoh respons</h3>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>{
    "status": "success",
    "data": {
      "token": "mfa_Budi_5ad8f0c5c08c1f1700d10164_PgQgYB2EoLQBRSgcN3tECG",
      "id": "acc-1a2b3c4d5e6f",
      "name": "Budi",
      "totalDays": 10,
      "expiresAt": 1792400000000,
      "expiresInMs": 864000000
    }
  }</code></pre>
  
            <h3 class="mt-6 text-sm font-semibold">Cara memakai token</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Kirim token di header <code>Authorization: Bearer</code>. Kalau dibalas <code>401</code> dengan <code>code: "TOKEN_EXPIRED"</code>, buat token baru.</p>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>const token = localStorage.getItem('access_token');
  
  const res = await fetch('https://api-mfikria.vercel.app/v2/donghua/anichi/latest', {
    headers: { Authorization: \`Bearer \${token}\` }
  });
  
  if (res.status === 401) {
    // token kedaluwarsa atau tidak valid: buat token baru
  }</code></pre>
  
            <h3 class="mt-6 text-sm font-semibold">Cek status token</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400"><code>/v2/token/status</code> selalu membalas 200. Baca <code>data.valid</code>; kalau <code>false</code>, <code>data.code</code> berisi alasannya.</p>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>{
    "status": "success",
    "data": {
      "valid": true,
      "id": "acc-1a2b3c4d5e6f",
      "type": "session",
      "name": "Budi",
      "expiresAt": 1792400000000,
      "remainingMs": 863000000,
      "remainingDays": 10
    }
  }</code></pre>
  
            <h3 class="mt-6 text-sm font-semibold">Batasan</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Pembuatan token dibatasi 10 permintaan per menit per IP (lebih dari itu dibalas 429, lihat header <code>Retry-After</code>). Pakai ulang token yang sudah tersimpan sampai kedaluwarsa.</p>
  
            <h3 class="mt-6 text-sm font-semibold">Kode error</h3>
            <ul class="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_MISSING</code><span class="text-slate-500 dark:text-slate-400">Header Authorization kosong</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_INVALID</code><span class="text-slate-500 dark:text-slate-400">Token salah atau tidak dikenali</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_EXPIRED</code><span class="text-slate-500 dark:text-slate-400">Lewat 10 hari, buat token baru</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_REVOKED</code><span class="text-slate-500 dark:text-slate-400">Token dicabut admin</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">429</code><span class="text-slate-500 dark:text-slate-400">Terlalu banyak permintaan</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">503</code><span class="text-slate-500 dark:text-slate-400">Validasi token sementara tidak tersedia, coba lagi sebentar</span></li>
            </ul>
  `
      },
  
      /* ============================ Guest Token ============================ */
      {
        id: 'guest',
        nav: 'Guest Token',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">Guest Token</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Token untuk pengunjung tanpa login. Setiap token tercatat di Google Sheet (tab <code>GuestTokens</code>).</p>
            <ul class="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">POST</span> /mfikria/v1/guest-token</code><span class="text-slate-500 dark:text-slate-400">Buat guest token. Tanpa body dan tanpa header</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /mfikria/v1/guest-view</code><span class="text-slate-500 dark:text-slate-400">Jumlah guest yang pernah masuk (<code>view</code>), di-cache 30 detik</span></li>
            </ul>
            <h3 class="mt-6 text-sm font-semibold">Contoh respons</h3>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>{
    "status": "success",
    "message": "Guest token berhasil dibuat.",
    "data": {
      "userId": "G001",
      "Access_Token": "...",
      "pukul": "1535",
      "tanggal": "091026"
    }
  }</code></pre>
            <h3 class="mt-6 text-sm font-semibold">Cara memakai token</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Kirim sebagai query pada endpoint yang butuh guest token: <code>?query={Access_Token}&amp;tgl={tanggal}</code>, dengan nilai dari respons di atas.</p>
            <h3 class="mt-6 text-sm font-semibold">Batasan</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Maksimal 10 token per IP per jam (lebih dari itu dibalas 429) dan token berlaku 24 jam secara default. Token yang salah atau kedaluwarsa dibalas 401.</p>
            <h3 class="mt-6 text-sm font-semibold">Contoh respons error 401</h3><p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Kalau guest token atau tanggalnya salah atau kedaluwarsa, server membalas 401 seperti ini. <code>renew: true</code> artinya Anda harus membuat guest token baru lalu mengulang request. Pastikan <code>query</code> dan <code>tgl</code> berasal dari respons <strong>yang sama</strong>, dan <code>tgl</code> dikirim persis seperti di respons (contoh <code>091026</code>).</p><pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>{
    "status": "error",
    "code": "GUEST_TOKEN_INVALID",
    "renew": true,
    "message": "401 Unauthorized: guest token atau tanggal tidak valid."
  }</code></pre><h3 class="mt-6 text-sm font-semibold">Contoh perpanjang token otomatis</h3><pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>const API = 'https://api-mfikria.vercel.app';
  
  async function guestFetch(path) {
    let token = localStorage.getItem('guest_token');
    let tgl = localStorage.getItem('guest_tgl');
  
    for (let attempt = 0; attempt &lt; 2; attempt++) {
      if (!token || !tgl) {
        const t = (await (await fetch(\`\${API}/mfikria/v1/guest-token\`, { method: 'POST' })).json()).data;
        token = t.Access_Token;
        tgl = t.tanggal;
        localStorage.setItem('guest_token', token);
        localStorage.setItem('guest_tgl', tgl);
      }
      const sep = path.includes('?') ? '&amp;' : '?';
      const res = await fetch(\`\${API}\${path}\${sep}query=\${encodeURIComponent(token)}&amp;tgl=\${tgl}\`);
      if (res.status !== 401) return res;
      token = tgl = null; // renew: buat token baru lalu ulangi
    }
  }
  
  const res = await guestFetch('/mfikria/v1/videos');</code></pre>
  `
      },
  
      /* ============================ Contoh Kode ============================ */
      {
        id: 'contoh',
        nav: 'Contoh Kode',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">Contoh Kode</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Buat Access Token, lalu pakai di header <code>Authorization: Bearer</code> untuk mengambil 5 repository milik <code>dodokjr</code> lewat <code>/v2/public/github/{nama}/repos</code>. Di aplikasi sungguhan, simpan token dan pakai ulang selama 10 hari, jangan buat token baru di setiap request.</p>
  
            <div class="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200 text-sm dark:border-slate-800">
              <button type="button" data-tab="js" class="-mb-px whitespace-nowrap border-b-2 border-red-600 text-red-600 px-3 py-2 font-medium">JavaScript</button>
              <button type="button" data-tab="ts" class="-mb-px whitespace-nowrap border-b-2 border-transparent text-slate-500 hover:text-red-600 px-3 py-2 font-medium">TypeScript</button>
              <button type="button" data-tab="react" class="-mb-px whitespace-nowrap border-b-2 border-transparent text-slate-500 hover:text-red-600 px-3 py-2 font-medium">React</button>
              <button type="button" data-tab="node" class="-mb-px whitespace-nowrap border-b-2 border-transparent text-slate-500 hover:text-red-600 px-3 py-2 font-medium">Node.js</button>
              <button type="button" data-tab="python" class="-mb-px whitespace-nowrap border-b-2 border-transparent text-slate-500 hover:text-red-600 px-3 py-2 font-medium">Python</button>
              <button type="button" data-tab="go" class="-mb-px whitespace-nowrap border-b-2 border-transparent text-slate-500 hover:text-red-600 px-3 py-2 font-medium">Go</button>
              <button type="button" data-tab="java" class="-mb-px whitespace-nowrap border-b-2 border-transparent text-slate-500 hover:text-red-600 px-3 py-2 font-medium">Java</button>
              <button type="button" data-tab="php" class="-mb-px whitespace-nowrap border-b-2 border-transparent text-slate-500 hover:text-red-600 px-3 py-2 font-medium">PHP</button>
            </div>
  
            <div data-panel="js">
              <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">JavaScript vanilla (di browser)</p>
              <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>const API = 'https://api-mfikria.vercel.app';
  
  async function getRepos() {
    // 1. buat access token
    const tokenRes = await fetch(\`\${API}/v2/token\`, { method: 'POST' });
    const { token } = (await tokenRes.json()).data;
  
    // 2. pakai token di header Authorization
    const res = await fetch(\`\${API}/v2/public/github/dodokjr/repos?per_page=5\`, {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    console.log(await res.json());
  }
  
  getRepos().catch(console.error);</code></pre>
            </div>
  
            <div data-panel="ts" class="hidden">
              <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">TypeScript (Node.js 18+ atau browser, dengan tipe data respons)</p>
              <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>const API = 'https://api-mfikria.vercel.app';
  
  interface Repo {
    id: number;
    name: string;
    html_url: string;
  }
  
  async function getRepos(): Promise&lt;Repo[]&gt; {
    // 1. buat access token
    const tokenRes = await fetch(\`\${API}/v2/token\`, { method: 'POST' });
    const { token } = (await tokenRes.json()).data as { token: string };
  
    // 2. pakai token di header Authorization
    const res = await fetch(\`\${API}/v2/public/github/dodokjr/repos?per_page=5\`, {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  
    return (await res.json()) as Repo[];
  }
  
  getRepos()
    .then((repos) =&gt; repos.forEach((r) =&gt; console.log(r.name)))
    .catch(console.error);</code></pre>
            </div>
  
            <div data-panel="react" class="hidden">
              <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">React (function component + hooks)</p>
              <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>import { useEffect, useState } from 'react';
  
  const API = 'https://api-mfikria.vercel.app';
  
  export default function Repos() {
    const [repos, setRepos] = useState([]);
  
    useEffect(() =&gt; {
      async function load() {
        const tokenRes = await fetch(\`\${API}/v2/token\`, { method: 'POST' });
        const { token } = (await tokenRes.json()).data;
  
        const res = await fetch(\`\${API}/v2/public/github/dodokjr/repos?per_page=5\`, {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        const data = await res.json();
        setRepos(Array.isArray(data) ? data : []);
      }
      load().catch(console.error);
    }, []);
  
    return (
      &lt;ul&gt;
        {repos.map((r) =&gt; (
          &lt;li key={r.id}&gt;{r.name}&lt;/li&gt;
        ))}
      &lt;/ul&gt;
    );
  }</code></pre>
            </div>
  
            <div data-panel="node" class="hidden">
              <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">Node.js 18 atau lebih baru (<code>fetch</code> sudah bawaan)</p>
              <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>const API = 'https://api-mfikria.vercel.app';
  
  async function main() {
    const tokenRes = await fetch(\`\${API}/v2/token\`, { method: 'POST' });
    const { token } = (await tokenRes.json()).data;
  
    const res = await fetch(\`\${API}/v2/public/github/dodokjr/repos?per_page=5\`, {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  
    const repos = await res.json();
    repos.forEach((r) =&gt; console.log(r.name));
  }
  
  main().catch(console.error);</code></pre>
            </div>
  
            <div data-panel="python" class="hidden">
              <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">Python (<code>pip install requests</code>)</p>
              <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>import requests
  
  API = 'https://api-mfikria.vercel.app'
  
  # 1. buat access token
  token = requests.post(f'{API}/v2/token', timeout=10).json()['data']['token']
  
  # 2. pakai token di header Authorization
  res = requests.get(
      f'{API}/v2/public/github/dodokjr/repos',
      params={'per_page': 5},
      headers={'Authorization': f'Bearer {token}'},
      timeout=10,
  )
  res.raise_for_status()
  
  for repo in res.json():
      print(repo['name'])</code></pre>
            </div>
  
            <div data-panel="go" class="hidden">
              <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">Go (hanya library standar)</p>
              <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>package main
  
  import (
      "encoding/json"
      "fmt"
      "log"
      "net/http"
  )
  
  const api = "https://api-mfikria.vercel.app"
  
  func main() {
      // 1. buat access token
      res, err := http.Post(api+"/v2/token", "application/json", nil)
      if err != nil {
          log.Fatal(err)
      }
      defer res.Body.Close()
  
      var tok struct {
          Data struct {
              Token string \`json:"token"\`
          } \`json:"data"\`
      }
      if err := json.NewDecoder(res.Body).Decode(&amp;tok); err != nil {
          log.Fatal(err)
      }
  
      // 2. pakai token di header Authorization
      req, err := http.NewRequest("GET", api+"/v2/public/github/dodokjr/repos?per_page=5", nil)
      if err != nil {
          log.Fatal(err)
      }
      req.Header.Set("Authorization", "Bearer "+tok.Data.Token)
  
      res2, err := http.DefaultClient.Do(req)
      if err != nil {
          log.Fatal(err)
      }
      defer res2.Body.Close()
  
      var repos []struct {
          Name string \`json:"name"\`
      }
      if err := json.NewDecoder(res2.Body).Decode(&amp;repos); err != nil {
          log.Fatal(err)
      }
      for _, r := range repos {
          fmt.Println(r.Name)
      }
  }</code></pre>
            </div>
  
            <div data-panel="java" class="hidden">
              <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">Java 11 atau lebih baru (<code>java.net.http</code> bawaan, tanpa library tambahan)</p>
              <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>import java.net.URI;
  import java.net.http.HttpClient;
  import java.net.http.HttpRequest;
  import java.net.http.HttpResponse;
  import java.util.regex.Matcher;
  import java.util.regex.Pattern;
  
  public class Main {
      static final String API = "https://api-mfikria.vercel.app";
  
      // Ambil nilai string dari JSON sederhana (tanpa library JSON)
      static String find(String json, String key) {
          Matcher m = Pattern.compile("\\"" + key + "\\"\\\\s*:\\\\s*\\"([^\\"]*)\\"").matcher(json);
          if (!m.find()) throw new IllegalStateException("Field tidak ditemukan: " + key);
          return m.group(1);
      }
  
      public static void main(String[] args) throws Exception {
          HttpClient client = HttpClient.newHttpClient();
  
          // 1. buat access token
          HttpRequest tokenReq = HttpRequest.newBuilder()
                  .uri(URI.create(API + "/v2/token"))
                  .POST(HttpRequest.BodyPublishers.noBody())
                  .build();
          String tokenBody = client.send(tokenReq, HttpResponse.BodyHandlers.ofString()).body();
          String token = find(tokenBody, "token");
  
          // 2. pakai token di header Authorization
          HttpRequest reposReq = HttpRequest.newBuilder()
                  .uri(URI.create(API + "/v2/public/github/dodokjr/repos?per_page=5"))
                  .header("Authorization", "Bearer " + token)
                  .GET()
                  .build();
          HttpResponse&lt;String&gt; res = client.send(reposReq, HttpResponse.BodyHandlers.ofString());
          if (res.statusCode() != 200) {
              throw new RuntimeException("HTTP " + res.statusCode());
          }
          System.out.println(res.body());
      }
  }</code></pre>
            </div>
  
            <div data-panel="php" class="hidden">
              <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">PHP 7.4 atau lebih baru (ekstensi <code>curl</code> bawaan, tanpa library tambahan)</p>
              <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>&lt;?php
  $api = 'https://api-mfikria.vercel.app';
  
  function request(string $method, string $url, ?string $token = null): array
  {
      $ch = curl_init($url);
      curl_setopt_array($ch, [
          CURLOPT_CUSTOMREQUEST  =&gt; $method,
          CURLOPT_RETURNTRANSFER =&gt; true,
          CURLOPT_TIMEOUT        =&gt; 10,
          CURLOPT_HTTPHEADER     =&gt; $token ? ["Authorization: Bearer $token"] : [],
      ]);
      $body   = curl_exec($ch);
      $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
      curl_close($ch);
  
      if ($body === false || $status !== 200) {
          throw new RuntimeException("HTTP $status");
      }
      return json_decode($body, true);
  }
  
  // 1. buat access token
  $token = request('POST', "$api/v2/token")['data']['token'];
  
  // 2. pakai token di header Authorization
  $repos = request('GET', "$api/v2/public/github/dodokjr/repos?per_page=5", $token);
  
  foreach ($repos as $repo) {
      echo $repo['name'], PHP_EOL;
  }</code></pre>
            </div>
  `
      },
  
      /* ============================ GitHub ============================ */
      {
        id: 'github',
        nav: 'GitHub',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">GitHub</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Ganti <code>{nama}</code> dengan username GitHub dan <code>{repo}</code> dengan nama repository. Semua endpoint memakai base path <code>/v2/public/github</code> dan butuh <strong>Access Token</strong> lewat header <code>Authorization: Bearer {token}</code> (buat di halaman Access Token), serta dibatasi 60 request per menit per IP.</p>
            <ul class="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/public/github/{nama}</code><span class="text-slate-500 dark:text-slate-400">Profil pengguna</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/public/github/{nama}/repos</code><span class="text-slate-500 dark:text-slate-400">Daftar repository</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/public/github/{nama}/repos/{repo}</code><span class="text-slate-500 dark:text-slate-400">Detail satu repository</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/public/github/{nama}/repos/{repo}/events</code><span class="text-slate-500 dark:text-slate-400">Aktivitas repository</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/public/github/{nama}/repos/{repo}/languages</code><span class="text-slate-500 dark:text-slate-400">Bahasa pemrograman yang dipakai</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/public/github/l/limit</code><span class="text-slate-500 dark:text-slate-400">Sisa kuota GitHub API (limit, remaining, reset)</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/public/github/search/users</code><span class="text-slate-500 dark:text-slate-400">Cari pengguna GitHub (parameter <code>q</code> wajib)</span></li>
            </ul>
            <h3 class="mt-6 text-sm font-semibold">Parameter opsional</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Untuk <code>/repos</code> dan <code>/events</code>: <code>per_page</code> (1&ndash;100) dan <code>page</code> (1&ndash;1000). Contoh: <code>/v2/public/github/dodokjr/repos?per_page=5&amp;page=1</code></p>
            <h3 class="mt-6 text-sm font-semibold">Pencarian pengguna dan filter repository</h3><p class="mt-2 text-sm text-slate-500 dark:text-slate-400"><code>/v2/public/github/search/users</code> menerima <code>q</code> (wajib, maksimal 256 karakter), <code>sort</code> (<code>followers</code>, <code>repositories</code>, atau <code>joined</code>), <code>order</code> (<code>asc</code> atau <code>desc</code>), <code>page</code>, dan <code>per_page</code> (1&ndash;100). Contoh: <code>/v2/public/github/search/users?q=linus&amp;sort=followers&amp;per_page=5</code>. Respons berisi <code>total_count</code>, <code>incomplete_results</code>, dan <code>items</code>.</p><p class="mt-2 text-sm text-slate-500 dark:text-slate-400"><code>/repos</code> juga menerima <code>sort</code> (<code>created</code>, <code>updated</code>, <code>pushed</code>, <code>full_name</code>), <code>direction</code> (<code>asc</code> atau <code>desc</code>), dan <code>type</code> (<code>all</code>, <code>owner</code>, <code>member</code>). Parameter lain diabaikan. Alias <code>/v2/public/github/rate-limit</code> sama dengan <code>/v2/public/github/l/limit</code>.</p><p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Server memakai satu token GitHub milik server, jadi kuota pencarian GitHub (sekitar 30 permintaan per menit) dipakai bersama oleh semua pengguna dan bisa dibalas 429 saat ramai. Data yang tersedia hanya data publik.</p>
            <h3 class="mt-6 text-sm font-semibold">Kode error</h3>
            <ul class="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">400</code><span class="text-slate-500 dark:text-slate-400">Username atau nama repo tidak valid</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_MISSING</code><span class="text-slate-500 dark:text-slate-400">Header Authorization kosong</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_INVALID</code><span class="text-slate-500 dark:text-slate-400">Token salah atau tidak dikenali</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_EXPIRED</code><span class="text-slate-500 dark:text-slate-400">Token lewat 10 hari, buat token baru</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_REVOKED</code><span class="text-slate-500 dark:text-slate-400">Token dicabut admin</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">404</code><span class="text-slate-500 dark:text-slate-400">User atau repository tidak ditemukan</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">429</code><span class="text-slate-500 dark:text-slate-400">Batas request tercapai (server atau GitHub)</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">502</code><span class="text-slate-500 dark:text-slate-400">Gagal mengambil data dari GitHub</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">503</code><span class="text-slate-500 dark:text-slate-400">Validasi token sementara tidak tersedia, coba lagi sebentar</span></li>
            </ul>
            <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">Respons di-cache sekitar 60 detik, jadi data bisa terlambat sedikit dari GitHub.</p>
  `
      },
  
      /* ============================ Video ============================ */
      {
        id: 'video',
        nav: 'Video',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">Video</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Semua endpoint butuh guest token (<code>?query=&amp;tgl=</code>). <code>{token}</code> adalah <code>videoToken</code> (10 karakter) dari daftar video.</p>
            <ul class="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /mfikria/v1/videos</code><span class="text-slate-500 dark:text-slate-400">Daftar video beserta views, tanggal upload, dan info share</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /mfikria/v1/video/{token}</code><span class="text-slate-500 dark:text-slate-400">Stream video (mendukung Range), pakai sebagai <code>src</code> elemen <code>&lt;video&gt;</code></span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /mfikria/v1/video-info/{token}</code><span class="text-slate-500 dark:text-slate-400">Info satu video: judul, ukuran, views, tanggal upload, share</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">POST</span> /mfikria/v1/video-view/{token}</code><span class="text-slate-500 dark:text-slate-400">Catat 1 view. Panggil sekali setelah video diputar beberapa detik</span></li>
            </ul>
            <h3 class="mt-6 text-sm font-semibold">Contoh respons /videos</h3>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>{
    "status": "success",
    "totalVideos": 1,
    "data": [
      {
        "title": "the_weekend_Time",
        "mimeType": "video/mp4",
        "size": 12345678,
        "videoToken": "k4n8lSIppy",
        "views": 0,
        "uploadedAt": "2026-10-09T08:35:00.000Z",
        "uploadedAtLocal": { "tanggal": "09-10-2026", "pukul": "15:35" },
        "videoUrl": "/mfikria/v1/video/k4n8lSIppy?query=...&amp;tgl=...",
        "share": {
          "shareId": "k4n8lSIppy",
          "shareUrl": ".../mfikria/v1/share/k4n8lSIppy",
          "embedUrl": ".../mfikria/v1/embed/k4n8lSIppy",
          "embedCode": "&lt;iframe ...&gt;&lt;/iframe&gt;",
          "social": { "whatsapp": "...", "facebook": "...", "twitter": "...", "telegram": "...", "linkedin": "..." }
        }
      }
    ]
  }</code></pre>
            <h3 class="mt-6 text-sm font-semibold">Catatan</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400"><code>/video-view</code> membalas <code>{ views, counted }</code>. Satu guest hanya dihitung sekali untuk setiap video, jadi <code>counted</code> bernilai <code>false</code> pada panggilan berikutnya.</p>
            <h3 class="mt-6 text-sm font-semibold">Kode error</h3>
            <ul class="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex gap-4 py-2"><code class="w-10 shrink-0 text-red-600 dark:text-red-400">401</code><span class="text-slate-500 dark:text-slate-400">Guest token tidak valid</span></li>
              <li class="flex gap-4 py-2"><code class="w-10 shrink-0 text-red-600 dark:text-red-400">404</code><span class="text-slate-500 dark:text-slate-400">Video tidak ditemukan</span></li>
              <li class="flex gap-4 py-2"><code class="w-10 shrink-0 text-red-600 dark:text-red-400">500</code><span class="text-slate-500 dark:text-slate-400">Terjadi kesalahan di server</span></li>
            </ul>
  `
      },
  
      /* ============================ Share & Embed ============================ */
      {
        id: 'share',
        nav: 'Share &amp; Embed',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">Share &amp; Embed</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400"><code>{id}</code> adalah <code>shareId</code> dari objek <code>share</code> pada daftar video (sama dengan <code>videoToken</code>). Endpoint ini publik, tanpa guest token, kecuali <code>/share-info</code>.</p>
            <ul class="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /mfikria/v1/share/{id}</code><span class="text-slate-500 dark:text-slate-400">Link untuk dibagikan. Langsung diarahkan ke halaman nonton di situs</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /mfikria/v1/embed/{id}</code><span class="text-slate-500 dark:text-slate-400">Player polos untuk <code>&lt;iframe&gt;</code></span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /mfikria/v1/share-info/{id}</code><span class="text-slate-500 dark:text-slate-400">Link share, kode iframe, dan link media sosial satu video (butuh guest token)</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /mfikria/v1/s/{id}/stream</code><span class="text-slate-500 dark:text-slate-400">Stream video bertanda tangan (<code>?e=&amp;s=</code>), dipakai halaman embed</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">POST</span> /mfikria/v1/s/{id}/view</code><span class="text-slate-500 dark:text-slate-400">Catat view dari halaman embed (<code>?e=&amp;s=</code>)</span></li>
            </ul>
            <h3 class="mt-6 text-sm font-semibold">Contoh embed</h3>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>&lt;iframe src="https://api-mfikria.vercel.app/mfikria/v1/embed/k4n8lSIppy" width="640" height="360" frameborder="0" allow="fullscreen; autoplay" allowfullscreen loading="lazy" title="Judul video"&gt;&lt;/iframe&gt;</code></pre>
            <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">Bot media sosial (WhatsApp, Facebook, Telegram, dan lain-lain) tetap mendapat halaman dengan meta Open Graph supaya preview link muncul. Link stream bertanda tangan berlaku 6 jam.</p>
  `
      },
  
      /* ============================ Akun ============================ */
      {
        id: 'akun',
        nav: 'Akun',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">Akun</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Endpoint akun memakai header <code>Authorization: Bearer {token akses}</code> (token akses user atau admin). Body dikirim sebagai JSON.</p>
            <ul class="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">POST</span> /mfikria/v1/register</code><span class="text-slate-500 dark:text-slate-400">Daftar akun. Body: <code>username</code>, <code>password</code>, <code>role</code> (opsional), <code>photoId</code> (opsional)</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">POST</span> /mfikria/v1/login</code><span class="text-slate-500 dark:text-slate-400">Masuk. Body: <code>username</code>, <code>password</code></span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">POST</span> /mfikria/v1/logout</code><span class="text-slate-500 dark:text-slate-400">Keluar. Body: <code>username</code>, <code>encryptedQueryToken</code></span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /mfikria/v1/photos</code><span class="text-slate-500 dark:text-slate-400">Daftar foto di folder Google Drive</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /mfikria/v1/photoProfile/{token}</code><span class="text-slate-500 dark:text-slate-400">Foto profil dari token terenkripsi</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /mfikria/v1/assets/photo/{photoId}?q={token}</code><span class="text-slate-500 dark:text-slate-400">Foto profil dengan <code>photoId</code> dan token</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /mfikria/v1/assets/session-photo/{photoId}?query={encryptedQueryToken}</code><span class="text-slate-500 dark:text-slate-400">Validasi sesi, atau ambil foto. Dengan <code>Accept: application/json</code> hanya data verifikasi</span></li>
            </ul>
            <h3 class="mt-6 text-sm font-semibold">Aturan</h3>
            <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-500 dark:text-slate-400"><li>Username maksimal 50 karakter, password 6&ndash;128 karakter.</li><li>Akun <code>admin</code> hanya bisa dibuat dengan token akses admin.</li><li>Satu akun hanya bisa aktif di satu sesi. Login saat akun masih online dibalas 403.</li><li>Password disimpan sebagai hash (scrypt), bukan teks asli.</li></ul>
            <h3 class="mt-6 text-sm font-semibold">Contoh respons /login</h3>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>{
    "status": "success",
    "message": "Login Berhasil sebagai USER",
    "dashboardData": {
      "profile": { "userId": "U001", "username": "...", "role": "user", "statusLogin": "true",
                   "terakhirLogin": { "tanggal": "...", "pukul": "..." } },
      "permissions": { "canUploadFile": false, "canModifyData": false, "accessLevel": "View Only (User)" },
      "sessionTokens": { "accessToken": "...", "encryptedQueryToken": "..." },
      "googleDrivePhoto": { "photoId": "...", "token": "..." }
    }
  }</code></pre>
            <h3 class="mt-6 text-sm font-semibold">Kode error</h3>
            <ul class="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex gap-4 py-2"><code class="w-10 shrink-0 text-red-600 dark:text-red-400">400</code><span class="text-slate-500 dark:text-slate-400">Data wajib tidak lengkap atau tidak valid</span></li>
              <li class="flex gap-4 py-2"><code class="w-10 shrink-0 text-red-600 dark:text-red-400">403</code><span class="text-slate-500 dark:text-slate-400">Token akses salah, username atau password salah, atau akun sedang online</span></li>
              <li class="flex gap-4 py-2"><code class="w-10 shrink-0 text-red-600 dark:text-red-400">404</code><span class="text-slate-500 dark:text-slate-400">Username tidak ditemukan (logout)</span></li>
              <li class="flex gap-4 py-2"><code class="w-10 shrink-0 text-red-600 dark:text-red-400">500</code><span class="text-slate-500 dark:text-slate-400">Terjadi kesalahan di server</span></li>
            </ul>
  `
      },
  
      /* ============================ Anime ============================ */
      {
        id: 'anime',
        nav: 'Anime',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">Anime</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Endpoint dasar <code>/v2/anime</code> langsung menampilkan halaman home. Masih dalam pengembangan.</p>
            <ul class="mt-4 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0">/v2/anime</code><span class="text-slate-500 dark:text-slate-400">Halaman home</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0">/v2/anime/{query}</code><span class="text-slate-500 dark:text-slate-400">Cari anime, contoh <code>/v2/anime/naruto</code></span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0">/v2/anime/full/{id}</code><span class="text-slate-500 dark:text-slate-400">Detail lengkap anime</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0">/v2/anime/popular</code><span class="text-slate-500 dark:text-slate-400">Anime populer (Top Anime)</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0">/v2/anime/populer/page/{id}</code><span class="text-slate-500 dark:text-slate-400">Anime populer per halaman</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0">/v2/anime/character/{id}</code><span class="text-slate-500 dark:text-slate-400">Karakter anime</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0">/v2/anime/character/people/{id}</code><span class="text-slate-500 dark:text-slate-400">Pengisi suara karakter</span></li>
            </ul>
  `
      },
  
      /* ============================ Otaku & Anichi ============================ */
      {
        id: 'newv2',
        nav: 'Otaku &amp; Anichi',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">Otaku &amp; Anichi</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Anime dari Otakudesu dan donghua dari Anichin. Semua endpoint butuh <strong>Access Token</strong> lewat header <code>Authorization: Bearer {token}</code>. Masih dalam pengembangan.</p>
            <a href="./InputToken.html" class="mt-4 inline-block rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Buat Access Token</a>
  
            <ul class="mt-5 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/anime/otaku</code><span class="text-slate-500 dark:text-slate-400">Anime Otakudesu</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/donghua/anichi</code><span class="text-slate-500 dark:text-slate-400">Donghua Anichin</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/donghua/anichi/latest</code><span class="text-slate-500 dark:text-slate-400">Donghua terbaru</span></li>
            </ul>
  
            <h3 class="mt-6 text-sm font-semibold">Contoh</h3>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>const API = 'https://api-mfikria.vercel.app';
  const token = localStorage.getItem('access_token');
  
  const res = await fetch(\`\${API}/v2/donghua/anichi/latest\`, {
    headers: { Authorization: \`Bearer \${token}\` }
  });
  
  if (res.status === 401) {
    // token kedaluwarsa atau tidak valid: buat token baru
  }
  console.log(await res.json());</code></pre>
  
            <h3 class="mt-6 text-sm font-semibold">Kode error</h3>
            <ul class="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_MISSING</code><span class="text-slate-500 dark:text-slate-400">Header Authorization kosong</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_INVALID</code><span class="text-slate-500 dark:text-slate-400">Token salah atau tidak dikenali</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_EXPIRED</code><span class="text-slate-500 dark:text-slate-400">Token lewat 10 hari, buat token baru</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_REVOKED</code><span class="text-slate-500 dark:text-slate-400">Token dicabut admin</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">429</code><span class="text-slate-500 dark:text-slate-400">Terlalu banyak permintaan</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">503</code><span class="text-slate-500 dark:text-slate-400">Validasi token sementara tidak tersedia, coba lagi sebentar</span></li>
            </ul>
  `
      },
  
      /* ============================ World ============================ */
      {
        id: 'world',
        nav: 'World',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">World</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Data ekonomi semua negara dari World Bank, digabung dalam satu respons. Endpoint ini memakai <strong>Access Token yang sama</strong> dengan Otaku &amp; Anichi, dikirim lewat header <code>Authorization: Bearer {token}</code>. Token berlaku 10 hari dan dibuat lewat halaman Access Token.</p>
            <a href="./InputToken.html" class="mt-4 inline-block rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Buat Access Token</a>
            <div class="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800">
              <p class="text-slate-600 dark:text-slate-300">Berbeda dengan endpoint lain, respons bagian Ekonomi dan Mata Uang (World, Country, Currency) memakai <code>"success": true</code> atau <code>"success": false</code>, bukan <code>"status"</code>.</p>
            </div>
            <h3 class="mt-6 text-sm font-semibold">Endpoint</h3>
            <ul class="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/world</code><span class="text-slate-500 dark:text-slate-400">Semua negara beserta indikator ekonomi, dengan filter, urutan kaya/miskin, dan paginasi</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/world/{kode}</code><span class="text-slate-500 dark:text-slate-400">Satu negara berdasarkan kode (hasilnya sama dengan <code>/v2/country/{kode}</code>)</span></li>
            </ul>
            <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">Setiap negara berisi nama, region, level pendapatan, ibu kota, koordinat, dan indikator: <code>gdp</code> (PDB, US$), <code>gdpPerCapita</code> (PDB per kapita, US$), <code>gdpGrowth</code> (pertumbuhan PDB, %), <code>inflation</code> (inflasi, %), <code>unemployment</code> (pengangguran, %), dan <code>population</code> (populasi). Tiap indikator berisi <code>value</code> dan <code>year</code>, atau <code>null</code> bila datanya tidak ada.</p>
            <h3 class="mt-6 text-sm font-semibold">Parameter /v2/world</h3>
            <ul class="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">q</code><span class="text-slate-500 dark:text-slate-400">Cari berdasarkan nama negara, contoh <code>?q=indo</code></span></li>
              <li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">region</code><span class="text-slate-500 dark:text-slate-400">Filter region, contoh <code>?region=East Asia</code></span></li>
              <li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">incomeLevel</code><span class="text-slate-500 dark:text-slate-400">Filter level pendapatan, contoh <code>?incomeLevel=High</code></span></li>
              <li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">sort</code><span class="text-slate-500 dark:text-slate-400"><code>richest</code> (paling kaya) atau <code>poorest</code> (paling miskin). Hasil diberi nomor <code>rank</code></span></li>
              <li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">by</code><span class="text-slate-500 dark:text-slate-400">Ukuran kaya untuk <code>sort</code>: <code>gdpPerCapita</code> (default) atau <code>gdp</code> (total PDB). Negara tanpa data dibuang dari urutan</span></li>
              <li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">page</code><span class="text-slate-500 dark:text-slate-400">Nomor halaman, bilangan bulat &ge; 1 (default 1)</span></li>
              <li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">limit</code><span class="text-slate-500 dark:text-slate-400">Data per halaman, 1&ndash;250 (default 20). Pakai <code>?limit=250</code> untuk mengambil semua negara sekaligus</span></li>
            </ul>
            <h3 class="mt-6 text-sm font-semibold">Contoh</h3>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>const API = 'https://api-mfikria.vercel.app';
  const token = localStorage.getItem('access_token');
  const headers = { Authorization: \`Bearer \${token}\` };
  
  // 10 negara terkaya (per kapita), halaman 1
  const rich = await fetch(\`\${API}/v2/world?sort=richest&amp;limit=10\`, { headers });
  console.log(await rich.json());
  
  // 5 negara termiskin berdasarkan total PDB, halaman 2
  const poor = await fetch(\`\${API}/v2/world?sort=poorest&amp;by=gdp&amp;page=2&amp;limit=5\`, { headers });
  
  // Negara Eropa, 3 terkaya
  const eu = await fetch(\`\${API}/v2/world?region=Europe&amp;sort=richest&amp;limit=3\`, { headers });
  
  if (rich.status === 401) {
    // token kedaluwarsa atau tidak valid: buat token baru
  }</code></pre>
            <h3 class="mt-6 text-sm font-semibold">Contoh respons</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Nilai pada contoh hanya ilustrasi.</p>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>{
    "success": true,
    "source": "World Bank API v2",
    "sort": "richest",
    "by": "gdpPerCapita",
    "count": 1,
    "pagination": {
      "page": 1, "limit": 1,
      "totalItems": 200, "totalPages": 200,
      "hasPrev": false, "hasNext": true,
      "prevPage": null, "nextPage": 2
    },
    "data": [
      {
        "rank": 1,
        "iso2": "XX", "iso3": "XXX",
        "name": "Nama Negara",
        "region": "Europe &amp; Central Asia",
        "incomeLevel": "High income",
        "capital": "Nama Ibu Kota",
        "longitude": "0.0", "latitude": "0.0",
        "indicators": {
          "gdp":          { "value": 1000000000, "year": "2024" },
          "gdpPerCapita": { "value": 100000,     "year": "2024" },
          "gdpGrowth":    { "value": 2.1,        "year": "2024" },
          "inflation":    { "value": 2.4,        "year": "2024" },
          "unemployment": null,
          "population":   { "value": 10000,      "year": "2024" }
        }
      }
    ]
  }</code></pre>
            <h3 class="mt-6 text-sm font-semibold">Catatan</h3>
            <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-500 dark:text-slate-400">
              <li>Data di-cache 1 jam, jadi nilai bisa sedikit terlambat dari World Bank.</li>
              <li>Indikator memakai nilai terbaru yang tersedia untuk tiap negara, sehingga tahun datanya bisa berbeda-beda. Lihat field <code>year</code>.</li>
              <li><code>rank</code> dihitung sebelum data dipotong per halaman, jadi halaman 2 dengan <code>limit=10</code> dimulai dari peringkat 11.</li>
              <li><code>totalItems</code> mengikuti hasil setelah semua filter diterapkan.</li>
              <li>Halaman yang melewati <code>totalPages</code> membalas <code>data</code> kosong dengan <code>pagination</code> tetap benar.</li>
            </ul>
            <h3 class="mt-6 text-sm font-semibold">Kode error</h3>
            <ul class="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">400</code><span class="text-slate-500 dark:text-slate-400"><code>page</code> bukan bilangan bulat &ge; 1, <code>limit</code> di luar 1&ndash;250, atau <code>sort</code>/<code>by</code> tidak valid</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_MISSING</code><span class="text-slate-500 dark:text-slate-400">Header Authorization kosong</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_INVALID</code><span class="text-slate-500 dark:text-slate-400">Token salah atau tidak dikenali</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_EXPIRED</code><span class="text-slate-500 dark:text-slate-400">Token lewat 10 hari, buat token baru</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_REVOKED</code><span class="text-slate-500 dark:text-slate-400">Token dicabut admin</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">404</code><span class="text-slate-500 dark:text-slate-400">Kode negara tidak ditemukan (<code>/v2/world/{kode}</code>)</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">429</code><span class="text-slate-500 dark:text-slate-400">Terlalu banyak permintaan</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">502</code><span class="text-slate-500 dark:text-slate-400">Gagal mengambil data dari World Bank</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">503</code><span class="text-slate-500 dark:text-slate-400">Validasi token sementara tidak tersedia, coba lagi sebentar</span></li>
            </ul>
  `
      },
  
      /* ============================ Country ============================ */
      {
        id: 'country',
        nav: 'Country',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">Country</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Cari satu negara berdasarkan kode, lengkap dengan indikator ekonominya. Memakai Access Token yang sama dengan bagian World dan Otaku &amp; Anichi (header <code>Authorization: Bearer {token}</code>).</p>
            <ul class="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/country/{kode}</code><span class="text-slate-500 dark:text-slate-400">Data ekonomi satu negara</span></li>
            </ul>
            <h3 class="mt-6 text-sm font-semibold">Kode negara</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400"><code>{kode}</code> bisa kode ISO2 (2 huruf) atau ISO3 (3 huruf), huruf besar atau kecil sama saja.</p>
            <ul class="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/country/ID</code><span class="text-slate-500 dark:text-slate-400">Indonesia</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/country/USA</code><span class="text-slate-500 dark:text-slate-400">Amerika Serikat</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/country/JP</code><span class="text-slate-500 dark:text-slate-400">Jepang</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/country/SGP</code><span class="text-slate-500 dark:text-slate-400">Singapura</span></li>
            </ul>
            <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">Daftar semua negara dan kodenya ada di <code>/v2/world?limit=250</code> (field <code>iso2</code> dan <code>iso3</code>).</p>
            <h3 class="mt-6 text-sm font-semibold">Contoh</h3>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>const API = 'https://api-mfikria.vercel.app';
  const token = localStorage.getItem('access_token');
  const headers = { Authorization: \`Bearer \${token}\` };
  
  const id = await fetch(\`\${API}/v2/country/ID\`, { headers });
  const usa = await fetch(\`\${API}/v2/country/USA\`, { headers });
  
  if (id.status === 404) {
    // kode negara tidak ditemukan
  }
  if (id.status === 401) {
    // token kedaluwarsa atau tidak valid: buat token baru
  }
  
  const { data } = await id.json();
  console.log(data.name, data.indicators.gdpPerCapita);</code></pre>
            <h3 class="mt-6 text-sm font-semibold">Contoh respons</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Nilai pada contoh hanya ilustrasi.</p>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>{
    "success": true,
    "source": "World Bank API v2",
    "data": {
      "iso2": "ID",
      "iso3": "IDN",
      "name": "Indonesia",
      "region": "East Asia &amp; Pacific",
      "incomeLevel": "Upper middle income",
      "capital": "Jakarta",
      "longitude": "106.83",
      "latitude": "-6.19",
      "indicators": {
        "gdp":          { "value": 1000000000000, "year": "2024" },
        "gdpPerCapita": { "value": 5000,          "year": "2024" },
        "gdpGrowth":    { "value": 5.0,           "year": "2024" },
        "inflation":    { "value": 2.0,           "year": "2024" },
        "unemployment": { "value": 5.0,           "year": "2024" },
        "population":   { "value": 280000000,     "year": "2024" }
      }
    }
  }</code></pre>
            <h3 class="mt-6 text-sm font-semibold">Contoh respons jika kode tidak ditemukan</h3>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>{
    "success": false,
    "message": "Negara dengan kode 'ZZ' tidak ditemukan",
    "hint": "Gunakan kode ISO2 (ID, US) atau ISO3 (IDN, USA). Lihat daftar di /v2/world"
  }</code></pre>
            <h3 class="mt-6 text-sm font-semibold">Kode error</h3>
            <ul class="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_MISSING</code><span class="text-slate-500 dark:text-slate-400">Header Authorization kosong</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_INVALID</code><span class="text-slate-500 dark:text-slate-400">Token salah atau tidak dikenali</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_EXPIRED</code><span class="text-slate-500 dark:text-slate-400">Token lewat 10 hari, buat token baru</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_REVOKED</code><span class="text-slate-500 dark:text-slate-400">Token dicabut admin</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">404</code><span class="text-slate-500 dark:text-slate-400">Kode negara tidak ditemukan</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">429</code><span class="text-slate-500 dark:text-slate-400">Terlalu banyak permintaan</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">502</code><span class="text-slate-500 dark:text-slate-400">Gagal mengambil data dari World Bank</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">503</code><span class="text-slate-500 dark:text-slate-400">Validasi token sementara tidak tersedia, coba lagi sebentar</span></li>
            </ul>
  `
      },
  
      /* ============================ Currency ============================ */
      {
        id: 'currency',
        nav: 'Currency',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">Currency</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Kurs dan daftar mata uang dunia dari CurrencyFreaks. Memakai Access Token yang sama dengan bagian World dan Otaku &amp; Anichi (header <code>Authorization: Bearer {token}</code>). Kunci API CurrencyFreaks disimpan di server, jadi client cukup memakai access token Anda.</p>
            <ul class="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/currencies</code><span class="text-slate-500 dark:text-slate-400">Semua mata uang dunia (fiat, logam, dan kripto) beserta kurs terhadap USD. Parameter: <code>q</code> (kode, nama mata uang, atau negara) dan <code>limit</code></span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/currency</code><span class="text-slate-500 dark:text-slate-400">Semua kurs terbaru. Parameter opsional: <code>symbols</code>, contoh <code>?symbols=IDR,EUR,JPY</code></span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/currency/{kode}</code><span class="text-slate-500 dark:text-slate-400">Kurs satu mata uang, contoh <code>/v2/currency/IDR</code> (1 USD = berapa IDR)</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-80 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/currency/convert</code><span class="text-slate-500 dark:text-slate-400">Konversi antar mata uang. Parameter: <code>from</code> (default USD), <code>to</code> (wajib), <code>amount</code> (default 1)</span></li>
            </ul>
            <h3 class="mt-6 text-sm font-semibold">Contoh</h3>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>const API = 'https://api-mfikria.vercel.app';
  const token = localStorage.getItem('access_token');
  const headers = { Authorization: \`Bearer \${token}\` };
  
  // Daftar mata uang, cari berdasarkan nama
  await fetch(\`\${API}/v2/currencies?q=rupiah\`, { headers });
  
  // Kurs beberapa mata uang sekaligus
  await fetch(\`\${API}/v2/currency?symbols=IDR,EUR,JPY\`, { headers });
  
  // Kurs satu mata uang
  await fetch(\`\${API}/v2/currency/IDR\`, { headers });
  
  // Konversi 100 USD ke IDR
  const res = await fetch(\`\${API}/v2/currency/convert?from=USD&amp;to=IDR&amp;amount=100\`, { headers });
  const { data } = await res.json();
  console.log(data.result);</code></pre>
            <h3 class="mt-6 text-sm font-semibold">Contoh respons /v2/currencies</h3>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Nilai pada contoh hanya ilustrasi.</p>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>{
    "success": true,
    "source": "CurrencyFreaks",
    "date": "2026-10-20 08:00:00+00",
    "base": "USD",
    "count": 1,
    "data": [
      {
        "code": "IDR",
        "name": "Indonesian Rupiah",
        "countryCode": "ID",
        "country": "Indonesia",
        "status": "AVAILABLE",
        "icon": "https://...",
        "rate": 16000
      }
    ]
  }</code></pre>
            <h3 class="mt-6 text-sm font-semibold">Contoh respons /v2/currency/convert</h3>
            <pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>{
    "success": true,
    "source": "CurrencyFreaks",
    "date": "2026-10-20 08:00:00+00",
    "base": "USD",
    "data": {
      "from": "USD",
      "to": "IDR",
      "amount": 100,
      "rate": 16000,
      "result": 1600000
    }
  }</code></pre>
            <h3 class="mt-6 text-sm font-semibold">Catatan</h3>
            <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-500 dark:text-slate-400">
              <li>Kurs di-cache 15 menit dan daftar mata uang 24 jam, jadi nilai bisa sedikit terlambat dari sumbernya.</li>
              <li>Kurs dihitung terhadap USD. Konversi antar dua mata uang lain dihitung sebagai kurs silang lewat USD.</li>
              <li>Bila kurs sedang tidak bisa diambil, <code>/v2/currencies</code> tetap membalas daftar mata uang dengan <code>rate</code> bernilai <code>null</code>.</li>
              <li>Daftar mata uang mencakup fiat, logam, dan kripto, jadi jumlahnya jauh lebih banyak dari mata uang resmi negara.</li>
            </ul>
            <h3 class="mt-6 text-sm font-semibold">Kode error</h3>
            <ul class="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">400</code><span class="text-slate-500 dark:text-slate-400"><code>to</code> kosong atau <code>amount</code> bukan angka &ge; 0 (convert)</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_MISSING</code><span class="text-slate-500 dark:text-slate-400">Header Authorization kosong</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_INVALID</code><span class="text-slate-500 dark:text-slate-400">Token salah atau tidak dikenali</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_EXPIRED</code><span class="text-slate-500 dark:text-slate-400">Token lewat 10 hari, buat token baru</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">401 TOKEN_REVOKED</code><span class="text-slate-500 dark:text-slate-400">Token dicabut admin</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">404</code><span class="text-slate-500 dark:text-slate-400">Mata uang tidak ditemukan</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">429</code><span class="text-slate-500 dark:text-slate-400">Terlalu banyak permintaan</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">500</code><span class="text-slate-500 dark:text-slate-400">Kunci API CurrencyFreaks belum dikonfigurasi di server</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">502</code><span class="text-slate-500 dark:text-slate-400">Gagal mengambil data dari CurrencyFreaks</span></li>
              <li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">503</code><span class="text-slate-500 dark:text-slate-400">Validasi token sementara tidak tersedia, coba lagi sebentar</span></li>
            </ul>
  `
      },
  
      /* ============================ Time (baru) ============================ */
      {
        id: 'time',
        nav: 'Time',
        html: `
            <h2 class="text-xl font-semibold tracking-tight">Time</h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Waktu real time seluruh dunia: 419 zona waktu dan negara per zona (contoh Indonesia: WIB, WITA, WIT). Nama hari tersedia dalam 20 bahasa. Endpoint ini <strong>tanpa token</strong>. Respons memakai <code>"success": true</code> atau <code>"success": false</code>, sama seperti bagian World dan Currency.</p>
            <h3 class="mt-6 text-sm font-semibold">Endpoint</h3><ul class="mt-3 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/time/world</code><span class="text-slate-500 dark:text-slate-400">Kota-kota utama dunia</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/time/world/regions</code><span class="text-slate-500 dark:text-slate-400">Daftar region beserta jumlah zona</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/time/world/zones</code><span class="text-slate-500 dark:text-slate-400">Nama seluruh zona waktu (419 zona), dikelompokkan per region</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/time/world/all</code><span class="text-slate-500 dark:text-slate-400">Waktu seluruh zona dunia, paginasi 10 data per halaman</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/time/world/region/{region}</code><span class="text-slate-500 dark:text-slate-400">Semua zona dalam satu region, contoh <code>/v2/time/world/region/Asia</code></span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/time/world/zone?tz=Asia/Jakarta</code><span class="text-slate-500 dark:text-slate-400">Waktu satu zona</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/time/world/stream</code><span class="text-slate-500 dark:text-slate-400">Real time (SSE), 1 detik sekali</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/time/country</code><span class="text-slate-500 dark:text-slate-400">Daftar negara yang tersedia</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/time/country/{kode}</code><span class="text-slate-500 dark:text-slate-400">Semua zona satu negara, contoh <code>/v2/time/country/ID</code></span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/time/country/{kode}/{zona}</code><span class="text-slate-500 dark:text-slate-400">Satu zona, data jadi satu objek, contoh <code>/v2/time/country/ID/WIB</code></span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/time/country/{kode}/stream</code><span class="text-slate-500 dark:text-slate-400">Real time (SSE) semua zona negara</span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/time/country/{kode}/{zona}/stream</code><span class="text-slate-500 dark:text-slate-400">Real time (SSE) satu zona, contoh <code>/v2/time/country/ID/WIB/stream</code></span></li>
              <li class="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"><code class="break-all text-red-600 dark:text-red-400 sm:w-96 sm:shrink-0"><span class="font-semibold text-slate-700 dark:text-slate-300">GET</span> /v2/time/languages</code><span class="text-slate-500 dark:text-slate-400">Daftar bahasa untuk nama hari</span></li>
            </ul>
            <h3 class="mt-6 text-sm font-semibold">Parameter</h3><ul class="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800"><li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">lang</code><span class="text-slate-500 dark:text-slate-400">Bahasa nama hari (default <code>id</code>), berlaku di semua endpoint. Contoh <code>?lang=ja</code></span></li><li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">tz</code><span class="text-slate-500 dark:text-slate-400">Nama zona IANA untuk <code>/world/zone</code> dan <code>/world/stream</code>, contoh <code>Asia/Tokyo</code></span></li><li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">region</code><span class="text-slate-500 dark:text-slate-400">Filter region untuk <code>/world/all</code> dan <code>/world/stream</code>, contoh <code>Europe</code></span></li><li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">search</code><span class="text-slate-500 dark:text-slate-400">Cari nama zona di <code>/world/all</code>, contoh <code>?search=jak</code></span></li><li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">page</code><span class="text-slate-500 dark:text-slate-400">Nomor halaman <code>/world/all</code> (default 1)</span></li><li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">limit</code><span class="text-slate-500 dark:text-slate-400">Data per halaman <code>/world/all</code>, 1&ndash;100 (default 10)</span></li><li class="flex flex-col gap-1 py-2 sm:flex-row sm:gap-6"><code class="w-44 shrink-0 text-red-600 dark:text-red-400">all=true</code><span class="text-slate-500 dark:text-slate-400">Khusus <code>/world/stream</code>: kirim seluruh zona dunia sekaligus</span></li></ul>
            <h3 class="mt-6 text-sm font-semibold">Kode bahasa</h3><p class="mt-2 text-sm text-slate-500 dark:text-slate-400"><code>id</code> Indonesia, <code>en</code> Inggris, <code>zh</code> Mandarin, <code>ar</code> Arab, <code>ja</code> Jepang, <code>ko</code> Korea, <code>es</code> Spanyol, <code>tl</code> Tagalog, <code>ca</code> Katalan, <code>fr</code> Prancis, <code>de</code> Jerman, <code>pt</code> Portugis, <code>it</code> Italia, <code>nl</code> Belanda, <code>ru</code> Rusia, <code>hi</code> Hindi, <code>tr</code> Turki, <code>ms</code> Melayu, <code>th</code> Thai, <code>vi</code> Vietnam. Alias <code>cn</code>, <code>jp</code>, <code>kr</code>, <code>fil</code>, dan format <code>zh-CN</code> atau <code>ja_JP</code> juga diterima. Daftar lengkap beserta nama harinya ada di <code>/v2/time/languages</code>.</p><h3 class="mt-6 text-sm font-semibold">Contoh</h3><pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>const API = 'https://api-mfikria.vercel.app';
  
  // Waktu satu zona (tanpa token)
  const res = await fetch(\`\${API}/v2/time/country/ID/WIB?lang=ja\`);
  const { data } = await res.json();
  console.log(data.day, data.time); // 水曜日 10:35:10
  
  // Seluruh zona dunia, halaman 2, hanya Asia
  await fetch(\`\${API}/v2/time/world/all?region=Asia&amp;page=2\`);
  
  // Real time lewat SSE: server mengirim data baru setiap 1 detik
  const es = new EventSource(\`\${API}/v2/time/country/ID/WIB/stream?lang=en\`);
  es.onmessage = (e) =&gt; {
    const t = JSON.parse(e.data);
    console.log(t.day, t.date, t.time);
  };
  // es.close() kalau sudah tidak dipakai</code></pre><h3 class="mt-6 text-sm font-semibold">Contoh respons /v2/time/country/ID/WIB</h3><p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Nilai pada contoh hanya ilustrasi.</p><pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>{
    "success": true,
    "data": {
      "code": "ID",
      "country": "Indonesia",
      "label": "WIB",
      "timezone": "Asia/Jakarta",
      "utcOffset": "+07:00",
      "day": "Rabu",
      "date": "2026-10-21",
      "time": "10:35:10",
      "datetime": "2026-10-21T10:35:10+07:00",
      "timestamp": 1792553710609
    }
  }</code></pre><h3 class="mt-6 text-sm font-semibold">Contoh respons /v2/time/world/all</h3><pre class="mt-2 overflow-x-auto rounded-md bg-slate-100 p-4 text-sm leading-6 dark:bg-slate-800"><code>{
    "success": true,
    "utc": "2026-10-21T03:35:10.000Z",
    "total": 419,
    "page": 1,
    "limit": 10,
    "totalPages": 42,
    "hasNext": true,
    "hasPrev": false,
    "data": [
      {
        "region": "Africa",
        "city": "Abidjan",
        "timezone": "Africa/Abidjan",
        "utcOffset": "+00:00",
        "day": "Rabu",
        "date": "2026-10-21",
        "time": "03:35:10",
        "datetime": "2026-10-21T03:35:10+00:00",
        "timestamp": 1792553710609
      }
    ]
  }</code></pre><h3 class="mt-6 text-sm font-semibold">Catatan</h3><ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-500 dark:text-slate-400"><li>Endpoint <code>/stream</code> memakai Server-Sent Events. Setiap event adalah objek data langsung (tanpa pembungkus <code>success</code>) dan dikirim 1 detik sekali.</li><li><code>/world/stream?all=true</code> mengirim 419 zona tiap detik (payload besar). Untuk aplikasi, lebih hemat memakai <code>?tz=</code> atau <code>?region=</code>.</li><li>Waktu dan offset mengikuti aturan zona IANA, termasuk pergantian waktu musim panas (DST).</li><li><code>{kode}</code> memakai kode negara ISO2 (contoh <code>ID</code>, <code>US</code>, <code>JP</code>) dan <code>{zona}</code> memakai label zona (contoh <code>WIB</code>, <code>PT</code>), huruf besar atau kecil sama saja. Daftar kode ada di <code>/v2/time/country</code>.</li><li>Yang diterjemahkan hanya nama hari. Nama kota dan negara tetap dalam bahasa Inggris.</li></ul>
            <h3 class="mt-6 text-sm font-semibold">Kode error</h3><ul class="mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800"><li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">400</code><span class="text-slate-500 dark:text-slate-400"><code>tz</code>, <code>region</code>, atau <code>lang</code> tidak valid. Pesan berisi pilihan yang benar</span></li><li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">404</code><span class="text-slate-500 dark:text-slate-400">Negara atau zona tidak ditemukan. Pesan berisi daftar zona yang tersedia untuk negara itu</span></li><li class="flex gap-4 py-2"><code class="w-36 shrink-0 text-red-600 dark:text-red-400">500</code><span class="text-slate-500 dark:text-slate-400">Terjadi kesalahan di server</span></li></ul>
  `
      }
    ];
  
    /* ------------------------------------------------------------------ */
    /* RENDER: sidebar + isi seksi                                         */
    /* ------------------------------------------------------------------ */
    function render() {
      var nav = document.getElementById('docs-nav');
      var main = document.getElementById('docs-content');
      if (!nav || !main) return;
  
      nav.innerHTML = SECTIONS.map(function (s) {
        return '<a href="#' + s.id + '" class="whitespace-nowrap hover:text-red-600">' + s.nav + '</a>';
      }).join('\n');
  
      main.innerHTML = SECTIONS.map(function (s) {
        return '<section id="' + s.id + '" class="scroll-mt-20">' + s.html + '</section>';
      }).join('\n');
  
      var year = document.getElementById('year');
      if (year) year.textContent = new Date().getFullYear();
  
      // Kalau URL punya hash (#time dll), lompat ke seksi setelah konten dirender
      if (location.hash) {
        var target = document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView();
      }
    }
  
    /* ------------------------------------------------------------------ */
    /* Tab "Contoh Kode"                                                   */
    /* ------------------------------------------------------------------ */
    function initTabs() {
      document.querySelectorAll('[data-tab]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var name = btn.getAttribute('data-tab');
  
          document.querySelectorAll('[data-tab]').forEach(function (b) {
            var on = b === btn;
            b.classList.toggle('border-red-600', on);
            b.classList.toggle('text-red-600', on);
            b.classList.toggle('border-transparent', !on);
            b.classList.toggle('text-slate-500', !on);
          });
  
          document.querySelectorAll('[data-panel]').forEach(function (p) {
            p.classList.toggle('hidden', p.getAttribute('data-panel') !== name);
          });
        });
      });
    }
  
    /* ------------------------------------------------------------------ */
    /* Tombol "Salin" di setiap blok kode                                  */
    /* ------------------------------------------------------------------ */
    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
      // Cadangan untuk browser lama / halaman non-HTTPS
      return new Promise(function (resolve, reject) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy') ? resolve() : reject();
        } catch (e) {
          reject(e);
        }
        document.body.removeChild(ta);
      });
    }
  
    function initCopyButtons() {
      document.querySelectorAll('main pre').forEach(function (pre) {
        var code = pre.querySelector('code') || pre;
  
        // Bungkus supaya tombol tetap diam saat kode di-scroll ke samping
        var wrap = document.createElement('div');
        wrap.className = 'relative mt-2';
        pre.classList.remove('mt-2');
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);
  
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Salin';
        btn.setAttribute('aria-label', 'Salin kode');
        btn.className =
          'absolute right-2 top-2 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm hover:text-red-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:text-red-400';
        wrap.appendChild(btn);
  
        var timer;
        btn.addEventListener('click', function () {
          copyText(code.textContent).then(
            function () { btn.textContent = 'Tersalin \u2713'; },
            function () { btn.textContent = 'Gagal'; }
          );
          clearTimeout(timer);
          timer = setTimeout(function () { btn.textContent = 'Salin'; }, 1800);
        });
      });
    }
  
    function start() {
      render();
      initTabs();
      initCopyButtons();
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  })();