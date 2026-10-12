const API_ORIGIN = 'https://api-mfikria.vercel.app';
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Contributors);
} else {
  Contributors();
}