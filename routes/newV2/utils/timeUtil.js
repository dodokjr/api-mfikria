// Utility waktu berbasis Intl (tanpa library tambahan, Node >= 18)

const { DEFAULT_LANG, getDayName } = require('../data/Daynames');

// ---------------------------------------------------------------------------
// Cache formatter: Intl.DateTimeFormat mahal dibuat, jadi cukup 1x per zona
// ---------------------------------------------------------------------------
const formatterCache = new Map();

function getFormatter(timeZone) {
  let f = formatterCache.get(timeZone);
  if (!f) {
    if (formatterCache.size > 1000) formatterCache.clear(); // batas aman
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

function isValidTimezone(tz) {
  if (!tz || typeof tz !== 'string') return false;
  try {
    getFormatter(tz);
    return true;
  } catch {
    return false;
  }
}

// Nama zona kanonik (mis. "asia/tokyo" -> "Asia/Tokyo")
function canonicalTimezone(tz) {
  return getFormatter(tz).resolvedOptions().timeZone;
}

const pad = (n) => String(n).padStart(2, '0');

function getTimeInfo(timeZone, date = new Date(), lang = DEFAULT_LANG) {
  const ts = date.getTime();

  const p = {};
  for (const x of getFormatter(timeZone).formatToParts(date)) {
    if (x.type !== 'literal') p[x.type] = x.value;
  }
  const year = +p.year, month = +p.month, day = +p.day;
  const hour = +p.hour % 24, minute = +p.minute, second = +p.second;

  // Offset dihitung dengan aritmetika (tanpa formatter tambahan)
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMin = Math.round((localAsUtc - Math.floor(ts / 1000) * 1000) / 60000);
  const sign = offsetMin < 0 ? '-' : '+';
  const abs = Math.abs(offsetMin);
  const utcOffset = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;

  const dateStr = `${p.year}-${p.month}-${p.day}`;
  const timeStr = `${pad(hour)}:${p.minute}:${p.second}`;

  return {
    timezone: timeZone,
    utcOffset,
    day: getDayName(lang, new Date(Date.UTC(year, month - 1, day)).getUTCDay()),
    date: dateStr,
    time: timeStr,
    datetime: `${dateStr}T${timeStr}${utcOffset}`,
    timestamp: ts,
  };
}

// ---------------------------------------------------------------------------
// SSE dengan broadcaster bersama:
// - 1 timer per "channel" (bukan per klien)
// - payload dihitung & di-stringify 1x per detik, lalu dikirim ke semua klien
// - channel otomatis berhenti saat tidak ada klien
// ---------------------------------------------------------------------------
const channels = new Map();

function streamSSE(req, res, key, buildPayload, intervalMs = 1000) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  let ch = channels.get(key);
  const isNew = !ch;

  if (isNew) {
    ch = { clients: new Set(), last: null, timer: null };
    ch.tick = () => {
      ch.last = `data: ${JSON.stringify(buildPayload())}\n\n`;
      for (const client of ch.clients) {
        if (!client.writableNeedDrain) client.write(ch.last); // lewati klien yang lambat
      }
    };
    channels.set(key, ch);
  }

  ch.clients.add(res);

  if (isNew) {
    ch.tick();
    ch.timer = setInterval(ch.tick, intervalMs);
  } else if (ch.last) {
    res.write(ch.last); // klien baru langsung dapat data terakhir
  }

  req.on('close', () => {
    ch.clients.delete(res);
    if (ch.clients.size === 0) {
      clearInterval(ch.timer);
      channels.delete(key);
    }
  });
}

module.exports = { isValidTimezone, canonicalTimezone, getTimeInfo, streamSSE };