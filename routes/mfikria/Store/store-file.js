// Simpan di: routes/mfikria/Store/store-file.js
// Dipasang di index.js:  app.use('/mfikria/store', limiter, require('./routes/mfikria/Store/store-file'));
//
// Endpoint:
//   GET /mfikria/store          -> halaman sambutan
//   GET /mfikria/store/profile  -> profil toko (brand, tim, rating, testimoni)
//   GET /mfikria/store/assets   -> daftar produk
//   GET /mfikria/store/assets/card?slug=lose-brand-horse -> satu produk berdasarkan slug
//   GET /mfikria/store/payment?jumlah=10&harga=50000     -> rincian pembayaran + QRIS + WhatsApp
//        opsional: &slug=lose-brand-horse (produk)  &image=LS1 (gambar)

const express = require('express');

const router = express.Router();

/* ========================= KONFIGURASI ========================= */

// Alamat publik server ini. Bisa diatur lewat env PUBLIC_BASE_URL (sama dengan yang dipakai modul video).
const BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://api-mfikria.vercel.app').replace(/\/+$/, '');
const ASSET_URL = `${BASE_URL}/public/assets/store`;

// Data toko jarang berubah, jadi boleh disimpan CDN 1 jam (hemat Fast Origin Transfer)
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

// Pembayaran
const QRIS_FILE = 'qris'; // -> {BASE_URL}/public/assets/store/qris  (tambahkan ekstensi kalau file-nya, mis. 'qris.jpeg')
// Nomor WhatsApp penjual (bisa diganti lewat env STORE_WHATSAPP tanpa mengubah kode)
const WHATSAPP_NUMBER = process.env.STORE_WHATSAPP || '085727738629';
const MAX_QTY = 1000; // batas jumlah per pesanan
const MAX_UNIT_PRICE = 100000000; // batas harga satuan (Rp)
// STORE_STRICT_PRICE=1 -> harga dari query harus sama dengan harga produk di server (mencegah total diubah-ubah lewat URL)
const STRICT_PRICE = process.env.STORE_STRICT_PRICE === '1';

/* ========================= DATA ========================= */

const PRODUCT_PRICE = 50000; // harga semua produk (Rupiah)
const PRODUCT_CATEGORY = 'T-shirt';
const PRODUCT_RATING = 4.9;

// Cukup isi nama, file gambar, dan slug. Harga, kategori, rating, URL gambar, dan link dibuat otomatis.
const PRODUCTS = [
  { id: 1, name: 'Lose Brand horse', file: 'LS1.jpeg', slug: 'lose-brand-horse' },
  { id: 2, name: 'Lose Brand cowboy', file: 'LS2.jpeg', slug: 'lose-brand-cowboy' },
  { id: 3, name: 'Lose Brand knight', file: 'LS3.jpeg', slug: 'lose-brand-knight' },
  { id: 4, name: 'Lose Brand knight Two', file: 'LS4.jpeg', slug: 'lose-brand-knightTwo' },
];

const BRAND = {
  name: 'Lose Brand',
  logoFile: 'LS_Logo.jpeg',
  deskripsi: 'Toko baju lokal yang mengangkat tema baju sederhana namun terlihat mewah.',
  team: [
    {
      id: 1,
      nama: 'Muhammad Fikri Ardiyansah',
      media_social: [{ id: 1, name: 'Instagram', url: 'https://www.instagram.com/fkri.ardn/' }],
    },
  ],
  rating_toko: 4.9,
  penjualan: 1,
  // nama kunci "keritikSaran" sengaja dipertahankan supaya frontend yang sudah ada tidak rusak
  keritikSaran: [
    {
      id: 1,
      nama: 'Yoyo',
      message: 'Bahan bagus, enak dipakai, halus, dan respon penjual cepat. Top markotop lah!',
      rating: 4.9,
    },
  ],
};

/* ========================= HELPER ========================= */

function toProduct(item) {
  return {
    id: item.id,
    name: item.name,
    category: PRODUCT_CATEGORY,
    price: PRODUCT_PRICE,
    rating: PRODUCT_RATING,
    image: `${ASSET_URL}/${item.file}`,
    slug: `/card?slug=${item.slug}`,
    detail: `/assets/card?slug=${item.slug}`, // endpoint satu produk (lihat router.get('/assets/card'))
  };
}

// Struktur data satu produk di endpoint /assets/card
function toCard(item) {
  return {
    id: item.id,
    name: item.name,
    image: `${ASSET_URL}/${item.file}`,
    rating: PRODUCT_RATING,
    price: PRODUCT_PRICE,
    category: PRODUCT_CATEGORY,
  };
}

// Cari produk dari slug (tidak membedakan huruf besar/kecil). Return undefined kalau tidak ada.
function findBySlug(slug) {
  const key = String(slug).trim().toLowerCase();
  return PRODUCTS.find((item) => item.slug.toLowerCase() === key);
}

// Gambar yang boleh dipilih lewat ?image= : file produk + logo. Kunci = nama tanpa ekstensi, huruf kecil.
const ALLOWED_IMAGES = new Map(
  [...PRODUCTS.map((item) => item.file), BRAND.logoFile].map((file) => [file.replace(/\.[^.]+$/, '').toLowerCase(), file])
);

