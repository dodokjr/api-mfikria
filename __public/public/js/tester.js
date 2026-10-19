(function () {
    'use strict';
  
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  
    const INPUT =
      'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 dark:border-slate-700 dark:bg-slate-800';
    const HISTORY_KEY = 'tester_history';
    const TOKEN_KEY = 'access_token';
    const NO_BODY = ['GET', 'HEAD'];
  
    /* ---------- kode status HTTP ---------- */
    const STATUS = {
      100: ['Continue', 'Server menerima header, klien boleh lanjut mengirim body.'],
      101: ['Switching Protocols', 'Server setuju berpindah protokol (mis. WebSocket).'],
      200: ['OK', 'Request berhasil.'],
      201: ['Created', 'Data baru berhasil dibuat (umum untuk POST).'],
      202: ['Accepted', 'Request diterima tetapi belum selesai diproses.'],
      204: ['No Content', 'Berhasil, tetapi tidak ada isi yang dikembalikan.'],
      206: ['Partial Content', 'Server mengirim sebagian data (range request).'],
      301: ['Moved Permanently', 'URL sudah pindah permanen ke alamat baru.'],
      302: ['Found', 'URL dipindah sementara ke alamat lain.'],
      303: ['See Other', 'Ambil hasilnya di URL lain menggunakan GET.'],
      304: ['Not Modified', 'Data tidak berubah, pakai cache.'],
      307: ['Temporary Redirect', 'Pindah sementara, method dan body tetap sama.'],
      308: ['Permanent Redirect', 'Pindah permanen, method dan body tetap sama.'],
      400: ['Bad Request', 'Request salah format atau parameter tidak valid.'],
      401: ['Unauthorized', 'Belum login atau token tidak ada, tidak valid, atau kedaluwarsa.'],
      403: ['Forbidden', 'Server paham request, tetapi aksesmu ditolak.'],
      404: ['Not Found', 'Endpoint atau data tidak ditemukan.'],
      405: ['Method Not Allowed', 'Method (GET/POST/dll) tidak diizinkan untuk endpoint ini.'],
      408: ['Request Timeout', 'Server menunggu terlalu lama untuk request selesai dikirim.'],
      409: ['Conflict', 'Bentrok dengan kondisi data saat ini (mis. data sudah ada).'],
      410: ['Gone', 'Data sudah dihapus permanen.'],
      413: ['Payload Too Large', 'Body request terlalu besar.'],
      415: ['Unsupported Media Type', 'Content-Type tidak didukung server.'],
      422: ['Unprocessable Entity', 'Format benar, tetapi isi data gagal validasi.'],
      429: ['Too Many Requests', 'Terlalu banyak request, kena rate limit.'],
      500: ['Internal Server Error', 'Terjadi error tak terduga di server.'],
      501: ['Not Implemented', 'Server belum mendukung fitur ini.'],
      502: ['Bad Gateway', 'Gateway menerima respons tidak valid dari server upstream.'],
      503: ['Service Unavailable', 'Server sedang sibuk atau maintenance.'],
      504: ['Gateway Timeout', 'Server upstream terlalu lama merespons.'],
    };
    const CATEGORY = {
      1: 'Informasional',
      2: 'Sukses',
      3: 'Redirect',
      4: 'Error dari sisi klien (periksa request-mu)',
      5: 'Error dari sisi server',
    };
  
    function statusMeaning(code) {
      const cat = CATEGORY[Math.floor(code / 100)] || 'Tidak dikenal';
      const s = STATUS[code];
      return s ? s[0] + ': ' + s[1] + ' [' + cat + ']' : cat;
    }
  
    let lastReq = null;
  
    let abortCtrl = null;
    let lastBlob = null;
    let lastFilename = 'response.txt';
    let lastImageUrl = null;
  
    /* ---------- util ---------- */
    function storageGet(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function storageSet(key, val) {
      try { localStorage.setItem(key, val); } catch (e) { /* abaikan */ }
    }
  
    function showMessage(text, type) {
      const el = $('#message');
      el.textContent = text;
      el.className =
        'mt-4 rounded-md border px-3 py-2 text-sm ' +
        (type === 'error'
          ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
          : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300');
    }
    function hideMessage() {
      $('#message').className = 'hidden';
    }
  
    function formatBytes(n) {
      if (n < 1024) return n + ' B';
      if (n < 1024 * 1024) return (n / 1024).toFixed(2) + ' KB';
      return (n / 1024 / 1024).toFixed(2) + ' MB';
    }
  
    /* ---------- baris key/value ---------- */
    function addRow(container, data) {
      const d = Object.assign({ key: '', value: '', on: true, type: 'text' }, data || {});
      const form = container.dataset.mode === 'form';
      const row = document.createElement('div');
      row.className = 'row flex items-center gap-2';
      row.innerHTML =
        '<input type="checkbox" class="row-on h-4 w-4 shrink-0 accent-red-600" aria-label="Aktif" />' +
        '<input type="text" class="row-key ' + INPUT + ' min-w-0 flex-1" placeholder="Key" autocomplete="off" spellcheck="false" />' +
        (form
          ? '<select class="row-type ' + INPUT + ' w-20 shrink-0"><option value="text">Text</option><option value="file">File</option></select>'
          : '') +
        '<input type="text" class="row-val ' + INPUT + ' min-w-0 flex-1" placeholder="Value" autocomplete="off" spellcheck="false" />' +
        (form ? '<input type="file" class="row-file hidden min-w-0 flex-1 text-xs" />' : '') +
        '<button type="button" class="row-del shrink-0 px-1 text-slate-400 hover:text-red-600" aria-label="Hapus baris">&#10005;</button>';
      $('.row-on', row).checked = d.on;
      $('.row-key', row).value = d.key;
      $('.row-val', row).value = d.value;
      if (form) {
        $('.row-type', row).value = d.type;
        syncRowType(row);
      }
      container.appendChild(row);
    }
  
    function syncRowType(row) {
      const sel = $('.row-type', row);
      if (!sel) return;
      const isFile = sel.value === 'file';
      $('.row-val', row).classList.toggle('hidden', isFile);
      $('.row-file', row).classList.toggle('hidden', !isFile);
    }
  
    function readRows(container) {
      return $$('.row', container)
        .filter((r) => $('.row-on', r).checked && $('.row-key', r).value.trim() !== '')
        .map((r) => {
          const typeEl = $('.row-type', r);
          const isFile = typeEl && typeEl.value === 'file';
          return {
            key: $('.row-key', r).value.trim(),
            value: $('.row-val', r).value,
            isFile: !!isFile,
            file: isFile ? $('.row-file', r).files[0] || null : null,
          };
        });
    }
  
    function rowsToData(container) {
      return $$('.row', container).map((r) => {
        const typeEl = $('.row-type', r);
        return {
          key: $('.row-key', r).value,
          value: $('.row-val', r).value,
          on: $('.row-on', r).checked,
          type: typeEl && typeEl.value === 'file' ? 'text' : (typeEl ? typeEl.value : 'text'),
        };
      });
    }
  
    function fillRows(container, list) {
      container.innerHTML = '';
      (list && list.length ? list : [{}]).forEach((d) => addRow(container, d));
    }
  
    /* ---------- tab ---------- */
    function setupTabs(btnSel, attr, panelPrefix, panelSel) {
      $$(btnSel).forEach((btn) => {
        btn.addEventListener('click', () => {
          const name = btn.dataset[attr];
          $$(btnSel).forEach((b) => {
            const on = b === btn;
            b.classList.toggle('border-red-600', on);
            b.classList.toggle('text-red-600', on);
            b.classList.toggle('border-transparent', !on);
          });
          $$(panelSel).forEach((p) => p.classList.add('hidden'));
          $(panelPrefix + name).classList.remove('hidden');
        });
      });
    }
  
    /* ---------- body type ---------- */
    function updateBodyUI() {
      const type = $('#body-type').value;
      const isText = type === 'json' || type === 'raw';
      const isForm = type === 'urlencoded' || type === 'formdata';
      $('#body-text-wrap').classList.toggle('hidden', !isText);
      $('#body-form-wrap').classList.toggle('hidden', !isForm);
      $('#format-json').classList.toggle('hidden', type !== 'json');
      $('#body-note').classList.toggle('hidden', !(NO_BODY.includes($('#method').value) && type !== 'none'));
      $('#body-text').placeholder = type === 'json' ? '{ "nama": "contoh" }' : 'Teks apa saja...';
  
      // file hanya untuk form-data
      $$('#form-rows .row-type').forEach((sel) => {
        const fileOpt = $('option[value="file"]', sel);
        fileOpt.hidden = type !== 'formdata';
        fileOpt.disabled = type !== 'formdata';
        if (type !== 'formdata' && sel.value === 'file') {
          sel.value = 'text';
          syncRowType(sel.closest('.row'));
        }
      });
    }
  
    /* ---------- perbaikan & diagnosa JSON ---------- */
    function repairJSON(src) {
      const s = src
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u00A0\u2007\u202F]/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\r/g, '');
      let out = '';
      let i = 0;
      while (i < s.length) {
        const c = s[i];
        if (c === '"' || c === "'") {
          const q = c;
          let str = '';
          i++;
          while (i < s.length && s[i] !== q) {
            if (s[i] === '\\' && i + 1 < s.length) {
              str += s[i + 1] === "'" ? "'" : s[i] + s[i + 1];
              i += 2;
              continue;
            }
            if (s[i] === '"') str += '\\"';
            else if (s[i] === '\n') str += '\\n';
            else str += s[i];
            i++;
          }
          i++;
          out += '"' + str + '"';
          continue;
        }
        if (c === '/' && s[i + 1] === '/') {
          while (i < s.length && s[i] !== '\n') i++;
          continue;
        }
        if (c === '/' && s[i + 1] === '*') {
          const end = s.indexOf('*/', i + 2);
          i = end === -1 ? s.length : end + 2;
          continue;
        }
        if (c === '}' || c === ']') {
          out = out.replace(/,\s*$/, '');
          out += c;
          i++;
          continue;
        }
        if (/[A-Za-z_$]/.test(c)) {
          let j = i;
          while (j < s.length && /[\w$]/.test(s[j])) j++;
          const word = s.slice(i, j);
          let k = j;
          while (k < s.length && /\s/.test(s[k])) k++;
          if (s[k] === ':' && !['true', 'false', 'null'].includes(word)) out += '"' + word + '"';
          else out += word;
          i = j;
          continue;
        }
        out += c;
        i++;
      }
      return out;
    }
  
    function describeJSONError(text, err) {
      const m = /position (\d+)/.exec(err.message);
      let detail = '';
      if (m) {
        const pos = Number(m[1]);
        const lines = text.slice(0, pos).split('\n');
        const ch = text.charAt(pos);
        const shown = ch === '' ? '(akhir teks)' : ch === '\n' ? '(baris baru)' : '"' + ch + '"';
        const code = ch ? ' U+' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0') : '';
        detail = ' Masalah di baris ' + lines.length + ', kolom ' + (lines[lines.length - 1].length + 1) + ': karakter ' + shown + code + '.';
      }
      return 'JSON body tidak valid: ' + err.message + '.' + detail + ' Klik "Rapikan / perbaiki JSON" untuk memperbaiki otomatis.';
    }
  
    /* ---------- host / environment ---------- */
    const ENV_KEY = 'tester_envs';
    const BASE_KEY = 'tester_base';
    const PRESETS = [
      ['Localhost :3000', 'http://localhost:3000'],
      ['Localhost :5000', 'http://localhost:5000'],
      ['Localhost :8000', 'http://localhost:8000'],
      ['Localhost :8080', 'http://localhost:8080'],
      ['Publik: api-mfikria', 'https://api-mfikria.vercel.app'],
    ];
  
    function hostKind(host) {
      let h = String(host || '').toLowerCase().trim();
      if (h.startsWith('[')) h = h.slice(1, h.indexOf(']') === -1 ? undefined : h.indexOf(']'));
      else h = h.replace(/:\d+$/, '');
      if (h === 'localhost' || h.endsWith('.localhost') || h === '::1' || h === '0.0.0.0' || /^127\./.test(h)) return 'localhost';
      if (/^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^169\.254\./.test(h) || h.endsWith('.local')) return 'lan';
      return 'public';
    }
  
    function schemeFor(v) {
      return hostKind(v.split(/[\/?#]/)[0]) === 'public' ? 'https://' : 'http://';
    }
  
    function normalizeBase(raw) {
      let b = String(raw || '').trim().replace(/\/+$/, '');
      if (!b) return '';
      if (!/^https?:\/\//i.test(b)) b = schemeFor(b) + b;
      return b;
    }
  
    function resolveUrl(raw) {
      const v = String(raw || '').trim();
      const base = normalizeBase($('#base-url').value);
      if (!v) {
        if (base) return base;
        throw new Error('URL wajib diisi.');
      }
      if (/^https?:\/\//i.test(v)) return v;
      if (v.startsWith('/')) {
        if (!base) throw new Error('Isi Base URL (panel Host / Environment) atau tulis URL lengkap.');
        return base + v;
      }
      return schemeFor(v) + v;
    }
  
    function loadEnvs() {
      try { return JSON.parse(storageGet(ENV_KEY) || '[]'); } catch (e) { return []; }
    }
  
    function renderEnvSelect() {
      const sel = $('#env-select');
      sel.innerHTML = '';
      const custom = document.createElement('option');
      custom.value = '';
      custom.textContent = 'Kustom (ketik Base URL sendiri)';
      sel.appendChild(custom);
  
      const addGroup = (label, items) => {
        if (!items.length) return;
        const g = document.createElement('optgroup');
        g.label = label;
        items.forEach(([name, url]) => {
          const o = document.createElement('option');
          o.value = url;
          o.textContent = name + ' - ' + url;
          g.appendChild(o);
        });
        sel.appendChild(g);
      };
      addGroup('Preset', PRESETS);
      addGroup('Tersimpan', loadEnvs().map((e) => [e.name, e.url]));
    }
  
    function setHostStatus(text, type) {
      const el = $('#host-status');
      el.textContent = text;
      const colors = {
        error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
        success: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300',
        warn: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
      };
      el.className = 'mt-4 rounded-md border px-3 py-2 text-sm ' + colors[type || 'success'];
    }
  
    function updateHostUI() {
      const raw = $('#base-url').value.trim();
      storageSet(BASE_KEY, raw);
      const base = normalizeBase(raw);
      const sel = $('#env-select');
      sel.value = base && Array.from(sel.options).some((o) => o.value === base) ? base : '';
  
      const badge = $('#host-badge');
      const hint = $('#host-hint');
      if (!base) {
        badge.classList.add('hidden');
        hint.textContent = '';
        return;
      }
      let host = '';
      try { host = new URL(base).hostname; } catch (e) { /* abaikan */ }
      const kind = hostKind(host);
      const labels = { localhost: 'Localhost', lan: 'Jaringan lokal', public: 'Host publik' };
      const colors = {
        localhost: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
        lan: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
        public: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
      };
      badge.textContent = labels[kind];
      badge.className = 'shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ' + colors[kind];
  
      const hints = {
        localhost: 'Pastikan server lokal sudah berjalan dan CORS aktif. Jika halaman ini dibuka dari domain publik, Chrome/Edge bisa meminta izin akses jaringan lokal; pilih Izinkan.',
        lan: 'Perangkat ini harus satu jaringan dengan server, dan server harus mengizinkan CORS. Browser bisa meminta izin akses jaringan lokal.',
        public: 'Gunakan HTTPS, dan server harus mengizinkan CORS dari origin halaman ini.',
      };
      let text = hints[kind];
      if (location.protocol === 'https:' && /^http:\/\//i.test(base) && kind !== 'localhost') {
        text = 'Diblokir browser (mixed content): halaman HTTPS tidak boleh memanggil URL http://. Gunakan https:// atau buka halaman ini lewat http.';
      }
      hint.textContent = text;
    }
  
    function fetchTimeout(url, opts, ms) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), ms);
      return fetch(url, Object.assign({}, opts, { signal: ctrl.signal })).finally(() => clearTimeout(t));
    }
  
    async function checkHost() {
      const base = normalizeBase($('#base-url').value);
      if (!base) {
        setHostStatus('Isi Base URL dulu.', 'error');
        return;
      }
      const btn = $('#check-host');
      btn.disabled = true;
      btn.textContent = 'Memeriksa...';
      const t0 = performance.now();
      try {
        const res = await fetchTimeout(base, {}, 8000);
        const ms = Math.round(performance.now() - t0);
        const name = res.statusText || (STATUS[res.status] ? STATUS[res.status][0] : '');
        setHostStatus('Terhubung: ' + res.status + ' ' + name + ' (' + ms + ' ms). CORS diizinkan untuk halaman ini.', 'success');
      } catch (err) {
        if (err && err.name === 'AbortError') {
          setHostStatus('Timeout (8 detik): server tidak merespons.', 'error');
        } else {
          try {
            await fetchTimeout(base, { mode: 'no-cors' }, 8000);
            setHostStatus('Server aktif, tetapi tidak mengizinkan CORS dari halaman ini. Aktifkan header Access-Control-Allow-Origin di server (lihat contoh di bawah).', 'warn');
          } catch (err2) {
            setHostStatus('Server tidak bisa dijangkau: server mati, port atau URL salah, atau diblokir browser (mixed content / izin jaringan lokal).', 'error');
          }
        }
      } finally {
        btn.disabled = false;
        btn.textContent = 'Cek Koneksi';
      }
    }
  
    function saveEnv() {
      const base = normalizeBase($('#base-url').value);
      if (!base) {
        setHostStatus('Isi Base URL dulu sebelum menyimpan.', 'error');
        return;
      }
      let name = $('#env-name').value.trim();
      if (!name) {
        try { name = new URL(base).host; } catch (e) { name = base; }
      }
      const list = loadEnvs().filter((e) => e.name !== name);
      list.unshift({ name: name, url: base });
      storageSet(ENV_KEY, JSON.stringify(list.slice(0, 10)));
      renderEnvSelect();
      updateHostUI();
      $('#env-name').value = '';
      setHostStatus('Environment "' + name + '" disimpan.', 'success');
    }
  
    function deleteEnv() {
      const base = normalizeBase($('#base-url').value);
      const list = loadEnvs();
      const next = list.filter((e) => e.url !== base);
      if (next.length === list.length) {
        setHostStatus('Tidak ada environment tersimpan dengan Base URL ini (preset tidak bisa dihapus).', 'error');
        return;
      }
      storageSet(ENV_KEY, JSON.stringify(next));
      renderEnvSelect();
      updateHostUI();
      setHostStatus('Environment dihapus.', 'success');
    }
  
    function initHost() {
      renderEnvSelect();
      $('#base-url').value = storageGet(BASE_KEY) || '';
      updateHostUI();
      $('#env-select').addEventListener('change', () => {
        if ($('#env-select').value !== '') $('#base-url').value = $('#env-select').value;
        updateHostUI();
      });
      $('#base-url').addEventListener('input', updateHostUI);
      $('#check-host').addEventListener('click', checkHost);
      $('#save-env').addEventListener('click', saveEnv);
      $('#delete-env').addEventListener('click', deleteEnv);
    }
  
    /* ---------- susun request ---------- */
    function buildRequest() {
      const url = resolveUrl($('#url').value);
  
      let u;
      try { u = new URL(url); } catch (e) { throw new Error('URL tidak valid.'); }
      readRows($('#params-rows')).forEach((p) => u.searchParams.append(p.key, p.value));
  
      const method = $('#method').value;
      const headers = {};
      readRows($('#headers-rows')).forEach((h) => { headers[h.key] = h.value; });
  
      const bearer = $('#bearer').value.trim();
      const hasAuth = Object.keys(headers).some((k) => k.toLowerCase() === 'authorization');
      if (bearer && !hasAuth) headers.Authorization = 'Bearer ' + bearer.replace(/^Bearer\s+/i, '');
  
      const hasCT = () => Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
      const type = $('#body-type').value;
      const req = { url: u.toString(), method, headers, body: undefined, bodyType: 'none', bodyText: '', formRows: [] };
  
      if (NO_BODY.includes(method) || type === 'none') return req;
  
      if (type === 'json' || type === 'raw') {
        const text = $('#body-text').value;
        if (type === 'json' && text.trim() !== '') {
          try { JSON.parse(text); } catch (e) { throw new Error(describeJSONError(text, e)); }
        }
        if (!hasCT()) headers['Content-Type'] = type === 'json' ? 'application/json' : 'text/plain';
        req.body = text;
        req.bodyType = type;
        req.bodyText = text;
      } else if (type === 'urlencoded') {
        const rows = readRows($('#form-rows'));
        const params = new URLSearchParams();
        rows.forEach((r) => params.append(r.key, r.value));
        if (!hasCT()) headers['Content-Type'] = 'application/x-www-form-urlencoded';
        req.body = params.toString();
        req.bodyType = type;
        req.bodyText = req.body;
      } else if (type === 'formdata') {
        const rows = readRows($('#form-rows'));
        const fd = new FormData();
        rows.forEach((r) => {
          if (r.isFile) {
            if (r.file) fd.append(r.key, r.file, r.file.name);
          } else {
            fd.append(r.key, r.value);
          }
        });
        // Content-Type diatur otomatis browser (boundary)
        Object.keys(headers).forEach((k) => { if (k.toLowerCase() === 'content-type') delete headers[k]; });
        req.body = fd;
        req.bodyType = type;
        req.formRows = rows;
      }
      return req;
    }
  
    function toCurl(r) {
      const q = (s) => "'" + String(s).replace(/'/g, "'\\''") + "'";
      let c = 'curl -X ' + r.method + ' ' + q(r.url);
      Object.keys(r.headers).forEach((k) => { c += ' -H ' + q(k + ': ' + r.headers[k]); });
      if (r.bodyType === 'json' || r.bodyType === 'raw' || r.bodyType === 'urlencoded') {
        if (r.bodyText !== '') c += ' --data-raw ' + q(r.bodyText);
      } else if (r.bodyType === 'formdata') {
        r.formRows.forEach((f) => {
          c += ' -F ' + q(f.key + (f.isFile ? '=@' + (f.file ? f.file.name : 'file') : '=' + f.value));
        });
      }
      return c;
    }
  
    /* ---------- render daftar key/value ---------- */
    function renderKV(dl, entries, emptyText) {
      dl.innerHTML = '';
      if (!entries.length) {
        const p = document.createElement('p');
        p.className = 'py-2 text-xs text-slate-500 dark:text-slate-400';
        p.textContent = emptyText || 'Kosong.';
        dl.appendChild(p);
        return;
      }
      entries.forEach(([k, v]) => {
        const row = document.createElement('div');
        row.className = 'flex flex-col gap-1 py-2 sm:flex-row sm:gap-6';
        const dt = document.createElement('dt');
        dt.className = 'text-slate-500 dark:text-slate-400 sm:w-40 sm:shrink-0 break-all';
        dt.textContent = k;
        const dd = document.createElement('dd');
        dd.className = 'break-all whitespace-pre-wrap';
        dd.textContent = v;
        row.append(dt, dd);
        dl.appendChild(row);
      });
    }
  
    function renderRequestInfo() {
      const r = lastReq;
      if (!r) return;
      const hdrs = Object.keys(r.headers).map((k) => [k, r.headers[k]]);
      if (r.bodyType === 'formdata') {
        hdrs.push(['Content-Type', 'multipart/form-data; boundary=... (diatur otomatis oleh browser)']);
      }
      renderKV($('#req-headers'), hdrs, 'Tidak ada header kustom yang dikirim.');
      $('#cnt-req').textContent = '(' + hdrs.length + ')';
  
      const labels = { none: 'Tanpa body', json: 'JSON', raw: 'Teks mentah', urlencoded: 'Form URL-encoded', formdata: 'Form-data' };
      let body = '(tanpa body)';
      if (r.bodyType === 'formdata') {
        body = r.formRows.map((f) => f.key + ' = ' + (f.isFile ? '[file: ' + (f.file ? f.file.name : 'belum dipilih') + ']' : f.value)).join('\n') || '(kosong)';
      } else if (r.bodyType !== 'none') {
        body = r.bodyText === '' ? '(kosong)' : r.bodyText;
      }
      renderKV($('#req-info'), [
        ['Method', r.method],
        ['URL', r.url],
        ['Tipe body', labels[r.bodyType] || '-'],
        ['Body', body],
      ]);
    }
  
    /* ---------- referensi status ---------- */
    function pillColor(code) {
      if (code < 300) return 'text-green-600 dark:text-green-400';
      if (code < 400) return 'text-amber-600 dark:text-amber-400';
      return 'text-red-600 dark:text-red-400';
    }
  
    function buildStatusRef() {
      const wrap = $('#status-ref');
      wrap.innerHTML = '';
      [1, 2, 3, 4, 5].forEach((g) => {
        const box = document.createElement('div');
        const title = document.createElement('h3');
        title.className = 'text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400';
        title.textContent = g + 'xx - ' + CATEGORY[g];
        const list = document.createElement('div');
        list.className = 'mt-2 divide-y divide-slate-200 text-sm dark:divide-slate-800';
        Object.keys(STATUS).filter((c) => Math.floor(c / 100) === g).forEach((c) => {
          const row = document.createElement('div');
          row.className = 'status-row flex flex-col gap-1 rounded px-2 py-2 sm:flex-row sm:gap-4';
          row.dataset.code = c;
          const code = document.createElement('span');
          code.className = 'font-semibold sm:w-12 sm:shrink-0 ' + pillColor(Number(c));
          code.textContent = c;
          const name = document.createElement('span');
          name.className = 'font-medium sm:w-48 sm:shrink-0';
          name.textContent = STATUS[c][0];
          const desc = document.createElement('span');
          desc.className = 'text-slate-500 dark:text-slate-400';
          desc.textContent = STATUS[c][1];
          row.append(code, name, desc);
          list.appendChild(row);
        });
        box.append(title, list);
        wrap.appendChild(box);
      });
    }
  
    function highlightStatus(code) {
      $$('.status-row').forEach((r) => {
        const on = code !== null && Number(r.dataset.code) === code;
        r.classList.toggle('bg-red-50', on);
        r.classList.toggle('dark:bg-slate-800', on);
      });
    }
  
    /* ---------- tampilkan respons ---------- */
    function pillClass(status) {
      const base = 'rounded-full px-2.5 py-0.5 text-xs font-medium ';
      if (status >= 200 && status < 300) return base + 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
      if (status >= 300 && status < 400) return base + 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200';
      return base + 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
    }
  
    function guessExt(ct) {
      if (/json/.test(ct)) return 'json';
      if (/html/.test(ct)) return 'html';
      if (/xml/.test(ct)) return 'xml';
      if (/csv/.test(ct)) return 'csv';
      if (/png/.test(ct)) return 'png';
      if (/jpe?g/.test(ct)) return 'jpg';
      if (/gif/.test(ct)) return 'gif';
      if (/webp/.test(ct)) return 'webp';
      if (/svg/.test(ct)) return 'svg';
      if (/pdf/.test(ct)) return 'pdf';
      if (/text/.test(ct)) return 'txt';
      return 'bin';
    }
  
    async function showResponse(res, ms) {
      const buf = await res.arrayBuffer();
      const ct = res.headers.get('content-type') || '';
      const isImage = /^image\//i.test(ct);
      const isText = ct === '' || /json|text|xml|javascript|html|svg|csv|x-www-form-urlencoded/i.test(ct);
  
      lastBlob = new Blob([buf], { type: ct || 'application/octet-stream' });
      lastFilename = 'response.' + guessExt(ct);
      if (lastImageUrl) { URL.revokeObjectURL(lastImageUrl); lastImageUrl = null; }
  
      let output = '';
      if (isImage) {
        lastImageUrl = URL.createObjectURL(lastBlob);
        $('#res-image').src = lastImageUrl;
        output = '[Gambar: ' + ct + ', ' + formatBytes(buf.byteLength) + ']';
      } else if (isText) {
        const text = new TextDecoder().decode(buf);
        try {
          output = JSON.stringify(JSON.parse(text), null, 2);
          lastFilename = 'response.json';
          lastBlob = new Blob([output], { type: 'application/json' });
        } catch (e) {
          output = text;
        }
        if (output === '') output = '(body kosong)';
      } else {
        output = '[Data biner: ' + ct + ', ' + formatBytes(buf.byteLength) + '] Gunakan tombol "Unduh respons".';
      }
      $('#res-image-wrap').classList.toggle('hidden', !isImage);
  
      const pill = $('#status-pill');
      pill.textContent = res.status + ' ' + (res.statusText || (STATUS[res.status] ? STATUS[res.status][0] : ''));
      $('#info-meaning').textContent = statusMeaning(res.status);
      pill.className = pillClass(res.status);
      $('#info-time').textContent = Math.round(ms) + ' ms';
      $('#info-size').textContent = formatBytes(buf.byteLength);
      $('#info-type').textContent = ct || '-';
      $('#info-url').textContent = res.url || '-';
      $('#res-output').textContent = output;
  
      const entries = [];
      res.headers.forEach((value, key) => entries.push([key, value]));
      renderKV($('#res-headers'), entries, 'Tidak ada header yang bisa dibaca (server mungkin tidak mengekspos header lewat CORS).');
      $('#cnt-res').textContent = '(' + entries.length + ')';
      renderRequestInfo();
      highlightStatus(res.status);
  
      $('#result').classList.remove('hidden');
      $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  
    function showFailure(err, ms) {
      const pill = $('#status-pill');
      pill.textContent = 'Error';
      pill.className = pillClass(500);
      $('#info-time').textContent = Math.round(ms) + ' ms';
      $('#info-size').textContent = '-';
      $('#info-type').textContent = '-';
      $('#info-url').textContent = '-';
      $('#res-image-wrap').classList.add('hidden');
      $('#info-meaning').textContent = 'Request tidak sampai ke server atau respons tidak terbaca (bukan kode HTTP).';
      $('#res-headers').innerHTML = '';
      $('#cnt-res').textContent = '';
      renderRequestInfo();
      highlightStatus(null);
      lastBlob = null;
      const aborted = err && err.name === 'AbortError';
      $('#res-output').textContent = aborted
        ? 'Request dibatalkan.'
        : (err && err.message ? err.message : 'Request gagal') +
          '\n\nKemungkinan penyebab:\n- Server tidak mengizinkan CORS\n- URL salah atau server mati\n- Koneksi internet bermasalah\n- Mixed content (halaman HTTPS memanggil URL HTTP)';
      if (!aborted && lastReq) {
        let kind = 'public';
        try { kind = hostKind(new URL(lastReq.url).hostname); } catch (e2) { /* abaikan */ }
        if (kind !== 'public') {
          $('#res-output').textContent += '\n\nTarget ini ' + (kind === 'localhost' ? 'localhost' : 'jaringan lokal') + ': pastikan server berjalan di port yang benar dan CORS diaktifkan (lihat panel Host / Environment, tombol Cek Koneksi).';
        }
      }
      $('#result').classList.remove('hidden');
      $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  
    /* ---------- riwayat ---------- */
    function loadHistory() {
      try { return JSON.parse(storageGet(HISTORY_KEY) || '[]'); } catch (e) { return []; }
    }
  
    function snapshot() {
      return {
        method: $('#method').value,
        url: $('#url').value,
        base: $('#base-url').value,
        bearer: $('#bearer').value,
        params: rowsToData($('#params-rows')),
        headers: rowsToData($('#headers-rows')),
        bodyType: $('#body-type').value,
        bodyText: $('#body-text').value,
        form: rowsToData($('#form-rows')),
      };
    }
  
    function restore(s) {
      $('#method').value = s.method || 'GET';
      $('#url').value = s.url || '';
      if (s.base !== undefined) {
        $('#base-url').value = s.base;
        updateHostUI();
      }
      $('#bearer').value = s.bearer || '';
      fillRows($('#params-rows'), s.params);
      fillRows($('#headers-rows'), s.headers);
      $('#body-type').value = s.bodyType || 'none';
      $('#body-text').value = s.bodyText || '';
      fillRows($('#form-rows'), s.form);
      updateBodyUI();
    }
  
    function pushHistory() {
      const snap = snapshot();
      const list = loadHistory().filter((h) => !(h.method === snap.method && h.url === snap.url && JSON.stringify(h.params) === JSON.stringify(snap.params)));
      list.unshift(snap);
      storageSet(HISTORY_KEY, JSON.stringify(list.slice(0, 10)));
      renderHistory();
    }
  
    function renderHistory() {
      const list = loadHistory();
      const ul = $('#history-list');
      ul.innerHTML = '';
      $('#history-empty').classList.toggle('hidden', list.length > 0);
      list.forEach((h) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'flex w-full items-center gap-3 py-2 text-left hover:text-red-600';
        const m = document.createElement('span');
        m.className = 'w-16 shrink-0 text-xs font-semibold';
        m.textContent = h.method;
        const u = document.createElement('span');
        u.className = 'min-w-0 flex-1 truncate text-xs';
        u.textContent = h.url;
        btn.append(m, u);
        btn.addEventListener('click', () => {
          restore(h);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        li.appendChild(btn);
        ul.appendChild(li);
      });
    }
  
    /* ---------- salin ---------- */
    async function copyText(text, btn) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e2) { /* abaikan */ }
        ta.remove();
      }
      if (btn) {
        const old = btn.textContent;
        btn.textContent = 'Tersalin';
        setTimeout(() => { btn.textContent = old; }, 1200);
      }
    }
  
    /* ---------- kirim ---------- */
    async function send(e) {
      e.preventDefault();
      hideMessage();
  
      let req;
      try {
        req = buildRequest();
      } catch (err) {
        showMessage(err.message, 'error');
        return;
      }
  
      lastReq = req;
      abortCtrl = new AbortController();
      const btn = $('#send-btn');
      btn.disabled = true;
      btn.textContent = 'Mengirim...';
      $('#cancel-btn').classList.remove('hidden');
  
      const start = performance.now();
      try {
        const res = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
          signal: abortCtrl.signal,
        });
        await showResponse(res, performance.now() - start);
        pushHistory();
      } catch (err) {
        showFailure(err, performance.now() - start);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Kirim Request';
        $('#cancel-btn').classList.add('hidden');
        abortCtrl = null;
      }
    }
  
    /* ---------- init ---------- */
    function init() {
      setupTabs('.tab-btn', 'tab', '#tab-', '.tab-panel');
      setupTabs('.rtab-btn', 'rtab', '#rtab-', '.rtab-panel');
  
      fillRows($('#params-rows'));
      fillRows($('#headers-rows'));
      fillRows($('#form-rows'));
      updateBodyUI();
      renderHistory();
      buildStatusRef();
      initHost();
  
      // delegasi: tambah / hapus baris, ganti tipe
      document.addEventListener('click', (ev) => {
        const add = ev.target.closest('[data-add]');
        if (add) {
          addRow($(add.dataset.add));
          updateBodyUI();
          return;
        }
        const del = ev.target.closest('.row-del');
        if (del) {
          const container = del.closest('[data-mode]');
          del.closest('.row').remove();
          if (!$('.row', container)) addRow(container);
          return;
        }
        const copy = ev.target.closest('[data-copy]');
        if (copy) {
          copyText($(copy.dataset.copy).textContent, copy);
        }
      });
      document.addEventListener('change', (ev) => {
        if (ev.target.classList.contains('row-type')) syncRowType(ev.target.closest('.row'));
      });
  
      $('#method').addEventListener('change', updateBodyUI);
      $('#body-type').addEventListener('change', updateBodyUI);
      $('#req-form').addEventListener('submit', send);
  
      $('#cancel-btn').addEventListener('click', () => { if (abortCtrl) abortCtrl.abort(); });
  
      $('#format-json').addEventListener('click', () => {
        const area = $('#body-text');
        const text = area.value;
        try {
          area.value = JSON.stringify(JSON.parse(text), null, 2);
          showMessage('JSON valid dan sudah dirapikan.', 'success');
          return;
        } catch (err) { /* coba perbaiki otomatis */ }
        try {
          const fixed = repairJSON(text);
          area.value = JSON.stringify(JSON.parse(fixed), null, 2);
          showMessage('JSON diperbaiki otomatis (kutip, key, atau koma diperbaiki). Periksa hasilnya sebelum dikirim.', 'success');
        } catch (err) {
          showMessage(describeJSONError(repairJSON(text), err).replace(' Klik "Rapikan / perbaiki JSON" untuk memperbaiki otomatis.', ' Perbaiki manual bagian tersebut.'), 'error');
        }
      });
  
      $('#curl-btn').addEventListener('click', () => {
        try {
          copyText(toCurl(buildRequest()), $('#curl-btn'));
          hideMessage();
        } catch (err) {
          showMessage(err.message, 'error');
        }
      });
  
      $('#reset-btn').addEventListener('click', () => {
        restore({});
        $('#bearer').value = '';
        hideMessage();
        $('#result').classList.add('hidden');
      });
  
      $('#download-btn').addEventListener('click', () => {
        if (!lastBlob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(lastBlob);
        a.download = lastFilename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });
  
      $('#clear-history').addEventListener('click', () => {
        storageSet(HISTORY_KEY, '[]');
        renderHistory();
      });
  
      // token tersimpan dari halaman token.html
      const saved = storageGet(TOKEN_KEY);
      if (saved) {
        const useBtn = $('#use-token');
        useBtn.classList.remove('hidden');
        useBtn.addEventListener('click', () => { $('#bearer').value = saved; });
      }
    }
  
    init();
  })();