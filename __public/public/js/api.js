const API_ORIGIN = 'https://api-mfikria.vercel.app';

/* ========================= Guest token (dari API_ORIGIN) ========================= */
// POST {API_ORIGIN}/mfikria/v1/guest-token                    -> buat token baru (berlaku 24 jam)
// GET  {API_ORIGIN}/mfikria/v1/guest-token/status?query=&tgl= -> cek token masih berlaku (data.valid)
// GET  {API_ORIGIN}/mfikria/v1/guest-view                     -> akses video lewat guest token
// Token disimpan di sessionStorage, dicek dulu sebelum dipakai, dan dibuat ulang kalau tidak valid.
// Dipakai lewat guestFetch('/guest-view') (path relatif ke GUEST_BASE): header x-guest-token dan x-guest-date dipasang otomatis.

const GUEST_BASE = `${API_ORIGIN}/mfikria/v1`;
const GUEST_STORAGE_KEY = 'guest_token';
const GUEST_EXPIRY_MARGIN_MS = 60 * 1000; // anggap kedaluwarsa 1 menit lebih awal
let guestPromise = null;

function readGuest() {
  try {
    const raw = sessionStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw);
    return g && g.token && g.tgl ? g : null;
  } catch (e) {
    return null;
  }
}

function saveGuest(g) {
  try {
    sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(g));
  } catch (e) {
    /* sessionStorage tidak tersedia: token tetap dipakai untuk sesi halaman ini */
  }
}

function clearGuest() {
  try {
    sessionStorage.removeItem(GUEST_STORAGE_KEY);
  } catch (e) {
    /* abaikan */
  }
}

async function createGuestToken() {
  const res = await fetch(`${GUEST_BASE}/guest-token`, { method: 'POST', cache: 'no-store' });
  if (!res.ok) throw new Error(`guest-token: HTTP ${res.status}`);

  const json = await res.json();
  const d = json && json.data;
  if (!d || !d.token || !d.tgl) throw new Error('guest-token: respons tidak valid');

  const g = { token: d.token, tgl: d.tgl, expiresAt: d.expiresAt };
  saveGuest(g);
  return g;
}

async function isGuestValid(g) {
  if (!g) return false;
  if (g.expiresAt && Date.now() >= g.expiresAt - GUEST_EXPIRY_MARGIN_MS) return false;

  try {
    const url = `${GUEST_BASE}/guest-token/status?query=${encodeURIComponent(g.token)}&tgl=${encodeURIComponent(g.tgl)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return false;
    const json = await res.json();
    return !!(json && json.data && json.data.valid);
  } catch (e) {
    return false;
  }
}

// Mengembalikan { token, tgl, expiresAt }. Panggilan bersamaan berbagi satu proses.
function getGuestToken(force = false) {
  if (!guestPromise) {
    guestPromise = (async () => {
      const saved = force ? null : readGuest();
      if (await isGuestValid(saved)) return saved;
      return createGuestToken();
    })().finally(() => {
      guestPromise = null;
    });
  }
  return guestPromise;
}

// fetch ke API_ORIGIN dengan guest token. Contoh: const res = await guestFetch('/guest-view');
// Jika server membalas 401, token dibuat ulang lalu request diulang satu kali.
async function guestFetch(path, options = {}) {
  const url = /^https?:\/\//i.test(path) ? path : `${GUEST_BASE}${path}`;
  const send = (g) =>
    fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), 'x-guest-token': g.token, 'x-guest-date': g.tgl },
    });

  let g = await getGuestToken();
  let res = await send(g);
  if (res.status === 401) {
    clearGuest();
    g = await getGuestToken(true);
    res = await send(g);
  }
  return res;
}

/* ========================= Util tampilan ========================= */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRupiah(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

function productCard(item) {
  const link = item.slug ? `${API_ORIGIN}${item.slug}` : '#';
  const price = formatRupiah(item.price);
  const rating = Number(item.rating);

  return `
    <a href="${escapeHtml(link)}" target="_blank" rel="noopener"
       class="group block overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:border-red-600 dark:border-slate-700 dark:bg-slate-800">
      <div class="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy"
             class="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      </div>
      <div class="p-3">
        <p class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(item.category)}</p>
        <h5 class="mt-1 truncate text-sm font-medium text-slate-900 dark:text-white">${escapeHtml(item.name)}</h5>
        <div class="mt-2 flex items-center justify-between text-sm">
          <span class="font-semibold text-red-600">${escapeHtml(price)}</span>
          ${Number.isFinite(rating) ? `<span class="text-slate-500 dark:text-slate-400">&#9733; ${rating}</span>` : ''}
        </div>
      </div>
    </a>
  `;
}

async function testApi() {
  const button = document.getElementById('hidden');
  const loading = document.getElementById('loading');
  const result = document.getElementById('res');

  button.style.display = 'none';
  loading.style.display = 'block';
  result.innerHTML = '';

  try {
    const req = await fetch(`${API_ORIGIN}/mfikria/store/assets`);
    if (!req.ok) throw new Error(`HTTP ${req.status}`);

    const json = await req.json();
    const items = Array.isArray(json.data) ? json.data : [];

    if (items.length === 0) {
      result.innerHTML = '<p class="col-span-full text-sm text-slate-500">Belum ada data.</p>';
    } else {
      result.innerHTML = items.map(productCard).join('');
    }
  } catch (error) {
    console.error('testApi:', error);
    result.innerHTML = '<p class="col-span-full text-sm text-red-600">Gagal memuat data. Coba lagi.</p>';
    button.textContent = 'Coba lagi';
    button.style.display = '';
  } finally {
    loading.style.display = 'none';
  }
}

const CONTRIBUTORS_URL = `${API_ORIGIN}/contributors`;

function contributorCard(c) {
  const name = c.name || c.username || c.login || '';
  const img = c.img_src || c.avatar || c.avatar_url || c.image || '';
  return `
    <div role="listitem" class="relative flex justify-center items-center">
      <a href="${API_ORIGIN}/op?mediaS=github&name=${encodeURIComponent(name)}" target="_blank" rel="noopener">
        <div class="relative h-40 bg-white hover:drop-shadow-2xl w-48 flex justify-center rounded-md">
          <img src="./public/svgs/github.svg" class="absolute top-16 h-6 w-6" alt="github.img" />
          <img src="${escapeHtml(img)}" class="absolute w-20 h-20 -top-8 rounded-full" alt="display avatar" role="img" title="${escapeHtml(name)}" />
          <p class="absolute top-24 text-center text-black">@${escapeHtml(name)}</p>
        </div>
      </a>
    </div>
  `;
}

async function Contributors() {
  const target = document.getElementById('ress');
  if (!target) return;

  try {
    const req = await fetch(CONTRIBUTORS_URL);
    if (!req.ok) throw new Error(`HTTP ${req.status} dari ${CONTRIBUTORS_URL}`);

    const type = req.headers.get('content-type') || '';
    if (!type.includes('application/json')) {
      throw new Error(`Respons bukan JSON (${type || 'tanpa content-type'}) dari ${CONTRIBUTORS_URL}`);
    }

    const json = await req.json();
    const list = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];
    if (list.length === 0) throw new Error('Daftar contributor kosong');

    target.innerHTML = list.map(contributorCard).join('');
  } catch (error) {
    console.error('Contributors:', error.message);
    target.innerHTML = '<p class="text-sm text-slate-500">Daftar contributor belum bisa dimuat.</p>';
  }
}

function init() {
  Contributors();
  // siapkan guest token lebih awal; kegagalan tidak mengganggu halaman
  getGuestToken().catch((error) => console.error('guest-token:', error.message));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}