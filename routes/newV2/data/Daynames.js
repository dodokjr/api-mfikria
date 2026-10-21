// Nama hari dalam banyak bahasa. Urutan array: Minggu(0) -> Sabtu(6) (sama dengan Date#getUTCDay)
const DEFAULT_LANG = 'id';

const LANGUAGES = {
  id: { name: 'Bahasa Indonesia', english: 'Indonesian', days: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] },
  en: { name: 'English',          english: 'English',    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  zh: { name: '中文 (普通话)',      english: 'Chinese (Mandarin)', days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'] },
  ar: { name: 'العربية',          english: 'Arabic',     days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] },
  ja: { name: '日本語',            english: 'Japanese',   days: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'] },
  ko: { name: '한국어',            english: 'Korean',     days: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'] },
  es: { name: 'Español',          english: 'Spanish',    days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] },
  tl: { name: 'Tagalog',          english: 'Tagalog (Filipino)', days: ['Linggo', 'Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes', 'Sabado'] },
  ca: { name: 'Català',           english: 'Catalan',    days: ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'] },
  fr: { name: 'Français',         english: 'French',     days: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] },
  de: { name: 'Deutsch',          english: 'German',     days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'] },
  pt: { name: 'Português',        english: 'Portuguese', days: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'] },
  it: { name: 'Italiano',         english: 'Italian',    days: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'] },
  nl: { name: 'Nederlands',       english: 'Dutch',      days: ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'] },
  ru: { name: 'Русский',          english: 'Russian',    days: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'] },
  hi: { name: 'हिन्दी',            english: 'Hindi',      days: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'] },
  tr: { name: 'Türkçe',           english: 'Turkish',    days: ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] },
  ms: { name: 'Bahasa Melayu',    english: 'Malay',      days: ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'] },
  th: { name: 'ไทย',              english: 'Thai',       days: ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'] },
  vi: { name: 'Tiếng Việt',       english: 'Vietnamese', days: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] },
};

// Alias kode yang sering dipakai
const ALIASES = { cn: 'zh', jp: 'ja', kr: 'ko', fil: 'tl', ph: 'tl', cat: 'ca', ind: 'id' };

// 'zh-CN' / 'ja_JP' / 'JA' -> 'zh' / 'ja' / 'ja'. Mengembalikan null bila tidak didukung.
function normalizeLang(input) {
  if (input === undefined || input === null || input === '') return DEFAULT_LANG;
  const key = String(input).toLowerCase().split(/[-_]/)[0];
  const code = ALIASES[key] || key;
  return Object.prototype.hasOwnProperty.call(LANGUAGES, code) ? code : null;
}

function getDayName(lang, dayOfWeek) {
  return (LANGUAGES[lang] || LANGUAGES[DEFAULT_LANG]).days[dayOfWeek];
}

module.exports = { DEFAULT_LANG, LANGUAGES, normalizeLang, getDayName };