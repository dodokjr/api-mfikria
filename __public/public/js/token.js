// public/js/token.js
// Halaman token.html: minta access token (sesi) dengan mengisi nama, simpan di localStorage,
// tampilkan sisa waktu, cek status ke server, dan cek token apa pun lewat input manual.
//
//   POST /v2/token          body JSON { name }                           -> buat token sesi
//   GET  /v2/token/status   header Authorization: Bearer <token sesi>    -> cek token masih berlaku
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
  var TOKEN_URL = API + '/v2/token';
  var STATUS_URL = API + '/v2/token/status';

  var KEYS = {
    token: 'access_token',
    exp: 'access_token_exp',
    id: 'access_token_id',
    days: 'access_token_days',
    name: 'access_token_name',
  };

  var DAY = 24 * 60 * 60 * 1000;
  var HOUR = 60 * 60 * 1000;
  var MINUTE = 60 * 1000;

  var MSG_CLASSES = {
    error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
    success: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300',
    info: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  var PILL_CLASSES = {
    active: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    bad: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  };

  function $(id) {
    return document.getElementById(id);
  }

  var els = {
    form: $('token-form'),
    name: $('token-name'),
    submit: $('submit-btn'),
    msg: $('message'),
    result: $('result'),
    pill: $('status-pill'),
    tokenBox: $('token-box'),
    expires: $('info-expires'),
    remaining: $('info-remaining'),
    total: $('info-total'),
    id: $('info-id'),
    check: $('check-btn'),
    clear: $('clear-btn'),
    // cek token manual
    cForm: $('check-form'),
    cInput: $('check-token'),
    cSaved: $('use-saved'),
    cSubmit: $('check-submit'),
    cMsg: $('check-message'),
    cResult: $('check-result'),
    cPill: $('check-pill'),
    cExpires: $('check-expires'),
    cRemaining: $('check-remaining'),
    cId: $('check-id'),
    // coba API
    tForm: $('try-form'),
    tToken: $('try-token'),
    tSaved: $('try-saved'),
    tPath: $('try-path'),
    tSubmit: $('try-submit'),
    tMsg: $('try-message'),
    tResult: $('try-result'),
    tPill: $('try-pill'),
    tMeta: $('try-meta'),
    tOutput: $('try-output'),
  };

  var store = {
    get: function (key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set: function (key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {}
    },
    remove: function (key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    },
  };

  // Status dari server untuk token tersimpan (kedaluwarsa / dicabut / tidak dikenal)
  var serverState = null;
  // Hasil cek token manual: { valid, label, exp, id }
  var checked = null;

  /* ========================= Tampilan ========================= */

  function showMsg(kind, text, el) {
    el = el || els.msg;
    el.className = 'mt-4 rounded-md border px-3 py-2 text-sm ' + MSG_CLASSES[kind];
    el.textContent = text;
  }

  function clearMsg(el) {
    el = el || els.msg;
    el.className = 'hidden';
    el.textContent = '';
  }

  function setPill(el, kind, text) {
    el.className = 'rounded-full px-2.5 py-0.5 text-xs font-medium ' + PILL_CLASSES[kind];
    el.textContent = text;
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

  function formatLeft(left) {
    if (left <= 0) return '0';
    return (
      Math.floor(left / DAY) + ' hari ' +
      Math.floor((left % DAY) / HOUR) + ' jam ' +
      Math.floor((left % HOUR) / MINUTE) + ' menit'
    );
  }

  function updateRemaining() {
    var exp = Number(store.get(KEYS.exp)) || 0;
    if (store.get(KEYS.token)) {
      var left = exp - Date.now();

      if (serverState) {
        setPill(els.pill, 'bad', serverState.label);
        els.remaining.textContent = '0';
      } else if (!exp) {
        setPill(els.pill, 'bad', 'Tidak diketahui');
        els.remaining.textContent = '-';
      } else if (left <= 0) {
        setPill(els.pill, 'bad', 'Kedaluwarsa');
        els.remaining.textContent = '0';
      } else {
        setPill(els.pill, 'active', 'Aktif');
        els.remaining.textContent = formatLeft(left);
      }
    }
    renderChecked();
  }

  /* ========================= Kunci form ========================= */

  // Selama ada access_token di localStorage yang masih berlaku (access_token_exp belum lewat
  // dan server tidak menolaknya), form nama dikunci dan token baru tidak bisa dibuat.
  function hasActiveToken() {
    if (!store.get(KEYS.token)) return false;
    if (serverState) return false; // kedaluwarsa / dicabut / tidak dikenal menurut server
    var exp = Number(store.get(KEYS.exp)) || 0;
    return exp > Date.now();
  }

  var lockNote = document.createElement('p');
  lockNote.className = 'hidden';
  els.form.insertBefore(lockNote, els.submit);

  function applyLock() {
    var locked = hasActiveToken();
    els.name.disabled = locked;
    els.submit.disabled = locked;
    els.name.classList.toggle('cursor-not-allowed', locked);
    els.name.classList.toggle('opacity-60', locked);
    // Token aktif tidak boleh dihapus dari browser; baru bisa setelah kedaluwarsa / tidak berlaku
    els.clear.disabled = locked;
    els.clear.classList.toggle('cursor-not-allowed', locked);
    els.clear.classList.toggle('opacity-60', locked);
    els.clear.title = locked ? 'Tidak bisa dihapus selama token masih berlaku' : '';
    if (locked) {
      lockNote.className = 'mt-4 rounded-md border px-3 py-2 text-sm ' + MSG_CLASSES.info;
      lockNote.textContent =
        'Kamu masih punya access token yang aktif di browser ini (sampai ' +
        formatWIB(Number(store.get(KEYS.exp))) +
        '). Token baru bisa dibuat setelah token ini kedaluwarsa atau tidak berlaku lagi.';
    } else {
      lockNote.className = 'hidden';
      lockNote.textContent = '';
    }
  }

  function render() {
    var token = store.get(KEYS.token);
    if (!token) {
      els.result.classList.add('hidden');
    } else {
      var exp = Number(store.get(KEYS.exp)) || 0;
      els.result.classList.remove('hidden');
      els.tokenBox.textContent = token;
      els.expires.textContent = exp ? formatWIB(exp) : '-';
      els.total.textContent = store.get(KEYS.days) ? store.get(KEYS.days) + ' hari' : '-';
      els.id.textContent = store.get(KEYS.id) || '-';
      updateRemaining();
    }
    // tombol "Pakai tersimpan" hanya muncul kalau ada token tersimpan
    els.cSaved.classList.toggle('hidden', !token);
    els.tSaved.classList.toggle('hidden', !token);
    applyLock();
  }

  function renderChecked() {
    if (!checked) {
      els.cResult.classList.add('hidden');
      return;
    }
    els.cResult.classList.remove('hidden');
    els.cExpires.textContent = checked.exp ? formatWIB(checked.exp) : checked.valid ? 'Tanpa batas waktu' : '-';
    els.cId.textContent = checked.id || '-';

    if (checked.valid && !checked.exp) {
      setPill(els.cPill, 'active', 'Aktif');
      els.cRemaining.textContent = 'Tanpa batas';
      return;
    }
    if (checked.valid && checked.exp) {
      var left = checked.exp - Date.now();
      if (left > 0) {
        setPill(els.cPill, 'active', 'Aktif');
        els.cRemaining.textContent = formatLeft(left);
        return;
      }
      checked.valid = false;
      checked.label = 'Kedaluwarsa';
    }
    setPill(els.cPill, checked.valid ? 'active' : 'bad', checked.label);
    els.cRemaining.textContent = checked.valid ? '-' : '0';
  }

  function setBusy(button, busy, busyText) {
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.disabled = busy;
    button.textContent = busy ? busyText : button.dataset.label;
  }

  /* ========================= Pesan error ========================= */

  function errorText(res, body) {
    var code = body && body.code;
    if (res.status === 429) {
      var wait = res.headers.get('Retry-After');
      return 'Terlalu banyak permintaan.' + (wait ? ' Coba lagi dalam ' + wait + ' detik.' : ' Coba lagi beberapa menit lagi.');
    }
    if (res.status === 503 || code === 'TOKEN_SERVICE_UNAVAILABLE') {
      return 'Validasi token sementara tidak tersedia. Coba lagi sebentar.';
    }
    return (body && body.message) || 'Gagal membuat token (HTTP ' + res.status + ').';
  }

  /* ========================= Buat token ========================= */

  async function createToken() {
    // Nama bebas maks 15 karakter; kalau kosong, server membuat string acak 15 karakter
    var name = els.name.value.trim().slice(0, 15);

    // Masih punya token aktif di localStorage: jangan buat token baru
    if (hasActiveToken()) {
      applyLock();
      showMsg('info', 'Kamu masih punya access token yang aktif. Tunggu sampai kedaluwarsa atau tidak berlaku lagi sebelum membuat token baru.');
      return;
    }

    clearMsg();
    setBusy(els.submit, true, 'Membuat token...');

    try {
      var res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name }),
      });
      var body = await res.json().catch(function () {
        return {};
      });

      if (!res.ok || body.status !== 'success' || !body.data) {
        showMsg('error', errorText(res, body));
        return;
      }

      var d = body.data;
      store.set(KEYS.token, d.token);
      store.set(KEYS.exp, String(d.expiresAt));
      store.set(KEYS.id, d.id || '');
      store.set(KEYS.days, String(d.totalDays || ''));
      serverState = null;

      store.set(KEYS.name, name);
      if (!name) els.name.value = '';

      render();
      showMsg('success', 'Access token berhasil dibuat dan disimpan di browser ini.');
      els.result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
      showMsg('error', 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.');
    } finally {
      setBusy(els.submit, false);
      applyLock();
    }
  }

  /* ========================= Cek token ========================= */

  var STATE_TEXT = {
    TOKEN_EXPIRED: { label: 'Kedaluwarsa', text: 'Token sudah kedaluwarsa. Isi nama lalu buat token baru.' },
    TOKEN_REVOKED: { label: 'Dicabut', text: 'Token sudah dicabut. Buat token baru dengan mengisi nama.' },
    TOKEN_INVALID: { label: 'Tidak valid', text: 'Token tidak dikenali server. Buat token baru dengan mengisi nama.' },
    TOKEN_MISSING: { label: 'Tidak valid', text: 'Token tidak dikenali server. Buat token baru dengan mengisi nama.' },
  };

  // Token tersimpan (tombol "Cek Status" di kartu hasil)
  async function checkStatus(silent) {
    var token = store.get(KEYS.token);
    if (!token) return;

    if (!silent) setBusy(els.check, true, 'Memeriksa...');

    try {
      var res = await fetch(STATUS_URL, { headers: { Authorization: 'Bearer ' + token } });
      var body = await res.json().catch(function () {
        return {};
      });
      var d = body && body.data;

      if (res.ok && d && d.valid) {
        serverState = null;
        if (d.expiresAt) store.set(KEYS.exp, String(d.expiresAt));
        render();
        if (!silent) {
          var exp = Number(store.get(KEYS.exp)) || 0;
          showMsg(
            'success',
            'Token masih berlaku sampai ' + (exp ? formatWIB(exp) : '-') +
              (exp ? ' (sisa ' + formatLeft(exp - Date.now()) + ').' : '.')
          );
        }
      } else if (res.ok && d) {
        var s = STATE_TEXT[d.code] || STATE_TEXT.TOKEN_INVALID;
        serverState = { label: s.label };
        render();
        showMsg('info', s.text);
      } else if (!silent) {
        showMsg('error', (body && body.message) || 'Gagal memeriksa token (HTTP ' + res.status + ').');
      }
    } catch (e) {
      if (!silent) showMsg('error', 'Tidak bisa memeriksa status token. Periksa koneksi lalu coba lagi.');
    } finally {
      if (!silent) setBusy(els.check, false);
    }
  }

  // Token apa pun dari input manual
  async function checkManual() {
    var token = els.cInput.value.trim();
    checked = null;
    renderChecked();

    if (!token) {
      showMsg('error', 'Tempel access token terlebih dahulu.', els.cMsg);
      els.cInput.focus();
      return;
    }

    clearMsg(els.cMsg);
    setBusy(els.cSubmit, true, 'Memeriksa...');

    try {
      var res = await fetch(STATUS_URL, { headers: { Authorization: 'Bearer ' + token } });
      var body = await res.json().catch(function () {
        return {};
      });
      var d = (body && body.data) || {};
      var code = d.code || body.code;

      if (res.status === 429) {
        showMsg('error', errorText(res, body), els.cMsg);
        return;
      }

      if (res.ok && d.valid) {
        checked = { valid: true, label: 'Aktif', exp: Number(d.expiresAt) || 0, id: d.id || '' };
        renderChecked();
        showMsg(
          'success',
          checked.exp
            ? 'Token berlaku sampai ' + formatWIB(checked.exp) + '.'
            : 'Token masih berlaku (tanpa batas waktu).',
          els.cMsg
        );
      } else if (code) {
        var s = STATE_TEXT[code] || STATE_TEXT.TOKEN_INVALID;
        checked = { valid: false, label: s.label, exp: Number(d.expiresAt) || 0, id: d.id || '' };
        renderChecked();
        showMsg('info', s.text, els.cMsg);
      } else {
        showMsg('error', (body && body.message) || 'Gagal memeriksa token (HTTP ' + res.status + ').', els.cMsg);
      }
    } catch (e) {
      showMsg('error', 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.', els.cMsg);
    } finally {
      setBusy(els.cSubmit, false);
    }
  }

  // Coba API: panggil endpoint dengan token dari input, tampilkan JSON
  var MAX_OUTPUT = 200000; // batasi tampilan supaya halaman tidak berat

  function tryError(code) {
    var map = {
      TOKEN_MISSING: 'Token belum diisi.',
      TOKEN_INVALID: 'Token tidak valid atau tidak dikenali server ' + API + '.',
      TOKEN_EXPIRED: 'Token sudah kedaluwarsa. Buat token baru di atas.',
      TOKEN_REVOKED: 'Token sudah dicabut. Buat token baru di atas.',
    };
    return map[code] || '';
  }

  async function tryApi() {
    var token = els.tToken.value.trim();
    var path = els.tPath.value.trim();

    els.tResult.classList.add('hidden');

    if (!token) {
      showMsg('error', 'Tempel access token terlebih dahulu.', els.tMsg);
      els.tToken.focus();
      return;
    }
    if (!path) {
      showMsg('error', 'Isi endpoint terlebih dahulu.', els.tMsg);
      els.tPath.focus();
      return;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.indexOf('//') === 0) {
      showMsg('error', 'Isi path saja (misalnya /v2/donghua/anichi), bukan alamat lengkap.', els.tMsg);
      els.tPath.focus();
      return;
    }
    if (path.charAt(0) !== '/') path = '/' + path;

    clearMsg(els.tMsg);
    setBusy(els.tSubmit, true, 'Mengambil data...');

    var url = API + path;
    var started = Date.now();

    try {
      var res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
      var raw = await res.text();
      var ms = Date.now() - started;

      var body = null;
      var text = raw;
      try {
        body = JSON.parse(raw);
        text = JSON.stringify(body, null, 2);
      } catch (e) {}

      var truncated = text.length > MAX_OUTPUT;
      if (truncated) text = text.slice(0, MAX_OUTPUT) + '\n\n... (dipotong, respons lengkap ' + raw.length + ' karakter)';

      els.tOutput.textContent = text || '(respons kosong)';
      els.tMeta.textContent = 'GET ' + url + ' \u00b7 ' + ms + ' ms';
      setPill(els.tPill, res.ok ? 'active' : 'bad', 'HTTP ' + res.status);
      els.tResult.classList.remove('hidden');

      if (res.ok) {
        showMsg('success', 'Data berhasil diambil.', els.tMsg);
      } else if (res.status === 429) {
        showMsg('error', errorText(res, body || {}), els.tMsg);
      } else {
        var code = body && body.code;
        showMsg('error', tryError(code) || (body && body.message) || 'Server membalas HTTP ' + res.status + '.', els.tMsg);
      }
    } catch (e) {
      showMsg('error', 'Tidak bisa terhubung ke ' + API + '. Periksa koneksi, alamat server, atau pengaturan CORS.', els.tMsg);
    } finally {
      setBusy(els.tSubmit, false);
    }
  }

  function clearToken() {
    if (hasActiveToken()) {
      applyLock();
      showMsg('info', 'Token yang masih berlaku tidak bisa dihapus dari browser. Tunggu sampai kedaluwarsa atau tidak berlaku lagi.');
      return;
    }
    store.remove(KEYS.token);
    store.remove(KEYS.exp);
    store.remove(KEYS.id);
    store.remove(KEYS.days);
    serverState = null;
    render();
    showMsg('info', 'Token dihapus dari browser ini. Token tetap berlaku di server sampai kedaluwarsa.');
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

  /* ========================= Pasang event ========================= */

  els.form.addEventListener('submit', function (event) {
    event.preventDefault();
    createToken();
  });

  els.check.addEventListener('click', function () {
    clearMsg();
    checkStatus(false);
  });

  els.clear.addEventListener('click', clearToken);

  els.cForm.addEventListener('submit', function (event) {
    event.preventDefault();
    checkManual();
  });

  els.tForm.addEventListener('submit', function (event) {
    event.preventDefault();
    tryApi();
  });

  els.tSaved.addEventListener('click', function () {
    els.tToken.value = store.get(KEYS.token) || '';
    els.tToken.focus();
  });

  els.cSaved.addEventListener('click', function () {
    els.cInput.value = store.get(KEYS.token) || '';
    els.cInput.focus();
  });


  // Tampilkan server API yang sedang dipakai, supaya ketidakcocokan server (dev vs produksi) langsung terlihat
  (function () {
    var info = document.createElement('p');
    info.className = 'mt-3 text-xs text-slate-500 dark:text-slate-400';
    info.textContent = 'Server API: ' + API;
    els.form.appendChild(info);
  })();

  /* ========================= Mulai ========================= */

  var savedToken = store.get(KEYS.token);
  if (savedToken) els.tToken.value = savedToken; // isi otomatis dengan token tersimpan

  var savedName = store.get(KEYS.name);
  if (savedName) els.name.value = savedName;

  render();
  checkStatus(true);
  setInterval(function () {
    updateRemaining();
    applyLock();
  }, MINUTE);
})();