// "LS1" atau "LS1.jpeg" -> "LS1.jpeg" (undefined kalau bukan gambar toko)
function findImageFile(value) {
  if (typeof value !== 'string') return undefined;
  const key = value.trim().replace(/\.(jpe?g|png|webp)$/i, '').toLowerCase();
  return ALLOWED_IMAGES.get(key);
}

// 0857xxxx -> 62857xxxx (format internasional untuk link wa.me)
function toInternationalPhone(number) {
  const digits = String(number).replace(/\D/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

function rupiah(value) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
}

// Ubah query menjadi bilangan bulat positif (1..max). Return null kalau bukan angka bulat yang valid.
function parsePositiveInt(value, max) {
  if (typeof value !== 'string' || !/^\d{1,12}$/.test(value.trim())) return null;
  const n = Number(value.trim());
  return Number.isSafeInteger(n) && n >= 1 && n <= max ? n : null;
}

function fail(res, code, message) {
  res.setHeader('Cache-Control', 'no-store'); // error tidak boleh tersimpan di CDN
  return res.status(code).json({ status: code, message });
}

function reply(res, payload, cacheControl = CACHE_CONTROL) {
  res.setHeader('Cache-Control', cacheControl);
  return res.status(200).json({ status: 200, ...payload });
}

/* ========================= ENDPOINT ========================= */

router.get('/', (req, res) =>
  reply(res, {
    message: `Selamat datang di ${BASE_URL}/mfikria/store`,
    data: {
      Link1: '/assets',
      link2: '/profile',
    },
  })
);

router.get('/profile', (req, res) =>
  reply(res, {
    Brand: {
      name: BRAND.name,
      Logo: `${ASSET_URL}/${BRAND.logoFile}`,
      deskripsi: BRAND.deskripsi,
      Team: BRAND.team,
      rating_toko: BRAND.rating_toko,
      penjualan: BRAND.penjualan,
      keritikSaran: BRAND.keritikSaran,
    },
  })
);

router.get('/assets', (req, res) =>
  reply(res, {
    data: PRODUCTS.map(toProduct),
  })
);

// GET /assets/card?slug=lose-brand-horse
router.get('/assets/card', (req, res) => {
  const { slug } = req.query;

  if (typeof slug !== 'string' || slug.trim() === '' || slug.length > 100) {
    return fail(res, 400, 'Parameter slug wajib diisi. Contoh: /assets/card?slug=lose-brand-horse');
  }

  const item = findBySlug(slug);
  if (!item) return fail(res, 404, `Produk dengan slug "${slug.slice(0, 60)}" tidak ditemukan.`);

  return reply(res, { data: toCard(item) });
});

// GET /payment?jumlah=10&harga=50000            (opsional: &slug=lose-brand-horse untuk produk tertentu)
//   jumlah = dari query
//   harga  = jumlah x harga (total yang harus dibayar)
//   qris   = gambar QRIS toko
// Tanpa slug, id/name/image diisi data toko (id 0, nama brand, logo).
router.get('/payment', (req, res) => {
  const jumlah = parsePositiveInt(req.query.jumlah, MAX_QTY);
  const hargaSatuan = parsePositiveInt(req.query.harga, MAX_UNIT_PRICE);

  if (jumlah === null || hargaSatuan === null) {
    return fail(
      res,
      400,
      `Parameter jumlah (1-${MAX_QTY}) dan harga (angka bulat) wajib diisi. Contoh: /payment?jumlah=10&harga=50000`
    );
  }

  if (STRICT_PRICE && hargaSatuan !== PRODUCT_PRICE) {
    return fail(res, 400, 'Harga tidak sesuai dengan harga produk.');
  }

  let item = { id: 0, name: BRAND.name, image: `${ASSET_URL}/${BRAND.logoFile}` };
  if (req.query.slug !== undefined) {
    const product = typeof req.query.slug === 'string' ? findBySlug(req.query.slug) : undefined;
    if (!product) return fail(res, 404, 'Produk dengan slug tersebut tidak ditemukan.');
    item = { id: product.id, name: product.name, image: `${ASSET_URL}/${product.file}` };
  }

  // ?image=LS1 -> pakai gambar itu (hanya gambar toko yang dikenal, supaya URL tidak bisa diarahkan ke sembarang file)
  if (req.query.image !== undefined) {
    const file = findImageFile(req.query.image);
    if (!file) return fail(res, 404, 'Gambar tidak ditemukan.');
    item.image = `${ASSET_URL}/${file}`;
  }

  const total = jumlah * hargaSatuan;
  const pesan =
    `Halo ${BRAND.name}, saya sudah melakukan pembayaran.\n` +
    `Produk: ${item.name}\nJumlah: ${jumlah}\nTotal: ${rupiah(total)}\n` +
    'Berikut bukti pembayarannya.';

  // Jumlah dinamis per permintaan: jangan disimpan CDN
  return reply(
    res,
    {
      data: {
        id: item.id,
        name: item.name,
        image: item.image,
        jumlah,
        harga: total,
        qris: `${ASSET_URL}/${QRIS_FILE}`,
        whatsapp: WHATSAPP_NUMBER,
        whatsapp_url: `https://wa.me/${toInternationalPhone(WHATSAPP_NUMBER)}?text=${encodeURIComponent(pesan)}`,
      },
    },
    'no-store'
  );
});

module.exports = router;