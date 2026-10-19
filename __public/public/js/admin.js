// public/js/admin.js
// Halaman admin.html: buat master token memakai admin key.
//   POST /v2/token/master   header Authorization: Bearer <admin key>  -> buat master token
// Admin key dan master token TIDAK disimpan di localStorage; hanya ada di memori halaman.
(function () {
    'use strict';
  
    // Pilih server API:
    //  1. ?api=https://... di URL halaman (untuk uji coba sementara)
    //  2. halaman dibuka dari Cloud Workstations -> server dev di workstation
    //  3. halaman dibuka dari localhost -> server lokal port 5990
    //  4. selain itu -> API produksi
    var API_DEV = 'https://5991-firebase-api-mfikria-1781747502400.cluster-ikxjzjhlifcwuroomfkjrx437g.cloudworkstations.dev';
    var API_PROD = 'https://api-mfikria.vercel.app';
    var isLocal = ['localhost', '127.0.0.1'].indexOf(location.hostname) !== -1;
    var isWorkstation = /\.cloudworkstations\.dev$/.test(location.hostname);
    var apiParam = new URLSearchParams(location.search).get('api');
    var API = (apiParam || (isWorkstation ? API_DEV : isLocal ? 'http://localhost:5990' : API_PROD)).replace(/\/+$/, '');
    var MASTER_URL = API + '/v2/token/master';
  
    var MSG_CLASSES = {
      error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
      success: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300',
    };
  
    function $(id) {
      return document.getElementById(id);
    }
  
    var els = {
      form: $('master-form'),
      key: $('admin-key'),
      name: $('admin-name'),
      toggle: $('toggle-admin'),
      submit: $('submit-btn'),
      msg: $('message'),
      result: $('result'),
      box: $('master-box'),
      meta: $('meta'),
      metaId: $('meta-id'),
      metaExp: $('meta-expires'),
      hide: $('hide-btn'),
    };
  
    function showMsg(kind, text) {
      els.msg.className = 'mt-4 rounded-md border px-3 py-2 text-sm ' + MSG_CLASSES[kind];
      els.msg.textContent = text;
    }
  
    function clearMsg() {
      els.msg.className = 'hidden';
      els.msg.textContent = '';
    }
  
    function formatWIB(ms) {
      return (
        new Date(ms).toLocaleString('id-ID', {
          timeZone: 'Asia/Jakarta',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB'
      );
    }
  
    function errorText(res, body) {
      var code = body && body.code;
      if (res.status === 429) {
        var wait = res.headers.get('Retry-After');
        return 'Terlalu banyak permintaan.' + (wait ? ' Coba lagi dalam ' + wait + ' detik.' : ' Coba lagi beberapa menit lagi.');
      }
      if (res.status === 401 || res.status === 403 || code === 'ADMIN_INVALID') {
        return 'Admin key salah untuk server ' + API + '. Cek ADMIN_KEY di server itu.';
      }
      if (res.status === 503) return 'Layanan sementara tidak tersedia. Coba lagi sebentar.';
      return (body && body.message) || 'Gagal membuat master token (HTTP ' + res.status + ').';
    }
  
    function hideResult() {
      els.box.textContent = '';
      els.result.classList.add('hidden');
    }
  
    async function createMaster() {
      var key = els.key.value.trim();
      if (!key) {
        showMsg('error', 'Isi admin key terlebih dahulu.');
        els.key.focus();
        return;
      }
  
      var name = (els.name.value.trim() || 'Admin').slice(0, 15);
  
      clearMsg();
      hideResult();
      els.submit.disabled = true;
      els.submit.textContent = 'Membuat master token...';
  
      try {
        var res = await fetch(MASTER_URL, {
          method: 'POST',
          headers: { 'x-admin-key': key, 'Content-Type': 'application/json' }, // requireAdmin membaca x-admin-key
          body: JSON.stringify({ name: name }),
        });
        var body = await res.json().catch(function () {
          return {};
        });
        var d = body && body.data;
        var token = d && (d.token || d.masterToken);
  
        if (!res.ok || !token) {
          showMsg('error', errorText(res, body));
          return;
        }
  
        els.box.textContent = token;
        els.metaId.textContent = d.id || '-';
        els.metaExp.textContent = d.expiresAt ? formatWIB(Number(d.expiresAt)) : 'Tidak ada batas waktu';
        els.meta.classList.toggle('hidden', !(d.id || d.expiresAt));
        els.result.classList.remove('hidden');
        els.key.value = '';
        showMsg('success', 'Master token berhasil dibuat. Salin sekarang, token tidak akan ditampilkan lagi.');
        els.result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {
        showMsg('error', 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.');
      } finally {
        els.submit.disabled = false;
        els.submit.textContent = 'Buat Master Token';
      }
    }
  
    /* ========================= Salin ========================= */
  
    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
      }
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
  
    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      var timer;
      btn.addEventListener('click', function () {
        var target = document.querySelector(btn.getAttribute('data-copy'));
        if (!target) return;
        copyText(target.textContent.trim()).then(
          function () {
            btn.textContent = 'Tersalin \u2713';
          },
          function () {
            btn.textContent = 'Gagal';
          }
        );
        clearTimeout(timer);
        timer = setTimeout(function () {
          btn.textContent = 'Salin';
        }, 1800);
      });
    });
  
  
    // Tampilkan server API yang sedang dipakai, supaya ketidakcocokan server (dev vs produksi) langsung terlihat
    (function () {
      var info = document.createElement('p');
      info.className = 'mt-3 text-xs text-slate-500 dark:text-slate-400';
      info.textContent = 'Server API: ' + API;
      els.form.appendChild(info);
    })();
  
    /* ========================= Event ========================= */
  
    els.form.addEventListener('submit', function (event) {
      event.preventDefault();
      createMaster();
    });
  
    els.toggle.addEventListener('click', function () {
      var hidden = els.key.type === 'password';
      els.key.type = hidden ? 'text' : 'password';
      els.toggle.textContent = hidden ? 'Sembunyi' : 'Lihat';
    });
  
    els.hide.addEventListener('click', function () {
      hideResult();
      clearMsg();
    });
  })();