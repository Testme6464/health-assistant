'use strict';
/* ============================================================
   Health Assistant App — single-page, offline-first, localStorage only.
   All UI strings are Burmese. Code comments in English.
   ============================================================ */

// ---------------- utils ----------------
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const uid = () => 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad2 = (n) => String(n).padStart(2, '0');
function todayStr(d) {
  const t = d || new Date();
  return t.getFullYear() + '-' + pad2(t.getMonth() + 1) + '-' + pad2(t.getDate());
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return todayStr(d);
}
function nowHM() {
  const d = new Date();
  return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function hmToMin(hm) { const p = String(hm).split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
function minToHm(m) { m = ((m % 1440) + 1440) % 1440; return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); }
const MM_MONTHS = ['ဇန်နဝါရီ','ဖေဖော်ဝါရီ','မတ်','ဧပြီ','မေ','ဇွန်','ဇူလိုင်','ဩဂုတ်','စက်တင်ဘာ','အောက်တိုဘာ','နိုဝင်ဘာ','ဒီဇင်ဘာ'];
function fmtDateMm(dateStr) {
  if (!dateStr) return '';
  const p = dateStr.split('-');
  return p[2].replace(/^0/, '') + ' ' + MM_MONTHS[+p[1] - 1] + ' ' + p[0];
}
function fmtTimeMm(hm) { // 24h -> Burmese 12h label
  if (!hm) return '';
  let h = +hm.split(':')[0], m = hm.split(':')[1];
  const ap = h < 12 ? 'နံနက်' : (h < 17 ? 'နေ့လယ်' : (h < 20 ? 'ညနေ' : 'ည'));
  let h12 = h % 12; if (h12 === 0) h12 = 12;
  return ap + ' ' + h12 + ':' + m;
}

// ---------------- store (localStorage, versioned) ----------------
const STORE_KEY = 'healthAppV1';
function defaultDB() {
  const p1 = uid();
  return {
    version: 1,
    activeProfileId: p1,
    profiles: [{
      id: p1, name: 'ကျွန်ုပ်', age: '', gender: '', height: '', weight: '',
      bloodType: '', conditions: [], familyHistory: [], allergies: [],
      goal: 'maintain', periodEnabled: false
    }],
    meds: [],            // {id,profileId,name,dosage,times[],reason,supplyDays,supplyStartDate}
    medLog: {},          // date -> { "medId@HH:MM": "taken"|"missed" }
    foodLog: [],         // {id,profileId,date,time,name,kcal,amount,source}
    waterLog: {},        // date -> ml
    sleepLog: [],        // {id,profileId,date,bedtime,wakeTime,quality,nightmare}
    activityLog: [],     // {id,profileId,date,steps,minutes}
    weightLog: [],       // {id,profileId,date,weight,waist}
    symptoms: [],        // {id,profileId,date,time,name,severity,note}
    emergencyContacts: [], // {id,name,phone,relation}
    periodLog: [],       // {id,profileId,start}
    plans: {},           // profileId -> {month,createdAt,ai,meals,sleep,workout,diet,tip,rawAi}
    reminders: { waterEnabled: true, waterInterval: 120, waterStart: '08:00', waterEnd: '21:00',
                 medEnabled: true, sleepEnabled: true, bedtime: '22:30' },
    settings: { geminiKey: '', geminiModel: 'gemini-3.8-flash', openaiKey: '', claudeKey: '',
                customBase: '', customKey: '', customModel: '', pollinations: false,
                googleClientId: '',
                googleUser: null, calorieTargetMode: 'auto', calorieTarget: 2000, waterTargetMl: 2000 }
  };
}
let DB = defaultDB();
function loadDB() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) { DB = Object.assign(defaultDB(), parsed); return; }
    }
  } catch (e) { console.warn('loadDB failed', e); }
}
function saveDB() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); }
  catch (e) { toast('သိမ်းဆည်း၍မရပါ (storage ပြည့်နေနိုင်သည်)'); }
}
function activeProfile() {
  return DB.profiles.find(p => p.id === DB.activeProfileId) || DB.profiles[0];
}

// ---------------- toast & modal ----------------
let toastTimer = null;
function toast(msg, ms) {
  const t = $('toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), ms || 2500);
}
function openModal(title, html) {
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = html;
  $('modalOverlay').classList.remove('hidden');
}
function closeModal() { $('modalOverlay').classList.add('hidden'); }

// ---------------- navigation ----------------
const TABS = [
  { id: 'home',      ico: '🏠', label: 'ပင်မ' },
  { id: 'profile',   ico: '👤', label: 'ကျန်းမာရေးဖိုင်' },
  { id: 'meds',      ico: '💊', label: 'ဆေးဝါးများ' },
  { id: 'plan',      ico: '🗓️', label: 'အစီအစဉ်' },
  { id: 'food',      ico: '🍚', label: 'အစားအသောက်' },
  { id: 'remind',    ico: '⏰', label: 'သတိပေးချက်များ' },
  { id: 'progress',  ico: '📊', label: 'တိုးတက်မှု' },
  { id: 'symptom',   ico: '📝', label: 'လက္ခဏာ' },
  { id: 'emergency', ico: '🚨', label: 'အရေးပေါ်' },
  { id: 'period',    ico: '🩸', label: 'ရာသီစက်' },
  { id: 'report',    ico: '🖨️', label: 'အစီရင်ခံစာ' },
  { id: 'settings',  ico: '⚙️', label: 'ဆက်တင်' },
];
let currentTab = 'home';
function buildTabbar() {
  $('tabbar').innerHTML = TABS.map(t =>
    '<button class="tab" data-tab="' + t.id + '" aria-label="' + esc(t.label) + '">' +
    '<span class="ico">' + t.ico + '</span><span>' + esc(t.label) + '</span></button>'
  ).join('');
  $('tabbar').addEventListener('click', (e) => {
    const b = e.target.closest('.tab');
    if (b) showTab(b.dataset.tab);
  });
}
function showTab(id) {
  currentTab = id;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const sec = $('view-' + id);
  if (sec) sec.classList.add('active');
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  RENDER[id] && RENDER[id]();
  window.scrollTo(0, 0);
}

// ---------------- health math ----------------
function calcBMI(p) {
  const h = parseFloat(p.height), w = parseFloat(p.weight);
  if (!h || !w || h <= 0) return null;
  return w / Math.pow(h / 100, 2);
}
function bmiLabel(bmi) {
  if (bmi == null) return '—';
  if (bmi < 18.5) return 'ပိန်လွန်းသည်';
  if (bmi < 23) return 'ပုံမှန်';
  if (bmi < 25) return 'အနည်းငယ် ဝသည်';
  if (bmi < 30) return 'ဝသည်';
  return 'အလွန်ဝသည်';
}
function calorieTarget(p) {
  if (DB.settings.calorieTargetMode === 'manual') return DB.settings.calorieTarget || 2000;
  const w = parseFloat(p.weight) || 60, h = parseFloat(p.height) || 160, a = parseFloat(p.age) || 30;
  let bmr = (p.gender === 'female')
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5;
  let tdee = bmr * 1.375; // light activity default
  if (p.goal === 'lose') tdee -= 500;
  else if (p.goal === 'gain') tdee += 300;
  return Math.max(1200, Math.round(tdee / 50) * 50);
}
const GOAL_LABEL = { lose: 'ကိုယ်အလေးချိန်လျှော့ချရန်', maintain: 'ထိန်းသိမ်းရန်', gain: 'တိုးရန်' };

// ---------------- AI (BYOK) ----------------
function aiProvider() {
  const s = DB.settings;
  if (s.customKey && s.customBase) return 'custom';
  if (s.geminiKey) return 'gemini';
  if (s.openaiKey) return 'openai';
  if (s.claudeKey) return 'claude';
  if (s.pollinations) return 'pollinations';
  return null;
}
// User-chosen Gemini model; falls back to gemini-3.8-flash for old saved settings.
function geminiModelName() {
  const m = (DB.settings && DB.settings.geminiModel || '').trim();
  return m || 'gemini-3.8-flash';
}
// Fetch with automatic retry for transient Gemini overload/rate-limit (503/429),
// network failures and hung requests. Free-tier models often spike; retry a few
// times with growing delays before giving up. onRetry(attempt, total) is called
// before each retry so the UI can show progress instead of looking stuck.
async function fetchWithRetry(url, opts, tries, onRetry) {
  tries = tries || 3;
  const TIMEOUT_MS = 25000;
  const sleep = (ms) => new Promise(res => setTimeout(res, ms));
  // If the API tells us how long to wait ("Retry after 7s"), honor it (capped at 90s).
  const retryDelayMs = (msg, attempt) => {
    const m = /retry after (\d+)\s*s/i.exec(msg || '');
    if (m) return Math.min(parseInt(m[1], 10), 90) * 1000;
    return (attempt + 1) * 4000;
  };
  let lastErr = new Error('AI ခေါ်ဆို၍မရပါ');
  for (let i = 0; i < tries; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(url, Object.assign({}, opts, { signal: ctrl.signal }));
      clearTimeout(timer);
      let j = {};
      try { j = await r.json(); } catch (e) { /* non-JSON body */ }
      // Some free APIs (e.g. Pollinations) return HTTP 200 with an error object on rate limits.
      const bodyErr = j && j.error ? (j.error.message || j.error) : null;
      if (r.ok && !bodyErr) return j;
      const msg = (typeof bodyErr === 'string' ? bodyErr : (bodyErr ? JSON.stringify(bodyErr) : null)) || ('HTTP ' + r.status);
      lastErr = new Error(msg);
      const looksRateLimit = /rate|limit|too many|45 seconds|overloaded|high demand/i.test(msg);
      const retryableStatus = (r.status === 429 || r.status === 503) || (r.ok && looksRateLimit);
      if (i < tries - 1 && retryableStatus) {
        if (onRetry) onRetry(i + 2, tries);
        await sleep(retryDelayMs(msg, i));
        continue;
      }
      throw lastErr;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      // TypeError = network failure, AbortError = our 25s timeout fired
      const retryable = (e instanceof TypeError) || (e && e.name === 'AbortError');
      if (i < tries - 1 && retryable) {
        if (onRetry) onRetry(i + 2, tries);
        await sleep(retryDelayMs(e.message, i));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}
// ---- Zawgyi -> Unicode (rules from rabbit-node, MIT license) ----
const zg2uni = (output) => {
  const rule = [{
      "from": "\u200B",
      "to": ""
    },
    {
      "from": "(\u103d|\u1087)",
      "to": "\u103e"
    },
    {
      "from": "\u103c",
      "to": "\u103d"
    },
    {
      "from": "(\u103b|\u107e|\u107f|\u1080|\u1081|\u1082|\u1083|\u1084)",
      "to": "\u103c"
    },
    {
      "from": "(\u103a|\u107d)",
      "to": "\u103b"
    },
    {
      "from": "\u1039",
      "to": "\u103a"
    },
    {
      "from": "(\u1066|\u1067)",
      "to": "\u1039\u1006"
    },
    {
      "from": "\u106a",
      "to": "\u1009"
    },
    {
      "from": "\u106b",
      "to": "\u100a"
    },
    {
      "from": "\u106c",
      "to": "\u1039\u100b"
    },
    {
      "from": "\u106d",
      "to": "\u1039\u100c"
    },
    {
      "from": "\u106e",
      "to": "\u100d\u1039\u100d"
    },
    {
      "from": "\u106f",
      "to": "\u100d\u1039\u100e"
    },
    {
      "from": "\u1070",
      "to": "\u1039\u100f"
    },
    {
      "from": "(\u1071|\u1072)",
      "to": "\u1039\u1010"
    },
    {
      "from": "\u1060",
      "to": "\u1039\u1000"
    },
    {
      "from": "\u1061",
      "to": "\u1039\u1001"
    },
    {
      "from": "\u1062",
      "to": "\u1039\u1002"
    },
    {
      "from": "\u1063",
      "to": "\u1039\u1003"
    },
    {
      "from": "\u1065",
      "to": "\u1039\u1005"
    },
    {
      "from": "\u1068",
      "to": "\u1039\u1007"
    },
    {
      "from": "\u1069",
      "to": "\u1039\u1008"
    },
    {
      "from": "(\u1073|\u1074)",
      "to": "\u1039\u1011"
    },
    {
      "from": "\u1075",
      "to": "\u1039\u1012"
    },
    {
      "from": "\u1076",
      "to": "\u1039\u1013"
    },
    {
      "from": "\u1077",
      "to": "\u1039\u1014"
    },
    {
      "from": "\u1078",
      "to": "\u1039\u1015"
    },
    {
      "from": "\u1079",
      "to": "\u1039\u1016"
    },
    {
      "from": "\u107a",
      "to": "\u1039\u1017"
    },
    {
      "from": "\u107c",
      "to": "\u1039\u1019"
    },
    {
      "from": "\u1085",
      "to": "\u1039\u101c"
    },
    {
      "from": "\u1033",
      "to": "\u102f"
    },
    {
      "from": "\u1034",
      "to": "\u1030"
    },
    {
      "from": "\u103f",
      "to": "\u1030"
    },
    {
      "from": "\u1086",
      "to": "\u103f"
    },
    {
      "from": "\u1036\u1088",
      "to": "\u1088\u1036"
    },
    {
      "from": "\u1088",
      "to": "\u103e\u102f"
    },
    {
      "from": "\u1089",
      "to": "\u103e\u1030"
    },
    {
      "from": "\u108a",
      "to": "\u103d\u103e"
    },
    {
      "from": "\u103B\u1064",
      "to": "\u1064\u103B"
    },
    {
      "from": "(\u1031)?([\u1000-\u1021])\u1064",
      "to": "\u1004\u103a\u1039$1$2"
    },
    {
      "from": "(\u1031)?([\u1000-\u1021])\u108b",
      "to": "\u1004\u103a\u1039$1$2\u102d"
    },
    {
      "from": "(\u1031)?([\u1000-\u1021])\u108c",
      "to": "\u1004\u103a\u1039$1$2\u102e"
    },
    {
      "from": "(\u1031)?([\u1000-\u1021])\u108d",
      "to": "\u1004\u103a\u1039$1$2\u1036"
    },
    {
      "from": "\u108e",
      "to": "\u102d\u1036"
    },
    {
      "from": "\u108f",
      "to": "\u1014"
    },
    {
      "from": "\u1090",
      "to": "\u101b"
    },
    {
      "from": "\u1091",
      "to": "\u100f\u1039\u100d"
    },
    {
      "from": "\u1019\u102c(\u107b|\u1093)",
      "to": "\u1019\u1039\u1018\u102c"
    },
    {
      "from": "(\u107b|\u1093)",
      "to": "\u1039\u1018"
    },
    {
      "from": "(\u1094|\u1095)",
      "to": "\u1037"
    },
    {
      "from": "([\u1000-\u1021])\u1037\u1032",
      "to": "$1\u1032\u1037"
    },
    {
      "from": "\u1096",
      "to": "\u1039\u1010\u103d"
    },
    {
      "from": "\u1097",
      "to": "\u100b\u1039\u100b"
    },
    {
      "from": "\u103c([\u1000-\u1021])([\u1000-\u1021])?",
      "to": "$1\u103c$2"
    },
    {
      "from": "([\u1000-\u1021])\u103c\u103a",
      "to": "\u103c$1\u103a"
    },
    {
      "from": "\u1047(?=[\u102c-\u1030\u1032\u1036-\u1038\u103d\u1038])",
      "to": "\u101b"
    },
    {
      "from": "\u1031\u1047",
      "to": "\u1031\u101b"
    },
    {
      "from": "\u1040(\u102e|\u102f|\u102d\u102f|\u1030|\u1036|\u103d|\u103e)",
      "to": "\u101d$1"
    },
    {
      "from": "([^\u1040\u1041\u1042\u1043\u1044\u1045\u1046\u1047\u1048\u1049])\u1040\u102b",
      "to": "$1\u101d\u102b"
    },
    {
      "from": "([\u1040\u1041\u1042\u1043\u1044\u1045\u1046\u1047\u1048\u1049])\u1040\u102b(?!\u1038)",
      "to": "$1\u101d\u102b"
    },
    {
      "from": "^\u1040(?=\u102b)",
      "to": "\u101d"
    },
    {
      "from": "\u1040\u102d(?!\u0020?/)",
      "to": "\u101d\u102d"
    },
    {
      "from": "([^\u1040-\u1049])\u1040([^\u1040-\u1049\u0020]|[\u104a\u104b])",
      "to": "$1\u101d$2"
    },
    {
      "from": "([^\u1040-\u1049])\u1040(?=[\\f\\n\\r])",
      "to": "$1\u101d"
    },
    {
      "from": "([^\u1040-\u1049])\u1040$",
      "to": "$1\u101d"
    },
    {
      "from": "\u1031([\u1000-\u1021])(\u103e)?(\u103b)?",
      "to": "$1$2$3\u1031"
    },
    {
      "from": "([\u1000-\u1021])\u1031([\u103b\u103c\u103d\u103e]+)",
      "to": "$1$2\u1031"
    },
    {
      "from": "\u1032\u103d",
      "to": "\u103d\u1032"
    },
    {
      "from": "([\u102d\u102e])\u103b",
      "to": "\u103b$1"
    },
    {
      "from": "\u103d\u103b",
      "to": "\u103b\u103d"
    },
    {
      "from": "\u103a\u1037",
      "to": "\u1037\u103a"
    },
    {
      "from": "\u102f(\u102d|\u102e|\u1036|\u1037)\u102f",
      "to": "\u102f$1"
    },
    {
      "from": "(\u102f|\u1030)(\u102d|\u102e)",
      "to": "$2$1"
    },
    {
      "from": "(\u103e)(\u103b|\u103c)",
      "to": "$2$1"
    },
    {
      "from": "\u1025(?=[\u1037]?[\u103a\u102c])",
      "to": "\u1009"
    },
    {
      "from": "\u1025\u102e",
      "to": "\u1026"
    },
    {
      "from": "\u1005\u103b",
      "to": "\u1008"
    },
    {
      "from": "\u1036(\u102f|\u1030)",
      "to": "$1\u1036"
    },
    {
      "from": "\u1031\u1037\u103e",
      "to": "\u103e\u1031\u1037"
    },
    {
      "from": "\u1031\u103e\u102c",
      "to": "\u103e\u1031\u102c"
    },
    {
      "from": "\u105a",
      "to": "\u102b\u103a"
    },
    {
      "from": "\u1031\u103b\u103e",
      "to": "\u103b\u103e\u1031"
    },
    {
      "from": "(\u102d|\u102e)(\u103d|\u103e)",
      "to": "$2$1"
    },
    {
      "from": "\u102c\u1039([\u1000-\u1021])",
      "to": "\u1039$1\u102c"
    },
    {
      "from": "\u103c\u1004\u103a\u1039([\u1000-\u1021])",
      "to": "\u1004\u103a\u1039$1\u103c"
    },
    {
      "from": "\u1039\u103c\u103a\u1039([\u1000-\u1021])",
      "to": "\u103a\u1039$1\u103c"
    },
    {
      "from": "\u103c\u1039([\u1000-\u1021])",
      "to": "\u1039$1\u103c"
    },
    {
      "from": "\u1036\u1039([\u1000-\u1021])",
      "to": "\u1039$1\u1036"
    },
    {
      "from": "\u1092",
      "to": "\u100b\u1039\u100c"
    },
    {
      "from": "\u104e",
      "to": "\u104e\u1004\u103a\u1038"
    },
    {
      "from": "\u1040(\u102b|\u102c|\u1036)",
      "to": "\u101d$1"
    },
    {
      "from": "\u1025\u1039",
      "to": "\u1009\u1039"
    },
    {
      "from": "([\u1000-\u1021])\u103c\u1031\u103d",
      "to": "$1\u103c\u103d\u1031"
    },
    {
      "from": "([\u1000-\u1021])\u103b\u1031\u103d(\u103e)?",
      "to": "$1\u103b\u103d$2\u1031"
    },
    {
      "from": "([\u1000-\u1021])\u103d\u1031\u103b",
      "to": "$1\u103b\u103d\u1031"
    },
    {
      "from": "([\u1000-\u1021])\u1031(\u1039[\u1000-\u1021])",
      "to": "$1$2\u1031"
    },
    {
      "from": "\u1038\u103a",
      "to": "\u103a\u1038"
    },
    {
      "from": "\u102d\u103a|\u103a\u102d",
      "to": "\u102d"
    },
    {
      "from": "\u102d\u102f\u103a",
      "to": "\u102d\u102f"
    },
    {
      "from": "\u0020\u1037",
      "to": "\u1037"
    },
    {
      "from": "\u1037\u1036",
      "to": "\u1036\u1037"
    },
    {
      "from": " \u1037",
      "to": "\u1037"
    },
    {
      "from": "[\u102d]+",
      "to": "\u102d"
    },
    {
      "from": "[\u103a]+",
      "to": "\u103a"
    },
    {
      "from": "[\u103d]+",
      "to": "\u103d"
    },
    {
      "from": "[\u1037]+",
      "to": "\u1037"
    },
    {
      "from": "[\u102e]+",
      "to": "\u102e"
    },
    {
      "from": "\u102d\u102e|\u102e\u102d",
      "to": "\u102e"
    },
    {
      "from": "\u102f\u102d",
      "to": "\u102d\u102f"
    },
    {
      "from": "\u1037\u1037",
      "to": "\u1037"
    },
    {
      "from": "\u1032\u1032",
      "to": "\u1032"
    },
    {
      "from": "\u1044\u1004\u103a\u1038",
      "to": "\u104E\u1004\u103a\u1038"
    },
    {
      "from": "([\u102d\u102e])\u1039([\u1000-\u1021])",
      "to": "\u1039$2$1"
    },
    {
      "from": "\u1036\u103d",
      "to": "\u103d\u1036"
    }
  ];
  return replace_with_rule(rule, output);
}
const replace_with_rule = (rule, output) => {

  const max_loop = rule.length;
  for(let i=0; i < max_loop; i++) {

    const data = rule[i];
    const from = data["from"];
    const to = data["to"];

    const from_regex = new RegExp(from,"g");
    output = output.replace(from_regex, to);
  }

  return output;

}
// Detect Zawgyi: vowel sign E (U+1031) stored AFTER a consonant is invalid in Unicode.
function looksZawgyi(t) {
  return /[\u1050-\u109F]/.test(t) || /[\u1000-\u1021][\u102B-\u1030\u1032-\u103E]*\u1031/.test(t);
}
function toUnicodeMyanmar(t) {
  if (t == null) return t;
  t = String(t);
  return looksZawgyi(t) ? zg2uni(t) : t;
}

// Client-side throttle for Pollinations free lane (~1 reply per 45s per IP).
let lastPollinationsCall = 0;
async function aiChatRaw(systemPrompt, userPrompt, onRetry) {
  const s = DB.settings, prov = aiProvider();
  if (!prov) throw new Error('API key မရှိပါ');  if (prov === 'gemini') {
    const j = await fetchWithRetry('https://generativelanguage.googleapis.com/v1beta/models/' + geminiModelName() + ':generateContent?key=' + encodeURIComponent(s.geminiKey), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }] })
    }, 3, onRetry);
    return j.candidates[0].content.parts.map(p => p.text || '').join('');
  }
  if (prov === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + s.openaiKey },
      body: JSON.stringify({ model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
    return j.choices[0].message.content;
  }
  // custom OpenAI-compatible provider (Groq, OpenRouter, ...): base URL + key + model
  if (prov === 'custom') {
    let base = (s.customBase || '').trim().replace(/\/+$/, '');
    // tolerate the full endpoint pasted by the user — don't double the path
    if (!/\/chat\/completions$/.test(base)) base += '/chat/completions';
    const j = await fetchWithRetry(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + s.customKey },
      body: JSON.stringify({ model: (s.customModel || '').trim() || 'openai/gpt-oss-20b',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] })
    }, 3, onRetry);
    return j.choices[0].message.content;
  }
  // pollinations: free, no signup, no key — OpenAI-compatible endpoint
  if (prov === 'pollinations') {
    const gapMs = 45000 - (Date.now() - lastPollinationsCall);
    if (gapMs > 0) {
      if (onRetry) onRetry(0, 0, 'wait');
      await new Promise(res => setTimeout(res, gapMs));
    }
    lastPollinationsCall = Date.now();
    const j = await fetchWithRetry('https://text.pollinations.ai/openai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] })
    }, 3, onRetry);
    if (j && j.choices && j.choices[0] && j.choices[0].message)
      return j.choices[0].message.content;
    return (typeof j === 'string') ? j : JSON.stringify(j);
  }
  // claude
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',
      'x-api-key': s.claudeKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: 'claude-3-5-haiku-latest', max_tokens: 1500,
      system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
  return j.content.map(b => b.text || '').join('');
}
// Wrapper: small free models often emit Zawgyi-encoded Burmese; normalize to Unicode.
async function aiChat(systemPrompt, userPrompt, onRetry) {
  return toUnicodeMyanmar(await aiChatRaw(systemPrompt, userPrompt, onRetry));
}
// Gemini vision for food photo analysis. Returns {items:[{name,kcal}], totalKcal, note}
async function geminiFoodVision(dataUrl, onRetry) {
  const s = DB.settings;
  if (!s.geminiKey) throw new Error('Gemini API key မထည့်ထားပါ');
  const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!m) throw new Error('ပုံဖိုင် မမှန်ပါ');
  const prompt = 'Analyze this food photo. Identify each visible food item and estimate calories ' +
    'for a typical serving. Reply ONLY with JSON: {"items":[{"name":"<Burmese name>","kcal":<number>}],"totalKcal":<number>}. ' +
    'Use Burmese (Myanmar script) for names. If no food is visible, return {"items":[],"totalKcal":0}.';
  const j = await fetchWithRetry('https://generativelanguage.googleapis.com/v1beta/models/' + geminiModelName() + ':generateContent?key=' + encodeURIComponent(s.geminiKey), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt },
      { inline_data: { mime_type: m[1], data: m[2] } }] }] })
  }, 3, onRetry);
  const text = toUnicodeMyanmar(j.candidates[0].content.parts.map(p => p.text || '').join(''));
  const jm = text.match(/\{[\s\S]*\}/);
  if (!jm) throw new Error('AI အဖြေကို ဖတ်မရပါ');
  const parsed = JSON.parse(jm[0]);
  return { items: parsed.items || [], totalKcal: parsed.totalKcal || 0 };
}

// ---------------- profile switcher (top bar) ----------------
function refreshProfileSwitcher() {
  const sel = $('profileSwitcher');
  sel.innerHTML = DB.profiles.map(p =>
    '<option value="' + p.id + '"' + (p.id === DB.activeProfileId ? ' selected' : '') + '>' + esc(p.name) + '</option>'
  ).join('');
}
function switchProfile(id) {
  DB.activeProfileId = id; saveDB();
  showTab(currentTab);
}

// ---------------- rule-based daily coach tips ----------------
const COACH_TIPS = [
  'ရေကို တစ်နေ့ အနည်းဆုံး ၈ ခွက် (၂ လီတာ) သောက်ပါ။',
  'ထမင်းစားပြီးတိုင်း ၁၀ မိနစ်လောက် လမ်းလျှောက်ပေးပါ။',
  'ည ၁၀ နာရီခွဲမတိုင်မီ အိပ်ရာဝင်ဖို့ ကြိုးစားပါ။',
  'အချိုရည်အစား ရေသန့် (သို့) သံပုရာရည် သောက်ပါ။',
  'ဆေးကို အချိန်မှန်သောက်ဖို့ သတိပေးချက်ဖွင့်ထားပါ။',
  'ဟင်းသီးဟင်းရွက် များများစားပါ — ထမင်းတစ်ပန်းကန်ရဲ့ ထက်ဝက်က အရွက်ဖြစ်ပါစေ။',
  'တစ်နေ့ မိနစ် ၃၀ လမ်းလျှောက်ခြင်းက နှလုံးကျန်းမာရေးအတွက် အကောင်းဆုံးပါ။',
  'အိပ်ရာမဝင်မီ ၁ နာရီအလိုမှာ ဖုန်းကို ချထားပါ။',
  'အစာကို ဖြည်းဖြည်းချင်း ဝါးစားပါ — ဗိုက်ပြည့်တယ်လို့ ဦးနှောက်က သိဖို့ မိနစ် ၂၀ လိုပါတယ်။',
  'ဆားလျှော့စားပါ — ငံပြာရည်၊ ငါးပိရည်ကို အနည်းငယ်သာ သုံးပါ။',
  'မနက်စာကို ဘယ်တော့မှ မလွတ်ပါနဲ့။',
  'စိတ်ဖိစီးမှုများရင် အသက်ကို နက်နက်ရှုပြီး ၅ မိနစ် အနားယူပါ။',
];
function tipOfDay() {
  const d = new Date();
  const idx = (d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate()) % COACH_TIPS.length;
  return COACH_TIPS[idx];
}

// ---------------- hand-rolled canvas line chart ----------------
function drawLineChart(canvasId, series, opts) {
  // series: [{label, color, points:[{x: 'label', y: number}]}]
  const cv = $(canvasId);
  if (!cv) return;
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth || 320, H = 220;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);
  const o = Object.assign({ min: null, max: null, unit: '', showDots: true }, opts || {});
  let allY = [];
  series.forEach(s => s.points.forEach(p => { if (p.y != null) allY.push(p.y); }));
  if (!allY.length) {
    ctx.fillStyle = '#6b7a74'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('မှတ်တမ်း မရှိသေးပါ', W / 2, H / 2);
    return;
  }
  let min = o.min != null ? o.min : Math.min.apply(null, allY);
  let max = o.max != null ? o.max : Math.max.apply(null, allY);
  if (min === max) { min -= 1; max += 1; }
  const padL = 44, padR = 10, padT = 14, padB = 28;
  const iw = W - padL - padR, ih = H - padT - padB;
  const n = Math.max.apply(null, series.map(s => s.points.length));
  const X = (i) => padL + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const Y = (v) => padT + ih - ((v - min) / (max - min)) * ih;
  // grid + y labels
  ctx.strokeStyle = '#e3eae7'; ctx.fillStyle = '#6b7a74'; ctx.font = '11px sans-serif';
  ctx.textAlign = 'right'; ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const v = min + (max - min) * g / 4;
    const y = Y(v);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillText((Math.round(v * 10) / 10) + o.unit, padL - 6, y + 4);
  }
  // x labels (sparse)
  ctx.textAlign = 'center';
  const step = Math.ceil(n / 6);
  for (let i = 0; i < n; i += step) {
    const lbl = series[0].points[i] ? series[0].points[i].x : '';
    ctx.fillText(lbl, X(i), H - 8);
  }
  // series lines
  series.forEach(s => {
    ctx.strokeStyle = s.color; ctx.lineWidth = 2.5; ctx.beginPath();
    let started = false;
    s.points.forEach((p, i) => {
      if (p.y == null) { started = false; return; }
      if (!started) { ctx.moveTo(X(i), Y(p.y)); started = true; }
      else ctx.lineTo(X(i), Y(p.y));
    });
    ctx.stroke();
    if (o.showDots) {
      ctx.fillStyle = s.color;
      s.points.forEach((p, i) => {
        if (p.y == null) return;
        ctx.beginPath(); ctx.arc(X(i), Y(p.y), 3.5, 0, Math.PI * 2); ctx.fill();
      });
    }
  });
  // legend
  ctx.textAlign = 'left'; ctx.font = '12px sans-serif';
  let lx = padL;
  series.forEach(s => {
    ctx.fillStyle = s.color; ctx.fillRect(lx, 6, 14, 4);
    ctx.fillStyle = '#1c2421'; ctx.fillText(s.label, lx + 18, 12);
    lx += ctx.measureText(s.label).width + 44;
  });
}

// ============================================================
// VIEW: 🏠 ပင်မ (Dashboard)
// ============================================================
function renderHome() {
  const p = activeProfile();
  const t = todayStr();
  const kcalTarget = calorieTarget(p);
  const kcalToday = DB.foodLog.filter(f => f.profileId === p.id && f.date === t)
    .reduce((a, f) => a + (+f.kcal || 0), 0);
  const waterTarget = DB.settings.waterTargetMl || 2000;
  const waterToday = DB.waterLog[t] || 0;
  const medsToday = todaysMedSchedule(p.id, t);
  const takenCount = medsToday.filter(m => m.status === 'taken').length;
  const missedCount = medsToday.filter(m => m.status === 'missed').length;
  const act = DB.activityLog.find(a => a.profileId === p.id && a.date === t);
  const stepsToday = act ? act.steps : 0;
  const wl = DB.weightLog.filter(w => w.profileId === p.id).sort((a, b) => a.date < b.date ? -1 : 1).slice(-14);
  const kcalPct = Math.min(100, Math.round(kcalToday / kcalTarget * 100));
  const waterPct = Math.min(100, Math.round(waterToday / waterTarget * 100));

  let html = '<div class="card"><div class="row space-between">' +
    '<h3>ဒီနေ့ အကျဉ်းချုပ်</h3><span class="muted">' + fmtDateMm(t) + '</span></div>' +
    '<div class="muted">' + esc(p.name) + ' · ရည်မှန်းချက်: ' + GOAL_LABEL[p.goal || 'maintain'] + '</div></div>';

  // calories
  html += '<div class="card"><h3>🍚 ကယ်လိုရီ</h3>' +
    '<div class="row space-between"><b>' + kcalToday + ' kcal</b><span class="muted">ရည်မှန်း ' + kcalTarget + ' kcal</span></div>' +
    '<div class="progress' + (kcalToday > kcalTarget ? ' over' : '') + '"><div style="width:' + kcalPct + '%"></div></div>' +
    coachingMsg(p, kcalToday, kcalTarget) + '</div>';

  // water
  html += '<div class="card"><h3>💧 ရေ</h3>' +
    '<div class="row space-between"><b>' + waterToday + ' ml</b><span class="muted">ရည်မှန်း ' + waterTarget + ' ml</span></div>' +
    '<div class="progress"><div style="width:' + waterPct + '%"></div></div>' +
    '<div class="water-btns"><button class="btn small-btn" data-water="250">+ 250 ml</button>' +
    '<button class="btn small-btn" data-water="500">+ 500 ml</button></div></div>';

  // meds
  html += '<div class="card"><h3>💊 ဒီနေ့ ဆေး</h3>';
  if (!medsToday.length) html += '<div class="muted">ဆေးမှတ်တမ်း မရှိသေးပါ — ဆေးဝါးများ tab မှာ ထည့်ပါ</div>';
  else html += '<div>သောက်ပြီး ' + takenCount + ' / လွတ်သွား ' + missedCount + ' / စုစုပေါင်း ' + medsToday.length + '</div>';
  html += '</div>';

  // activity
  html += '<div class="card"><h3>🚶 လှုပ်ရှားမှု</h3>' +
    '<div class="row space-between"><div>ဒီနေ့ ခြေလှမ်း: <b>' + stepsToday + '</b></div>' +
    '<button class="btn small-btn secondary" id="btnQuickSteps">ခြေလှမ်းထည့်ရန်</button></div></div>';

  // weight mini chart
  html += '<div class="card"><h3>⚖️ ကိုယ်အလေးချိန် (နောက်ဆုံး ၁၄ မှတ်)</h3>' +
    '<canvas id="chartHomeWeight" class="chart"></canvas></div>';

  // coach tip
  html += '<div class="card"><h3>🤖 ဒီနေ့ အကြံပြုချက်</h3>' +
    '<div class="info-box" id="coachTipBox">' + esc(tipOfDay()) + '</div>' +
    (aiProvider()
      ? '<button class="btn small-btn secondary" id="btnAiTip">✨ AI အကြံပြုချက် တောင်းမယ်</button>'
      : '<div class="muted small">Settings မှာ API key ထည့်ထားရင် AI အကြံပြုချက် ရနိုင်ပါတယ်</div>') +
    '</div>';

  $('view-home').innerHTML = html;

  // wire events
  $('view-home').querySelectorAll('[data-water]').forEach(b =>
    b.addEventListener('click', () => { addWater(+b.dataset.water); }));
  const qs = $('btnQuickSteps');
  if (qs) qs.addEventListener('click', openStepsModal);
  const aiBtn = $('btnAiTip');
  if (aiBtn) aiBtn.addEventListener('click', async () => {
    aiBtn.disabled = true; aiBtn.textContent = 'စဉ်းစားနေသည်…';
    try {
      const p2 = activeProfile();
      const tip = await aiChat(
        'You are a friendly Burmese health coach. Reply in Burmese (Myanmar script), 2-3 short sentences, practical and encouraging. No medical diagnosis.',
        'Profile: age ' + (p2.age || '?') + ', gender ' + (p2.gender || '?') + ', BMI ' +
        ((calcBMI(p2) || 0).toFixed(1)) + ', goal ' + (GOAL_LABEL[p2.goal] || '') +
        ', conditions: ' + (p2.conditions.join(', ') || 'none') +
        '. Today: ' + kcalToday + '/' + kcalTarget + ' kcal, water ' + waterToday + 'ml, steps ' + stepsToday +
        '. Give one personalized health tip for the rest of today.',
        (n, total, note) => { aiBtn.textContent = note === 'wait' ? 'ခဏစောင့်နေသည်…' : ('ပြန်ကြိုးစားနေသည်… (' + n + '/' + total + ')'); });
      $('coachTipBox').textContent = tip;
    } catch (e) { toast('AI ခေါ်ဆို၍မရပါ: ' + e.message); }
    aiBtn.disabled = false; aiBtn.textContent = '✨ AI အကြံပြုချက် တောင်းမယ်';
  });

  drawLineChart('chartHomeWeight', [{
    label: 'kg', color: '#0d7a5f',
    points: wl.map(w => ({ x: w.date.slice(5), y: +w.weight }))
  }], { unit: 'kg' });
}
function coachingMsg(p, kcalToday, kcalTarget) {
  if (kcalToday > kcalTarget * 1.1)
    return '<div class="warn-box">⚠️ ဒီနေ့ ကယ်လိုရီ များသွားပါတယ်။ ညနေမှာ လမ်း <b>မိနစ် ၂၀</b> ပိုလျှောက်ပါ 🚶</div>';
  if (kcalToday > kcalTarget)
    return '<div class="warn-box">ကယ်လိုရီ ရည်မှန်းချက်ကို ကျော်သွားပါပြီ — ညစာကို ပေါ့ပေါ့စားပါ။</div>';
  if (kcalToday < kcalTarget * 0.5 && new Date().getHours() >= 15)
    return '<div class="info-box">ဒီနေ့ အစာ နည်းနေပါတယ် — အာဟာရပြည့်အောင် ညစာကို သေချာစားပါ။</div>';
  return '<div class="ok-box">✅ ကယ်လိုရီ လမ်းကြောင်းမှန်ပေါ်မှာ ရှိပါတယ် — ဆက်ထိန်းထားပါ!</div>';
}
function todaysMedSchedule(profileId, dateStr) {
  const out = [];
  const dayLog = DB.medLog[dateStr] || {};
  DB.meds.filter(m => m.profileId === profileId).forEach(m => {
    (m.times || []).forEach(tm => {
      const key = m.id + '@' + tm;
      out.push({ med: m, time: tm, key: key, status: dayLog[key] || 'pending' });
    });
  });
  out.sort((a, b) => a.time < b.time ? -1 : 1);
  return out;
}
function addWater(ml) {
  const t = todayStr();
  DB.waterLog[t] = (DB.waterLog[t] || 0) + ml;
  saveDB(); renderHome(); scheduleCheck();
  toast(ml + ' ml ထည့်ပြီးပါပြီ 💧');
}
function openStepsModal() {
  const p = activeProfile(), t = todayStr();
  const ex = DB.activityLog.find(a => a.profileId === p.id && a.date === t);
  openModal('🚶 ဒီနေ့ လှုပ်ရှားမှု', 
    '<label>ခြေလှမ်း အရေအတွက်</label><input id="mSteps" type="number" inputmode="numeric" value="' + (ex ? ex.steps : '') + '" placeholder="ဥပမာ 5000">' +
    '<label>လေ့ကျင့်ခန်း (မိနစ်)</label><input id="mMins" type="number" inputmode="numeric" value="' + (ex ? (ex.minutes || '') : '') + '" placeholder="ဥပမာ 30">' +
    '<div class="mt"><button class="btn block" id="mSaveSteps">သိမ်းမယ်</button></div>');
  $('mSaveSteps').addEventListener('click', () => {
    const steps = parseInt($('mSteps').value || '0', 10) || 0;
    const minutes = parseInt($('mMins').value || '0', 10) || 0;
    if (ex) { ex.steps = steps; ex.minutes = minutes; }
    else DB.activityLog.push({ id: uid(), profileId: p.id, date: t, steps: steps, minutes: minutes });
    saveDB(); closeModal(); renderHome(); toast('မှတ်တမ်းတင်ပြီးပါပြီ ✅');
  });
}

// ============================================================
// VIEW: 👤 ကျန်းမာရေးဖိုင် (Health Profile)
// ============================================================
function renderProfile() {
  const p = activeProfile();
  const bmi = calcBMI(p);
  let html = '<div class="card"><h3>👤 ' + esc(p.name) + ' ၏ ကျန်းမာရေးဖိုင်</h3>';
  html += '<div class="form-grid">' +
    '<div><label>အမည်</label><input id="pfName" value="' + esc(p.name) + '"></div>' +
    '<div><label>အသက်</label><input id="pfAge" type="number" inputmode="numeric" value="' + esc(p.age) + '"></div>' +
    '<div><label>ကျား/မ</label><select id="pfGender">' +
      '<option value="">— ရွေးပါ —</option>' +
      '<option value="male"' + (p.gender === 'male' ? ' selected' : '') + '>ကျား</option>' +
      '<option value="female"' + (p.gender === 'female' ? ' selected' : '') + '>မ</option>' +
    '</select></div>' +
    '<div><label>သွေးအမျိုးအစား</label><select id="pfBlood">' +
      '<option value="">—</option>' +
      ['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(b =>
        '<option' + (p.bloodType === b ? ' selected' : '') + '>' + b + '</option>').join('') +
    '</select></div>' +
    '<div><label>အရပ် (cm)</label><input id="pfHeight" type="number" inputmode="decimal" value="' + esc(p.height) + '"></div>' +
    '<div><label>အလေးချိန် (kg)</label><input id="pfWeight" type="number" inputmode="decimal" value="' + esc(p.weight) + '"></div>' +
  '</div>';
  html += '<div class="mt info-box">📏 BMI: <b>' + (bmi ? bmi.toFixed(1) : '—') + '</b> (' + bmiLabel(bmi) + ') · 🔥 နေ့စဉ် ကယ်လိုရီရည်မှန်း: <b>' + calorieTarget(p) + ' kcal</b></div>';
  html += '<label>ကျန်းမာရေး ရည်မှန်းချက်</label><select id="pfGoal">' +
    Object.keys(GOAL_LABEL).map(g => '<option value="' + g + '"' + (p.goal === g ? ' selected' : '') + '>' + GOAL_LABEL[g] + '</option>').join('') +
    '</select>';
  html += '<div class="check-line"><input type="checkbox" id="pfPeriod"' + (p.periodEnabled ? ' checked' : '') + '><label for="pfPeriod" style="margin:0">ရာသီစက် မှတ်တမ်း သုံးမယ် (အမျိုးသမီးများအတွက်)</label></div>';

  html += '<h4>နာတာရှည် ရောဂါရာဇဝင်</h4><div id="pfConditions">' +
    p.conditions.map((c, i) => tagHtml('cond', i, c)).join('') + '</div>' +
    '<div class="row"><input id="pfCondInput" class="grow" placeholder="ဥပမာ သွေးတိုး၊ ဆီးချို"><button class="btn small-btn" id="pfCondAdd">ထည့်မယ်</button></div>';

  html += '<h4>မျိုးရိုးလိုက်ရောဂါများ</h4><div id="pfFamily">' +
    p.familyHistory.map((c, i) => tagHtml('fam', i, c)).join('') + '</div>' +
    '<div class="row"><input id="pfFamInput" class="grow" placeholder="ဥပမာ နှလုံးရောဂါ (အဖေ)"><button class="btn small-btn" id="pfFamAdd">ထည့်မယ်</button></div>';

  html += '<h4>ဓာတ်မတည့်မှုများ (Allergies)</h4><div id="pfAllergy">' +
    p.allergies.map((c, i) => tagHtml('alg', i, c)).join('') + '</div>' +
    '<div class="row"><input id="pfAlgInput" class="grow" placeholder="ဥပမာ ပုစွန်၊ penicillin"><button class="btn small-btn" id="pfAlgAdd">ထည့်မယ်</button></div>';

  html += '<div class="mt"><button class="btn block" id="pfSave">💾 သိမ်းဆည်းမယ်</button></div></div>';

  // profile management
  html += '<div class="card"><h3>👥 Profile များ စီမံခန့်ခွဲရန်</h3>';
  DB.profiles.forEach(pr => {
    html += '<div class="list-item"><span class="grow"><b>' + esc(pr.name) + '</b>' +
      (pr.id === DB.activeProfileId ? ' <span class="tag">လက်ရှိ</span>' : '') + '</span>' +
      (pr.id !== DB.activeProfileId ? '<button class="btn small-btn secondary" data-switch="' + pr.id + '">ပြောင်းမယ်</button>' : '') +
      (DB.profiles.length > 1 ? '<button class="btn small-btn danger" data-delprofile="' + pr.id + '">ဖျက်မယ်</button>' : '') +
      '</div>';
  });
  html += '<div class="mt"><button class="btn secondary block" id="btnNewProfile">＋ Profile အသစ်ထည့်ရန်</button></div></div>';

  $('view-profile').innerHTML = html;

  const addTag = (inputId, list) => {
    const v = $(inputId).value.trim();
    if (!v) return;
    list.push(v); saveDB(); renderProfile();
  };
  $('pfCondAdd').addEventListener('click', () => addTag('pfCondInput', p.conditions));
  $('pfFamAdd').addEventListener('click', () => addTag('pfFamInput', p.familyHistory));
  $('pfAlgAdd').addEventListener('click', () => addTag('pfAlgInput', p.allergies));
  $('view-profile').querySelectorAll('.tag .x').forEach(x =>
    x.addEventListener('click', () => {
      const kind = x.dataset.kind, i = +x.dataset.idx;
      if (kind === 'cond') p.conditions.splice(i, 1);
      if (kind === 'fam') p.familyHistory.splice(i, 1);
      if (kind === 'alg') p.allergies.splice(i, 1);
      saveDB(); renderProfile();
    }));
  $('pfSave').addEventListener('click', () => {
    p.name = $('pfName').value.trim() || p.name;
    p.age = $('pfAge').value.trim(); p.gender = $('pfGender').value;
    p.bloodType = $('pfBlood').value; p.height = $('pfHeight').value.trim();
    p.weight = $('pfWeight').value.trim(); p.goal = $('pfGoal').value;
    p.periodEnabled = $('pfPeriod').checked;
    if (p.gender === 'female' && !p.periodEnabled) { /* keep as user set */ }
    saveDB(); refreshProfileSwitcher(); renderProfile();
    toast('Profile သိမ်းပြီးပါပြီ ✅');
  });
  $('view-profile').querySelectorAll('[data-switch]').forEach(b =>
    b.addEventListener('click', () => switchProfile(b.dataset.switch)));
  $('view-profile').querySelectorAll('[data-delprofile]').forEach(b =>
    b.addEventListener('click', () => {
      if (!confirm('ဒီ profile နဲ့ ဆက်စပ်မှတ်တမ်းအားလုံး ဖျက်မှာလား?')) return;
      const id = b.dataset.delprofile;
      DB.profiles = DB.profiles.filter(x => x.id !== id);
      ['meds','foodLog','sleepLog','activityLog','weightLog','symptoms','periodLog'].forEach(k => {
        DB[k] = DB[k].filter(x => x.profileId !== id);
      });
      delete DB.plans[id];
      if (DB.activeProfileId === id) DB.activeProfileId = DB.profiles[0].id;
      saveDB(); refreshProfileSwitcher(); renderProfile();
    }));
  $('btnNewProfile').addEventListener('click', () => {
    openModal('👥 Profile အသစ်',
      '<label>အမည်</label><input id="mPName" placeholder="ဥပမာ အမေ">' +
      '<div class="mt"><button class="btn block" id="mPSave">ဖန်တီးမယ်</button></div>');
    $('mPSave').addEventListener('click', () => {
      const name = $('mPName').value.trim() || 'Profile အသစ်';
      const np = { id: uid(), name: name, age: '', gender: '', height: '', weight: '',
        bloodType: '', conditions: [], familyHistory: [], allergies: [], goal: 'maintain', periodEnabled: false };
      DB.profiles.push(np); DB.activeProfileId = np.id;
      saveDB(); refreshProfileSwitcher(); closeModal(); renderProfile();
      toast('Profile အသစ် ဖန်တီးပြီးပါပြီ ✅');
    });
  });
}
function tagHtml(kind, i, text) {
  return '<span class="tag">' + esc(text) + '<span class="x" data-kind="' + kind + '" data-idx="' + i + '">✕</span></span>';
}

// ============================================================
// VIEW: 💊 ဆေးဝါးများ (Medications)
// ============================================================
function renderMeds() {
const p = activeProfile();
const t = todayStr();
const meds = DB.meds.filter(m => m.profileId === p.id);
const sched = todaysMedSchedule(p.id, t);

let html = '<div class="card"><div class="row space-between"><h3>💊 ဒီနေ့ သောက်ရမည့်ဆေးများ</h3>' +
'<span class="muted">' + fmtDateMm(t) + '</span></div>';
if (!sched.length) html += '<div class="muted">ဆေး မှတ်တမ်း မရှိသေးပါ — အောက်မှာ အရင်ထည့်ပါ</div>';
sched.forEach(s => {
html += '<div class="med-check ' + s.status + '">' +
'<span class="time">' + fmtTimeMm(s.time) + '</span>' +
'<div class="grow"><b>' + esc(s.med.name) + '</b><div class="small muted">' + esc(s.med.dosage || '') + '</div></div>' +
'<div class="check-btns">' +
'<button data-medkey="' + s.key + '" data-st="taken" class="' + (s.status === 'taken'? 'on-taken': '') + '">✅ သောက်ပြီး</button>' +
'<button data-medkey="' + s.key + '" data-st="missed" class="' + (s.status === 'missed'? 'on-missed': '') + '">⏭️ လွတ်</button>' +
'</div></div>';
});
html += '</div>';

// refill alerts
const lowMeds = meds.map(m => ({ m: m, left: medSupplyLeft(m)})).filter(x => x.left!= null && x.left <= 7);
if (lowMeds.length) {
html += '<div class="alert">⚠️ ဆေးကုန်ခါနီးနေပါပြီ:<br>' +
lowMeds.map(x => '• ' + esc(x.m.name) + ' — ' + x.left + ' ရက် စာသာ ကျန်သည်').join('<br>') + '</div>';
}

// med list
html += '<div class="card"><div class="row space-between"><h3>📋 ဆေးစာရင်း</h3>' +
'<button class="btn small-btn" id="btnAddMed">＋ ထည့်မယ်</button></div>';
if (!meds.length) html += '<div class="muted">ဆေး မထည့်ရသေးပါ</div>';
meds.forEach(m => {
const left = medSupplyLeft(m);
html += '<div class="list-item"><div class="grow"><b>' + esc(m.name) + '</b>' +
'<div class="small muted">' + esc(m.dosage || '') + ' · ' + (m.times || []).map(fmtTimeMm).join(', ') +
(m.reason? ' · ' + esc(m.reason): '') +
(left!= null? ' · ကျန် ' + left + ' ရက်': '') + '</div></div>' +
'<button class="btn small-btn secondary" data-editmed="' + m.id + '">ပြင်မယ်</button>' +
'<button class="btn small-btn danger" data-delmed="' + m.id + '">ဖျက်မယ်</button></div>';
});
html += '</div>';

// interaction check
html += '<div class="card"><h3>🔬 ဆေးအချင်းချင်း ဓာတ်ပြုမှု စစ်ဆေးရန်</h3>' +
'<div id="interactResult"><div class="muted">ဆေး ၂ မျိုးနှင့်အထက် ထည့်ထားရင် စစ်လို့ရပါမယ်</div></div>' +
'<div class="row wrap mt"><button class="btn small-btn secondary" id="btnInteractLocal">📋 စာရင်းနဲ့ စစ်မယ် (offline)</button>' +
(aiProvider()? '<button class="btn small-btn" id="btnInteractAI">✨ AI နဲ့ စစ်မယ်</button>': '') + '</div>' +
'<div class="small muted mt">⚠️ ဒါက ကနဦး လမ်းညွှန်ချက်သာ — ဆေးမပြောင်းမီ ဆရာဝန်/ဆေးဝါးပညာရှင်နဲ့ တိုင်ပင်ပါ။</div></div>';

$('view-meds').innerHTML = html;

$('view-meds').querySelectorAll('[data-medkey]').forEach(b =>
b.addEventListener('click', () => {
const key = b.dataset.medkey, st = b.dataset.st;
if (!DB.medLog[t]) DB.medLog[t] = {};
DB.medLog[t][key] = (DB.medLog[t][key] === st)? 'pending': st;
saveDB(); renderMeds();
}));
$('btnAddMed').addEventListener('click', () => openMedModal(null));
$('view-meds').querySelectorAll('[data-editmed]').forEach(b =>
b.addEventListener('click', () => openMedModal(b.dataset.editmed)));
$('view-meds').querySelectorAll('[data-delmed]').forEach(b =>
b.addEventListener('click', () => {
if (!confirm('ဒီဆေးကို ဖျက်မှာလား?')) return;
DB.meds = DB.meds.filter(x => x.id!== b.dataset.delmed);
saveDB(); renderMeds();
}));
$('btnInteractLocal').addEventListener('click', renderLocalInteractions);
const aiB = $('btnInteractAI');
if (aiB) aiB.addEventListener('click', renderAiInteractions);
}
function medSupplyLeft(m) {
if (!m.supplyDays ||!m.supplyStartDate) return null;
const end = addDays(m.supplyStartDate, +m.supplyDays);
const diff = Math.round((new Date(end + 'T12:00:00') - new Date(todayStr() + 'T12:00:00')) / 86400000);
return diff;
}
function openMedModal(id) {
const p = activeProfile();
const m = id? DB.meds.find(x => x.id === id): null;
const times = m? m.times.join(', '): '08:00, 20:00';
openModal(id? '💊 ဆေးပြင်ရန်': '💊 ဆေးအသစ်ထည့်ရန်',
'<label>ဆေးအမည် *</label><input id="mMedName" value="' + esc(m? m.name: '') + '" placeholder="ဥပမာ Amlodipine">' +
'<label>ပမာဏ (Dosage)</label><input id="mDosage" value="' + esc(m? m.dosage: '') + '" placeholder="ဥပမာ 5mg, ၁ လုံး">' +
'<label>သောက်ရမည့်အချိန်များ (ကော်မာခြား, 24h)</label><input id="mTimes" value="' + esc(times) + '" placeholder="08:00, 13:00, 20:00">' +
'<label>သောက်ရသည့် အကြောင်းအရင်း</label><input id="mReason" value="' + esc(m? m.reason: '') + '" placeholder="ဥပမာ သွေးတိုးအတွက်">' +
'<div class="form-grid"><div><label>လက်ကျန်ရက် (ရက်)</label><input id="mSupply" type="number" inputmode="numeric" value="' + (m && m.supplyDays? m.supplyDays: '') + '" placeholder="ဥပမာ 30"></div>' +
'<div><label>စသောက်သည့်နေ့</label><input id="mSupplyStart" type="date" value="' + (m && m.supplyStartDate? m.supplyStartDate: todayStr()) + '"></div></div>' +
'<div class="mt"><button class="btn block" id="mMedSave">သိမ်းမယ်</button></div>');
$('mMedSave').addEventListener('click', () => {
const name = $('mMedName').value.trim();
if (!name) { toast('ဆေးအမည် ထည့်ပေးပါ'); return;}
const tms = $('mTimes').value.split(',').map(s => s.trim()).filter(s => /^\d{1,2}:\d{2}$/.test(s));
if (!tms.length) { toast('အချိန် အနည်းဆုံး ၁ ခု မှန်အောင်ထည့်ပါ (ဥပမာ 08:00)'); return;}
const data = { name: name, dosage: $('mDosage').value.trim(),
times: tms, reason: $('mReason').value.trim(),
supplyDays: $('mSupply').value.trim(), supplyStartDate: $('mSupplyStart').value};
if (m) Object.assign(m, data);
else DB.meds.push(Object.assign({ id: uid(), profileId: p.id}, data));
saveDB(); closeModal(); renderMeds(); scheduleCheck();
toast('ဆေး သိမ်းပြီးပါပြီ ✅');
});
}
function checkLocalInteractions(medNames) {
// medNames: raw user-entered names. Returns matches from DRUG_INTERACTIONS.
const found = [];
const norms = medNames.map(n => (window.normalizeDrugName? normalizeDrugName(n): String(n).toLowerCase().trim()));
(window.DRUG_INTERACTIONS || []).forEach(entry => {
const hits = entry.drugs.filter(d => norms.some(n => n.indexOf(d)!== -1 || d.indexOf(n)!== -1));
if (hits.length >= 2 || (entry.drugs.length === 2 && hits.length === 2)) {
// need each drug in the pair matched by a *different* med ideally; simple check:
const matchedMeds = entry.drugs.map(d => medNames[norms.findIndex(n => n.indexOf(d)!== -1 || d.indexOf(n)!== -1)]).filter(Boolean);
if (new Set(entry.drugs.map(d => norms.findIndex(n => n.indexOf(d)!== -1 || d.indexOf(n)!== -1))).size >= 2 || entry.drugs.length < 2) {
found.push({ entry: entry, meds: matchedMeds});
}
}
});
return found;
}
function renderLocalInteractions() {
const p = activeProfile();
const names = DB.meds.filter(m => m.profileId === p.id).map(m => m.name);
const box = $('interactResult');
if (names.length < 2) { box.innerHTML = '<div class="warn-box">ဆေး ၂ မျိုးအထက် ထည့်ပြီးမှ စစ်လို့ရပါမယ်</div>'; return;}
const found = checkLocalInteractions(names);
if (!found.length) {
box.innerHTML = '<div class="ok-box">✅ ထည့်ထားတဲ့ စာရင်း (' + (window.DRUG_INTERACTIONS || []).length +
' ချက်) နဲ့ စစ်ကြည့်တာ သိသာတဲ့ ဓာတ်ပြုမှု <b>မတွေ့ပါ</b>။<br><span class="small">မှတ်ချက် — စာရင်းက အဖြစ်များတာတွေသာ ပါတာမို့ ဆေးအသစ်မစမီ ဆရာဝန်နဲ့ တိုင်ပင်ပါ။</span></div>';
return;
}
const lvlMm = { high: '🔴 ပြင်းထန်', medium: '🟡 အလယ်အလတ်', low: '🟢 နည်း'};
box.innerHTML = '<div class="alert"><b>⚠️ ဓာတ်ပြုနိုင်ချေ ' + found.length + ' ခု တွေ့ပါတယ်:</b></div>' +
found.map(f => '<div class="warn-box"><b>' + esc(f.meds.join(' + ')) + '</b> — ' + (lvlMm[f.entry.level] || f.entry.level) +
'<br>' + esc(f.entry.noteMm) + '</div>').join('') +
'<div class="small muted">ဆရာဝန်/ဆေးဝါးပညာရှင်နဲ့ အမြန်တိုင်ပင်ပါ။</div>';
}
async function renderAiInteractions() {
const p = activeProfile();
const meds = DB.meds.filter(m => m.profileId === p.id);
const box = $('interactResult');
if (meds.length < 2) { box.innerHTML = '<div class="warn-box">ဆေး ၂ မျိုးအထက် ထည့်ပြီးမှ စစ်လို့ရပါမယ်</div>'; return;}
box.innerHTML = '<div class="info-box">AI စစ်ဆေးနေသည်…</div>';
try {
const list = meds.map(m => m.name + (m.dosage? ' (' + m.dosage + ')': '')).join(', ');
const ans = await aiChat(
'You are a pharmacy assistant. Reply in Burmese (Myanmar script). List potential drug-drug interactions, each with severity (ပြင်းထန်/အလယ်အလတ်/နည်း) and a one-line explanation. End with: ဆေးမပြောင်းမီ ဆရာဝန်နဲ့ တိုင်ပင်ပါ။ This is informational only, not medical advice.',
'Check interactions between these medications: ' + list +
'. Patient conditions: ' + (p.conditions.join(', ') || 'none') + '. Allergies: ' + (p.allergies.join(', ') || 'none') + '.'
);
box.innerHTML = '<div class="card" style="margin:0"><h4>✨ AI စစ်ဆေးချက်</h4><div style="white-space:pre-wrap">' + esc(ans) + '</div></div>';
} catch (e) {
box.innerHTML = '<div class="alert">AI ခေါ်ဆို၍မရပါ: ' + esc(e.message) + '</div>';
}
}

// ============================================================
// VIEW: 🗓️ အစီအစဉ် (Monthly Plan)
// ============================================================
function currentMonthKey() {
const d = new Date();
return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
}
function renderPlan() {
const p = activeProfile();
const mk = currentMonthKey();
const plan = DB.plans[p.id];
let html = '<div class="card"><h3>🗓️ တစ်လစာ ကျန်းမာရေး အစီအစဉ်</h3>';
html += '<div class="muted">' + esc(p.name) + ' · ' + MM_MONTHS[+mk.split('-')[1] - 1] + ' ' + mk.split('-')[0] + '</div>';
if (!plan || plan.month!== mk) {
html += '<div class="info-box mt">ဒီလအတွက် အစီအစဉ် မထုတ်ရသေးပါ</div>' +
'<div class="row wrap"><button class="btn" id="btnGenPlan">📋 အစီအစဉ် ထုတ်မယ် (offline)</button>' +
(aiProvider()? '<button class="btn secondary" id="btnGenPlanAI">✨ AI နဲ့ ထုတ်မယ်</button>': '') + '</div>' +
(aiProvider()? '': '<div class="small muted mt">Settings မှာ API key ထည့်ထားရင် AI နဲ့ ပိုကိုယ်ပိုင် အစီအစဉ် ထုတ်နိုင်ပါတယ်</div>');
} else {
html += '<div class="ok-box mt">✅ ' + (plan.ai? 'AI နဲ့': 'offline စည်းမျဉ်းနဲ့') + ' ထုတ်ထားသော အစီအစဉ်</div>';
html += '<div class="row wrap mb"><button class="btn small-btn secondary" id="btnRegenPlan">🔄 ပြန်ထုတ်မယ်</button></div>';
html += planHtml(plan);
}
html += '</div>';
$('view-plan').innerHTML = html;
const g = $('btnGenPlan');
if (g) g.addEventListener('click', () => { generateRulePlan(p); renderPlan(); toast('အစီအစဉ် ထုတ်ပြီးပါပြီ ✅');});
const ga = $('btnGenPlanAI');
if (ga) ga.addEventListener('click', generateAiPlan);
const rg = $('btnRegenPlan');
if (rg) rg.addEventListener('click', () => { delete DB.plans[p.id]; saveDB(); renderPlan();});
}
function generateRulePlan(p) {
const kcal = calorieTarget(p);
const hasDiabetes = p.conditions.some(c => /ဆီးချို|diabetes/i.test(c));
const hasBP = p.conditions.some(c => /သွေးတိုး|blood pressure|hypertension/i.test(c));
const meals = [
{ name: '🌅 မနက်စာ', time: '07:30', items: hasDiabetes
? ['ပဲပြုတ်ထမင်း ၁ ပန်းကန်', 'ကြက်ဥပြုတ် ၁ လုံး', 'ဟင်းသီးဟင်းရွက်']
: ['ထမင်း ၁ ပန်းကန်', 'ကြက်ဥကြော်/ပြုတ် ၁ လုံး', 'ဟင်းရွက်ကြော်']},
{ name: '☀️ နေ့လယ်စာ', time: '12:30', items: ['ထမင်း ၁ ပန်းကန်', 'အသားဟင်း ၁ ခွက် (ကြက်/ငါး)', 'ဟင်းရွက် ၂ မျိုး', hasBP? 'ဆားလျှော့': 'အရွက်သုပ်']},
{ name: '🍵 အဆာပြေ', time: '15:30', items: ['အသီးအနှံ ၁ လုံး', 'ပဲနို့/ဒိန်ချဉ် ၁ ခွက်']},
{ name: '🌙 ညစာ', time: '18:30', items: p.goal === 'lose'
? ['ထမင်း ပန်းကန်ဝက်', 'ငါးဟင်း/အရွက်ဟင်း', 'ဟင်းချို']
: ['ထမင်း ၁ ပန်းကန်', 'အသားဟင်း', 'ဟင်းသီးဟင်းရွက်']},
];
const workoutWeeks = [
{ week: 'အပတ် ၁', title: 'ပေါ့ပေါ့ပါးပါး စတင်ခြင်း', items: ['နေ့တိုင်း လမ်းလျှောက်ခြင်း မိနစ် ၂၀', 'မနက် အကြောဆန့်ခြင်း ၅ မိနစ်', 'တစ်ပတ် ၁ ရက် အနားယူခြင်း']},
{ week: 'အပတ် ၂', title: 'အရှိန်မြှင့်ခြင်း', items: ['လမ်းလျှောက်ခြင်း မိနစ် ၃၀ (သို့) စက်ဘီးစီးခြင်း', 'Stretching ၁၀ မိနစ်', 'တနင်္လာနေ့–သောကြာနေ့ ပုံမှန်လုပ်ခြင်း']},
{ week: 'အပတ် ၃', title: 'ကြံ့ခိုင်မှု တည်ဆောက်ခြင်း', items: ['လမ်းမြန်မြန်လျှောက်ခြင်း မိနစ် ၄၀', 'ကိုယ်အလေးချိန်သုံး လေ့ကျင့်ခန်း (squat, push-up) ၁၅ မိနစ်', 'တစ်ပတ် ၅ ရက်']},
{ week: 'အပတ် ၄', title: 'ထိန်းသိမ်းပြီး တိုးတက်ခြင်း', items: ['လမ်း/ပြေး မိနစ် ၄၅', 'ကြွက်သားလေ့ကျင့်ခန်း မိနစ် ၂၀', 'တစ်ပတ် ၅–၆ ရက်', 'ရလဒ် ပြန်သုံးသပ်ခြင်း']},
];
const diet = {
eat: ['ဟင်းသီးဟင်းရွက် အမျိုးမျိုး', 'အသီးအနှံ', 'ငါး၊ ကြက် (အဆီနည်း)', 'ပဲ၊ တို့ဟူး', 'ဆန်လုံးညို (ရရင်)']
.concat(hasDiabetes? ['အချိုနည်းသော အစားအစာများ']: []).concat(hasBP? ['ပိုတက်စီယမ်များသော ငှက်ပျောသီး']: []),
avoid: ['အချိုရည်၊ ရေခဲမုန့်', 'အကြော်အလှော် များများ', 'အရက်'].concat(hasDiabetes? ['သကြား၊ မုန့်ချို']: []).concat(hasBP? ['ဆား၊ ငံပြာရည်များများ']: [])
};
DB.plans[p.id] = {
month: currentMonthKey(), createdAt: new Date().toISOString(), ai: false,
meals: meals, sleep: { bed: DB.reminders.bedtime || '22:30', wake: '06:00'},
workout: workoutWeeks, diet: diet, calorieTarget: kcal,
tip: 'ရေများများသောက်ပြီး ထမင်းစားပြီးတိုင်း လမ်းလျှောက်ပါ။'
};
saveDB();
}
async function generateAiPlan() {
const p = activeProfile();
const btn = $('btnGenPlanAI');
const onRetry = (n, total, note) => { btn.textContent = note === 'wait' ? 'ခဏစောင့်နေသည်…' : ('AI ထုတ်လုပ်နေသည်… (' + n + '/' + total + ')'); };
btn.disabled = true; btn.textContent = 'AI ထုတ်လုပ်နေသည်…';
// Exact headers the prompt demands — used to validate the AI actually returned a plan.
const PLAN_HEADERS = ['စားသောက်ချိန်', 'အိပ်စက်ချိန်', 'လေ့ကျင့်ခန်း', 'စားသင့်', 'ရှောင်'];
function planOutputOk(ans) {
  const a = ans.replace(/\b(kcal|kg|cm|min|AM|PM)\b/gi, '');
  if (PLAN_HEADERS.filter(h => a.includes(h)).length < 3) return false;
  if (/[A-Za-z]{4,}/.test(a)) return false; // English words slipped in — must be Burmese only
  return true;
}
const PLAN_PROMPT =
'You are an expert health planner and nutritionist. ' +
'Reply ONLY in Burmese using standard Unicode Myanmar script (never Zawgyi encoding). ' +
'Every word must be Burmese except units like kcal, kg, cm, min. Do not use English words. ' +
'Study the health profile below CAREFULLY. Tailor EVERY section to this person\'s specific conditions, ' +
'medications, age, BMI and goal: name their conditions explicitly and add one short line in each section ' +
'explaining why the advice suits them. Never give generic advice that ignores their conditions. ' +
'Output using EXACTLY these 5 section headers, in this order:\n' +
'## 🍽️ စားသောက်ချိန်\n## 😴 အိပ်စက်ချိန်\n## 🏃 လေ့ကျင့်ခန်း (၄ ပတ်)\n## 🥗 စားသင့်သောအစားအစာများ\n## 🚫 ရှောင်ရန်များ\n' +
'Be specific: exact times, dish names with portions and kcal, a day-by-day 4-week workout schedule with durations. ' +
'Do not ask questions. No preamble. No medical diagnosis.';
try {
const bmi = calcBMI(p);
const meds = DB.meds.filter(m => m.profileId === p.id);
const userPrompt =
'Name: ' + p.name + '\n' +
'Age: ' + (p.age || '?') + ', Gender: ' + (p.gender || '?') + '\n' +
'Height: ' + (p.height || '?') + ' cm, Weight: ' + (p.weight || '?') + ' kg, BMI: ' +
(bmi ? bmi.toFixed(1) + ' (' + bmiLabel(bmi) + ')' : '?') + '\n' +
'Health goal: ' + (GOAL_LABEL[p.goal] || '') + '\n' +
'Existing health conditions (MUST tailor the plan to these): ' + (p.conditions.join(', ') || 'none') + '\n' +
'Allergies: ' + (p.allergies.join(', ') || 'none') + '\n' +
'Current medications: ' + (meds.map(m => m.name + (m.dosage ? ' ' + m.dosage : '') + (m.reason ? ' (' + m.reason + ')' : '')).join('; ') || 'none') + '\n' +
'Daily calorie target: ' + calorieTarget(p) + ' kcal\n' +
'Usual bedtime: ' + (DB.reminders.bedtime || '?');
let ans = await aiChat(PLAN_PROMPT, userPrompt, onRetry);
if (!planOutputOk(ans)) {
  // Small free models sometimes ramble or mix in English — one strict retry.
  ans = await aiChat(PLAN_PROMPT + '\nSTRICT: output ONLY the 5 sections above, all words Burmese except units. Do not ask questions.', userPrompt, onRetry);
  if (!planOutputOk(ans)) throw new Error('AI အဖြေ ပုံစံမမှန်ပါ');
}
const snap = 'အသက် ' + (p.age || '?') + ' · BMI ' + (bmi ? bmi.toFixed(1) + ' (' + bmiLabel(bmi) + ')' : '?') +
' · ရည်မှန်းချက်: ' + (GOAL_LABEL[p.goal] || '') +
' · အခံရောဂါ: ' + (p.conditions.join(', ') || 'မရှိ') +
' · သောက်နေသောဆေး: ' + (meds.map(m => m.name).join(', ') || 'မရှိ');
DB.plans[p.id] = { month: currentMonthKey(), createdAt: new Date().toISOString(), ai: true, rawAi: ans, snap: snap };
saveDB(); renderPlan(); toast('AI အစီအစဉ် ရပြီးပါပြီ ✅');
} catch (e) {
toast('AI ခေါ်ဆို၍မရပါ: ' + e.message + ' — offline နဲ့ ထုတ်ကြည့်ပါ');
btn.disabled = false; btn.textContent = '✨ AI နဲ့ ထုတ်မယ်';
}
}
function planHtml(plan) {
if (plan.ai && plan.rawAi) {
// Render "## Header" markdown lines as real section headers.
const parts = esc(plan.rawAi).split(/^## /m);
let out = '';
if (plan.snap) out += '<div class="info-box mb">🔍 AI က ဒီအချက်တွေကို အခြေခံပြီး ဆွဲထားတာပါ:<br>' + esc(plan.snap) + '</div>';
out += '<div style="white-space:pre-wrap">' + parts[0] + '</div>';
for (let i = 1; i < parts.length; i++) {
const nl = parts[i].indexOf('\n');
const head = nl >= 0 ? parts[i].slice(0, nl) : parts[i];
const body = nl >= 0 ? parts[i].slice(nl + 1) : '';
out += '<h4>' + head + '</h4><div style="white-space:pre-wrap">' + body + '</div>';
}
return out;
}
let h = '<h4>🍽️ စားသောက်ချိန် အချိန်ဇယား (ရည်မှန်း ' + plan.calorieTarget + ' kcal/နေ့)</h4>' +
'<table><tr><th>အချိန်</th><th>အစာ</th><th>ပါဝင်မည့်အရာများ</th></tr>' +
plan.meals.map(m => '<tr><td><b>' + fmtTimeMm(m.time) + '</b><div class="small muted">' + m.time + '</div></td><td>' +
esc(m.name) + '</td><td>' + m.items.map(esc).join('<br>') + '</td></tr>').join('') + '</table>';
h += '<h4>😴 အိပ်စက်ချိန်</h4><div class="info-box">အိပ်ရာဝင်ချိန်: <b>' + fmtTimeMm(plan.sleep.bed) +
'</b> · နိုးထချိန်: <b>' + fmtTimeMm(plan.sleep.wake) + '</b> (၇.၅ နာရီ)</div>';
h += '<h4>🏃 ၄ ပတ် လေ့ကျင့်ခန်း အစီအစဉ်</h4>' +
plan.workout.map(w => '<div class="card" style="margin-bottom:8px"><b>' + esc(w.week) + ' — ' + esc(w.title) +
'</b><ul style="margin:6px 0 0;padding-left:20px">' + w.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>').join('');
h += '<h4>🥗 စားသင့်သော အစားအစာများ</h4><div>' + plan.diet.eat.map(i => '<span class="tag">✅ ' + esc(i) + '</span>').join('') + '</div>';
h += '<h4>🚫 ရှောင်ရန်များ</h4><div>' + plan.diet.avoid.map(i => '<span class="tag">❌ ' + esc(i) + '</span>').join('') + '</div>';
h += '<div class="info-box mt">💡 ' + esc(plan.tip) + '</div>';
return h;
}

// ============================================================
// VIEW: 🍚 အစားအသောက် (Food Log)
// ============================================================
let foodPhotoDataUrl = null;
function renderFood() {
  const p = activeProfile();
  const t = todayStr();
  const kcalTarget = calorieTarget(p);
  const logs = DB.foodLog.filter(f => f.profileId === p.id && f.date === t)
    .sort((a, b) => a.time < b.time ? -1 : 1);
  const kcalToday = logs.reduce((a, f) => a + (+f.kcal || 0), 0);
  const pct = Math.min(100, Math.round(kcalToday / kcalTarget * 100));

  const foodOptions = (window.FOOD_DB || []).map(f =>
    '<option value="' + esc(f.name) + '">' + esc(f.name) + ' — ' + f.kcal + ' kcal/' + esc(f.unit) + '</option>').join('');

  let html = '<div class="card"><h3>🍚 ဒီနေ့ စားသုံးမှု</h3>' +
    '<div class="row space-between"><b>' + kcalToday + ' kcal</b><span class="muted">ရည်မှန်း ' + kcalTarget + ' kcal</span></div>' +
    '<div class="progress' + (kcalToday > kcalTarget ? ' over' : '') + '"><div style="width:' + pct + '%"></div></div>' +
    coachingMsg(p, kcalToday, kcalTarget) + '</div>';

  html += '<div class="card"><h3>➕ မှတ်တမ်းထည့်ရန်</h3>' +
    '<div class="row wrap mb">' +
      '<button class="btn small-btn secondary" id="tabFoodText">✍️ စာနဲ့ထည့်မယ်</button>' +
      '<button class="btn small-btn secondary" id="tabFoodPhoto">📷 ပုံနဲ့ထည့်မယ်</button>' +
    '</div>' +
    '<div id="foodTextPane">' +
      '<label>အစားအစာ ရှာရန် / ရိုက်ထည့်ရန်</label>' +
      '<input id="foodSearch" list="foodList" placeholder="ဥပမာ ထမင်း၊ ကြက်သားဟင်း…">' +
      '<datalist id="foodList">' + foodOptions + '</datalist>' +
      '<div id="foodMatch" class="mt"></div>' +
      '<div class="form-grid"><div><label>ပမာဏ (စားသုံးမှုအရေအတွက်)</label>' +
      '<input id="foodAmount" type="number" inputmode="decimal" value="1" min="0.25" step="0.25"></div>' +
      '<div><label>ကယ်လိုရီ (လက်နဲ့ပြင်နိုင်သည်)</label><input id="foodKcal" type="number" inputmode="numeric" placeholder="kcal"></div></div>' +
      '<div class="mt"><button class="btn block" id="btnAddFoodText">မှတ်တမ်းတင်မယ်</button></div>' +
    '</div>' +
    '<div id="foodPhotoPane" style="display:none">' +
      '<label>အစားအစာ ပုံရိုက်ရန် / ရွေးရန်</label>' +
      '<input id="foodPhoto" type="file" accept="image/*" capture="environment">' +
      '<div id="foodPhotoPrev" class="mt"></div><div id="foodAiResult" class="mt"></div>' +
      (DB.settings.geminiKey
        ? '<div class="mt"><button class="btn block" id="btnAnalyzeFood">✨ AI နဲ့ ပုံကို ဆန်းစစ်မယ်</button></div>'
        : '<div class="info-box mt">📷 ပုံမှ AI ဆန်းစစ်ချက်ရဖို့ Settings မှာ <b>Gemini API key</b> ထည့်ထားရပါမယ်။ Key မရှိရင် ပုံကြည့်ပြီး အောက်က စာနဲ့ထည့်တဲ့နည်းနဲ့ မှတ်နိုင်ပါတယ်။</div>') +
    '</div></div>';

  html += '<div class="card"><h3>📝 ဒီနေ့ မှတ်တမ်းများ</h3>';
  if (!logs.length) html += '<div class="muted">မရှိသေးပါ</div>';
  logs.forEach(f => {
    html += '<div class="list-item"><span class="time small"><b>' + fmtTimeMm(f.time) + '</b></span>' +
      '<div class="grow"><b>' + esc(f.name) + '</b><div class="small muted">' + esc(f.amount || '') +
      (f.source === 'photo-ai' ? ' · 📷 AI' : '') + '</div></div>' +
      '<b>' + f.kcal + ' kcal</b>' +
      '<button class="btn small-btn danger" data-delfood="' + f.id + '">ဖျက်မယ်</button></div>';
  });
  html += '</div>';

  $('view-food').innerHTML = html;

  $('tabFoodText').addEventListener('click', () => {
    $('foodTextPane').style.display = ''; $('foodPhotoPane').style.display = 'none';
  });
  $('tabFoodPhoto').addEventListener('click', () => {
    $('foodTextPane').style.display = 'none'; $('foodPhotoPane').style.display = '';
  });
  $('foodSearch').addEventListener('input', () => {
    const q = $('foodSearch').value.trim();
    const box = $('foodMatch');
    const hit = (window.FOOD_DB || []).find(f => f.name === q) ||
      (window.FOOD_DB || []).find(f => q && f.name.indexOf(q) !== -1);
    if (hit) {
      const amt = parseFloat($('foodAmount').value) || 1;
      box.innerHTML = '<div class="ok-box">✅ <b>' + esc(hit.name) + '</b> — ' + hit.kcal + ' kcal / ' + esc(hit.unit) +
        ' → ပမာဏ ' + amt + ' = <b>' + Math.round(hit.kcal * amt) + ' kcal</b></div>';
      if (!$('foodKcal').value) $('foodKcal').value = Math.round(hit.kcal * amt);
      box.dataset.food = hit.name; box.dataset.baseKcal = hit.kcal;
    } else {
      box.innerHTML = q ? '<div class="warn-box">စာရင်းထဲမှာ မတွေ့ပါ — ကယ်လိုရီကို လက်နဲ့ထည့်ပေးပါ</div>' : '';
      delete box.dataset.food;
    }
  });
  $('foodAmount').addEventListener('input', () => $('foodSearch').dispatchEvent(new Event('input')));
  $('btnAddFoodText').addEventListener('click', () => {
    const box = $('foodMatch');
    const name = box.dataset.food || $('foodSearch').value.trim();
    if (!name) { toast('အစားအစာ အမည် ထည့်ပေးပါ'); return; }
    const kcal = parseInt($('foodKcal').value, 10);
    if (!kcal || kcal <= 0) { toast('ကယ်လိုရီ ထည့်ပေးပါ'); return; }
    DB.foodLog.push({ id: uid(), profileId: p.id, date: t, time: nowHM(),
      name: name, kcal: kcal, amount: ($('foodAmount').value || '1') + ' စား', source: 'text' });
    saveDB(); renderFood(); toast('မှတ်တမ်းတင်ပြီးပါပြီ ✅');
  });
  $('view-food').querySelectorAll('[data-delfood]').forEach(b =>
    b.addEventListener('click', () => {
      DB.foodLog = DB.foodLog.filter(x => x.id !== b.dataset.delfood);
      saveDB(); renderFood();
    }));
  $('foodPhoto').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      foodPhotoDataUrl = reader.result;
      $('foodPhotoPrev').innerHTML = '<img src="' + foodPhotoDataUrl + '" style="max-width:100%;border-radius:12px" alt="အစားအစာပုံ">';
      $('foodAiResult').innerHTML = '';
    };
    reader.readAsDataURL(file);
  });
  const analyzeBtn = $('btnAnalyzeFood');
  if (analyzeBtn) analyzeBtn.addEventListener('click', async () => {
    if (!foodPhotoDataUrl) { toast('အရင်ပုံ ရွေးပေးပါ'); return; }
    analyzeBtn.disabled = true; analyzeBtn.textContent = 'ဆန်းစစ်နေသည်…';
    try {
      const res = await geminiFoodVision(foodPhotoDataUrl,
        (n, total, note) => { analyzeBtn.textContent = note === 'wait' ? 'ခဏစောင့်နေသည်…' : ('ပြန်ကြိုးစားနေသည်… (' + n + '/' + total + ')'); });
      const box = $('foodAiResult');
      if (!res.items.length) { box.innerHTML = '<div class="warn-box">ပုံထဲမှာ အစားအစာ မတွေ့ပါ</div>'; }
      else {
        box.innerHTML = '<div class="ok-box"><b>AI တွေ့ရှိချက် (စုစုပေါင်း ' + res.totalKcal + ' kcal):</b><br>' +
          res.items.map(i => '• ' + esc(i.name) + ' — ' + i.kcal + ' kcal').join('<br>') + '</div>' +
          '<button class="btn block mt" id="btnSaveAiFood">ဒီအတိုင်း မှတ်တမ်းတင်မယ်</button>';
        $('btnSaveAiFood').addEventListener('click', () => {
          res.items.forEach(i => DB.foodLog.push({ id: uid(), profileId: p.id, date: t, time: nowHM(),
            name: i.name, kcal: i.kcal, amount: '1 စား', source: 'photo-ai' }));
          saveDB(); foodPhotoDataUrl = null; renderFood(); toast('မှတ်တမ်းတင်ပြီးပါပြီ ✅');
        });
      }
    } catch (e) {
      $('foodAiResult').innerHTML = '<div class="alert">AI ခေါ်ဆို၍မရပါ: ' + esc(e.message) + '</div>';
    }
    analyzeBtn.disabled = false; analyzeBtn.textContent = '✨ AI နဲ့ ပုံကို ဆန်းစစ်မယ်';
  });
}

// ============================================================
// VIEW: ⏰ သတိပေးချက်များ (Reminders & Trackers)
// ============================================================
let notifTimers = [];
function renderRemind() {
  const r = DB.reminders;
  const t = todayStr();
  const waterToday = DB.waterLog[t] || 0;
  const waterTarget = DB.settings.waterTargetMl || 2000;
  const p = activeProfile();
  const sleeps = DB.sleepLog.filter(s => s.profileId === p.id).sort((a, b) => a.date < b.date ? -1 : 1).slice(0, 7);

  let html = '<div class="warn-box">ℹ️ <b>Website version:</b> ဒီ app ကို ဖွင့်ထားမှ သတိပေးချက်များ ရပါမယ်။<br>📱 <b>APK version</b> မှာ နောက်ခံကနေ (app မဖွင့်ထားလည်း) သတိပေးချက် ရပါမယ်။</div>';

  html += '<div class="card"><h3>🔔 သတိပေးချက် ဆက်တင်များ</h3>' +
    '<div class="check-line"><input type="checkbox" id="rmWater"' + (r.waterEnabled ? ' checked' : '') + '><label for="rmWater" style="margin:0">ရေသောက်ရန် သတိပေးမယ်</label></div>' +
    '<div class="form-grid"><div><label>ဘယ်နှစ်မိနစ်တစ်ခါ</label><input id="rmWaterInt" type="number" value="' + r.waterInterval + '" min="30" step="30"></div>' +
    '<div><label>အချိန်အပိုင်းအခြား</label><div class="row"><input id="rmWaterStart" type="time" value="' + r.waterStart + '"><span>–</span><input id="rmWaterEnd" type="time" value="' + r.waterEnd + '"></div></div></div>' +
    '<div class="check-line"><input type="checkbox" id="rmMed"' + (r.medEnabled ? ' checked' : '') + '><label for="rmMed" style="margin:0">ဆေးသောက်ချိန် သတိပေးမယ်</label></div>' +
    '<div class="check-line"><input type="checkbox" id="rmSleep"' + (r.sleepEnabled ? ' checked' : '') + '><label for="rmSleep" style="margin:0">အိပ်ရာဝင်ချိန် သတိပေးမယ်</label></div>' +
    '<label>အိပ်ရာဝင်ချိန်</label><input id="rmBedtime" type="time" value="' + r.bedtime + '" style="width:auto">' +
    '<div class="row wrap mt"><button class="btn" id="btnNotifPerm">🔔 Notification ခွင့်ပြုချက် တောင်းမယ်</button>' +
    '<button class="btn secondary" id="btnSaveRemind">💾 သိမ်းမယ်</button></div>' +
    '<div class="small muted mt" id="notifStatus">အခြေအနေ: ' + notifStatusMm() + '</div></div>';

  html += '<div class="card"><h3>💧 ရေမှတ်တမ်း (ဒီနေ့ ' + waterToday + ' / ' + waterTarget + ' ml)</h3>' +
    '<div class="progress"><div style="width:' + Math.min(100, Math.round(waterToday / waterTarget * 100)) + '%"></div></div>' +
    '<div class="water-btns"><button class="btn" data-wq="250">+ 250 ml</button><button class="btn" data-wq="500">+ 500 ml</button></div>' +
    '<div class="row"><input id="waterCustom" type="number" inputmode="numeric" class="grow" placeholder="ml ရိုက်ထည့်ရန်"><button class="btn small-btn secondary" id="btnWaterCustom">ထည့်မယ်</button></div></div>';

  html += '<div class="card"><div class="row space-between"><h3>😴 အိပ်စက်မှု မှတ်တမ်း</h3><button class="btn small-btn" id="btnAddSleep">＋ ထည့်မယ်</button></div>';
  if (!sleeps.length) html += '<div class="muted">မရှိသေးပါ</div>';
  sleeps.forEach(s => {
    const dur = sleepDuration(s);
    html += '<div class="list-item"><div class="grow"><b>' + fmtDateMm(s.date) + '</b> — ' + fmtTimeMm(s.bedtime) + ' → ' + fmtTimeMm(s.wakeTime) +
      '<div class="small muted">ကြာချိန် ' + dur + ' · အရည်အသွေး ' + '★'.repeat(s.quality) + '☆'.repeat(5 - s.quality) +
      (s.nightmare ? ' · 😱 အိပ်မက်ဆိုး' : '') + '</div></div>' +
      '<button class="btn small-btn danger" data-delsleep="' + s.id + '">ဖျက်မယ်</button></div>';
  });
  html += '</div>';

  const act = DB.activityLog.find(a => a.profileId === p.id && a.date === t);
  html += '<div class="card"><h3>🚶 ဒီနေ့ လှုပ်ရှားမှု</h3>' +
    '<div class="row space-between"><div>ခြေလှမ်း: <b>' + (act ? act.steps : 0) + '</b> · မိနစ်: <b>' + (act ? (act.minutes || 0) : 0) + '</b></div>' +
    '<button class="btn small-btn secondary" id="btnEditAct">ပြင်/ထည့်မယ်</button></div></div>';

  $('view-remind').innerHTML = html;

  $('btnNotifPerm').addEventListener('click', async () => {
    if (!('Notification' in window)) { toast('ဒီ browser က Notification မရပါ'); return; }
    const perm = await Notification.requestPermission();
    $('notifStatus').textContent = 'အခြေအနေ: ' + notifStatusMm();
    toast(perm === 'granted' ? 'ခွင့်ပြုပြီးပါပြီ ✅' : 'ခွင့်မပြုပါ');
    scheduleCheck();
  });
  $('btnSaveRemind').addEventListener('click', () => {
    r.waterEnabled = $('rmWater').checked;
    r.waterInterval = Math.max(30, parseInt($('rmWaterInt').value, 10) || 120);
    r.waterStart = $('rmWaterStart').value || '08:00';
    r.waterEnd = $('rmWaterEnd').value || '21:00';
    r.medEnabled = $('rmMed').checked;
    r.sleepEnabled = $('rmSleep').checked;
    r.bedtime = $('rmBedtime').value || '22:30';
    saveDB(); scheduleCheck(); toast('သိမ်းပြီးပါပြီ ✅');
  });
  $('view-remind').querySelectorAll('[data-wq]').forEach(b =>
    b.addEventListener('click', () => { addWater(+b.dataset.wq); renderRemind(); }));
  $('btnWaterCustom').addEventListener('click', () => {
    const v = parseInt($('waterCustom').value, 10);
    if (!v || v <= 0) { toast('ml ပမာဏ ထည့်ပေးပါ'); return; }
    addWater(v); renderRemind();
  });
  $('btnAddSleep').addEventListener('click', openSleepModal);
  $('view-remind').querySelectorAll('[data-delsleep]').forEach(b =>
    b.addEventListener('click', () => {
      DB.sleepLog = DB.sleepLog.filter(x => x.id !== b.dataset.delsleep);
      saveDB(); renderRemind();
    }));
  $('btnEditAct').addEventListener('click', openStepsModal);
}
function notifStatusMm() {
  if (!('Notification' in window)) return 'မရပါ';
  return { granted: 'ခွင့်ပြုပြီး ✅', denied: 'ပိတ်ထားသည်', default: 'မတောင်းရသေးပါ' }[Notification.permission] || Notification.permission;
}
function sleepDuration(s) {
  if (!s.bedtime || !s.wakeTime) return '—';
  let d = hmToMin(s.wakeTime) - hmToMin(s.bedtime);
  if (d <= 0) d += 1440;
  return Math.floor(d / 60) + ' နာရီ ' + (d % 60) + ' မိနစ်';
}
function openSleepModal() {
  const p = activeProfile();
  openModal('😴 အိပ်စက်မှု မှတ်တမ်း',
    '<label>နေ့ (အိပ်ရာဝင်သည့်နေ့)</label><input id="mSlDate" type="date" value="' + todayStr() + '">' +
    '<div class="form-grid"><div><label>အိပ်ရာဝင်ချိန်</label><input id="mSlBed" type="time" value="' + (DB.reminders.bedtime || '22:30') + '"></div>' +
    '<div><label>နိုးထချိန်</label><input id="mSlWake" type="time" value="06:00"></div></div>' +
    '<label>အိပ်စက်မှု အရည်အသွေး (1–5)</label><select id="mSlQ">' +
    [1, 2, 3, 4, 5].map(n => '<option value="' + n + '"' + (n === 3 ? ' selected' : '') + '>' + n + ' — ' + ['အလွန်ဆိုး', 'ဆိုး', 'သာမန်', 'ကောင်း', 'အလွန်ကောင်း'][n - 1] + '</option>').join('') + '</select>' +
    '<div class="check-line"><input type="checkbox" id="mSlNight"><label for="mSlNight" style="margin:0">😱 အိပ်မက်ဆိုး မက်ခဲ့သည်</label></div>' +
    '<div class="mt"><button class="btn block" id="mSlSave">သိမ်းမယ်</button></div>');
  $('mSlSave').addEventListener('click', () => {
    DB.sleepLog.push({ id: uid(), profileId: p.id, date: $('mSlDate').value || todayStr(),
      bedtime: $('mSlBed').value, wakeTime: $('mSlWake').value,
      quality: parseInt($('mSlQ').value, 10), nightmare: $('mSlNight').checked });
    saveDB(); closeModal(); renderRemind(); toast('မှတ်တမ်းတင်ပြီးပါပြီ ✅');
  });
}
// ---- notification scheduler (works while the page is open) ----
function fireNotif(title, body) {
  toast(title + ' — ' + body, 4000);
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: body });
    }
  } catch (e) { /* ignore */ }
}
function scheduleCheck() {
  // Called on load, on data change, and every minute. Fires due reminders once.
  const r = DB.reminders;
  const t = todayStr(), hm = nowHM(), mins = hmToMin(hm);
  const firedKey = 'fired_' + t;
  let fired = {};
  try { fired = JSON.parse(sessionStorage.getItem(firedKey) || '{}'); } catch (e) {}
  const mark = (k) => { fired[k] = 1; try { sessionStorage.setItem(firedKey, JSON.stringify(fired)); } catch (e) {} };

  if (r.medEnabled) {
    DB.meds.forEach(m => {
      (m.times || []).forEach(tm => {
        const k = 'med_' + m.id + '_' + tm;
        if (!fired[k] && Math.abs(mins - hmToMin(tm)) <= 2) {
          const dayLog = (DB.medLog[t] || {});
          if (dayLog[m.id + '@' + tm] !== 'taken') {
            fireNotif('💊 ဆေးသောက်ချိန်', m.name + (m.dosage ? ' (' + m.dosage + ')' : '') + ' သောက်ဖို့ အချိန်ရောက်ပါပြီ');
            mark(k);
          }
        }
      });
    });
  }
  if (r.waterEnabled) {
    const k = 'water_' + Math.floor(mins / r.waterInterval);
    if (!fired[k] && mins >= hmToMin(r.waterStart) && mins <= hmToMin(r.waterEnd) && (mins % r.waterInterval) <= 2) {
      fireNotif('💧 ရေသောက်ပါ', 'ရေဓာတ်ပြည့်ဝဖို့ ရေတစ်ခွက် သောက်လိုက်ပါ');
      mark(k);
    }
  }
  if (r.sleepEnabled) {
    const k = 'sleep_' + t;
    if (!fired[k] && Math.abs(mins - hmToMin(r.bedtime)) <= 2) {
      fireNotif('😴 အိပ်ချိန်ရောက်ပါပြီ', 'အိပ်ရာဝင်ဖို့ ပြင်ဆင်လိုက်ပါ — မနက်ဖြန် လန်းဆန်းပါစေ');
      mark(k);
    }
  }
  // refill alerts (once per day, in-app)
  const rk = 'refill_' + t;
  if (!fired[rk]) {
    const low = DB.meds.map(m => ({ m: m, left: medSupplyLeft(m) })).filter(x => x.left != null && x.left <= 7 && x.left >= 0);
    if (low.length) {
      fireNotif('⚠️ ဆေးကုန်ခါနီးပါပြီ', low.map(x => x.m.name + ' (' + x.left + ' ရက်စာ)').join(', '));
      mark(rk);
    }
  }
}

// ============================================================
// VIEW: 📊 တိုးတက်မှု (Progress)
// ============================================================
function renderProgress() {
  const p = activeProfile();
  let html = '<div class="card"><div class="row space-between"><h3>⚖️ ကိုယ်အလေးချိန် မှတ်တမ်း</h3>' +
    '<button class="btn small-btn" id="btnAddWeight">＋ ထည့်မယ်</button></div>' +
    '<canvas id="chartWeight" class="chart"></canvas></div>';
  html += '<div class="card"><h3>📏 BMI မှတ်တမ်း</h3><canvas id="chartBmi" class="chart"></canvas></div>';
  html += '<div class="card"><h3>🗓️ ၇ ရက်အကျဉ်းချုပ်</h3><div id="weeklySummary"></div></div>';
  $('view-progress').innerHTML = html;

  const wl = DB.weightLog.filter(w => w.profileId === p.id).sort((a, b) => a.date < b.date ? -1 : 1);
  drawLineChart('chartWeight', [{
    label: 'ကိုယ်အလေးချိန် (kg)', color: '#0d7a5f',
    points: wl.map(w => ({ x: w.date.slice(5), y: +w.weight }))
  }], { unit: 'kg' });
  const h = parseFloat(p.height) || 0;
  drawLineChart('chartBmi', [{
    label: 'BMI', color: '#1f6fb2',
    points: wl.filter(w => h > 0).map(w => ({ x: w.date.slice(5), y: +w.weight / Math.pow(h / 100, 2) }))
  }], { unit: '' });

  // weekly summary
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(addDays(todayStr(), -i));
  let kcalSum = 0, waterSum = 0, stepsSum = 0, qSum = 0, qN = 0, taken = 0, total = 0;
  days.forEach(d => {
    kcalSum += DB.foodLog.filter(f => f.profileId === p.id && f.date === d).reduce((a, f) => a + (+f.kcal || 0), 0);
    waterSum += DB.waterLog[d] || 0;
    const a = DB.activityLog.find(x => x.profileId === p.id && x.date === d);
    if (a) stepsSum += a.steps || 0;
    DB.sleepLog.filter(s => s.profileId === p.id && s.date === d).forEach(s => { qSum += s.quality; qN++; });
    const sched = todaysMedSchedule(p.id, d);
    sched.forEach(s => { total++; if (s.status === 'taken') taken++; });
  });
  $('weeklySummary').innerHTML = '<table>' +
    '<tr><td>ပျမ်းမျှ ကယ်လိုရီ/နေ့</td><td><b>' + Math.round(kcalSum / 7) + ' kcal</b></td></tr>' +
    '<tr><td>ပျမ်းမျှ ရေ/နေ့</td><td><b>' + Math.round(waterSum / 7) + ' ml</b></td></tr>' +
    '<tr><td>စုစုပေါင်း ခြေလှမ်း</td><td><b>' + stepsSum + '</b></td></tr>' +
    '<tr><td>ပျမ်းမျှ အိပ်စက်မှု အရည်အသွေး</td><td><b>' + (qN ? (qSum / qN).toFixed(1) + ' / 5' : '—') + '</b></td></tr>' +
    '<tr><td>ဆေးသောက်မှန်ကန်မှု</td><td><b>' + (total ? Math.round(taken / total * 100) + '%' : '—') + '</b></td></tr>' +
    '</table>';

  $('btnAddWeight').addEventListener('click', () => {
    openModal('⚖️ ကိုယ်အလေးချိန် မှတ်တမ်း',
      '<label>နေ့</label><input id="mWDate" type="date" value="' + todayStr() + '">' +
      '<div class="form-grid"><div><label>အလေးချိန် (kg) *</label><input id="mWWeight" type="number" inputmode="decimal" placeholder="ဥပမာ 65.5"></div>' +
      '<div><label>ခါးပတ်လည် (လက်မ)</label><input id="mWWaist" type="number" inputmode="decimal" placeholder="ဥပမာ 32"></div></div>' +
      '<div class="mt"><button class="btn block" id="mWSave">သိမ်းမယ်</button></div>');
    $('mWSave').addEventListener('click', () => {
      const w = parseFloat($('mWWeight').value);
      if (!w || w <= 0) { toast('အလေးချိန် မှန်အောင်ထည့်ပါ'); return; }
      DB.weightLog.push({ id: uid(), profileId: p.id, date: $('mWDate').value || todayStr(),
        weight: w, waist: $('mWWaist').value.trim() });
      saveDB(); closeModal(); renderProgress(); toast('မှတ်တမ်းတင်ပြီးပါပြီ ✅');
    });
  });
}

// ============================================================
// VIEW: 📝 ရောဂါလက္ခဏာ (Symptom Diary)
// ============================================================
function renderSymptom() {
  const p = activeProfile();
  const list = DB.symptoms.filter(s => s.profileId === p.id)
    .sort((a, b) => (a.date + a.time) < (b.date + b.time) ? 1 : -1).slice(0, 30);
  const symOptions = (window.COMMON_SYMPTOMS || []).map(s =>
    '<option value="' + esc(s) + '">').join('');

  // weekly counts
  const weekAgo = addDays(todayStr(), -7);
  const counts = {};
  DB.symptoms.filter(s => s.profileId === p.id && s.date >= weekAgo)
    .forEach(s => { counts[s.name] = (counts[s.name] || 0) + 1; });
  const repeaters = Object.keys(counts).filter(k => counts[k] >= 3);

  let html = '';
  if (repeaters.length) {
    html += '<div class="alert">⚠️ <b>သတိပြုရန်:</b> ပြီးခဲ့တဲ့ ၇ ရက်အတွင်း ' +
      repeaters.map(k => '“' + esc(k) + '” (' + counts[k] + ' ကြိမ်)').join(', ') +
      ' ဖြစ်ပွားခဲ့ပါတယ်။ ဆရာဝန်နဲ့ ပြသဖို့ စဉ်းစားပါ။</div>';
  }
  html += '<div class="card"><h3>📝 လက္ခဏာ မှတ်တမ်းတင်ရန်</h3>' +
    '<div class="form-grid"><div><label>နေ့</label><input id="syDate" type="date" value="' + todayStr() + '"></div>' +
    '<div><label>အချိန်</label><input id="syTime" type="time" value="' + nowHM() + '"></div></div>' +
    '<label>လက္ခဏာ *</label><input id="syName" list="symList" placeholder="ဥပမာ ခေါင်းကိုက်"><datalist id="symList">' + symOptions + '</datalist>' +
    '<label>ပြင်းထန်မှု (1–5)</label><select id="sySev">' +
    [1, 2, 3, 4, 5].map(n => '<option value="' + n + '"' + (n === 2 ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>' +
    '<label>မှတ်ချက်</label><input id="syNote" placeholder="ဥပမာ ညနေ ၃ နာရီကတည်းက">' +
    '<div class="mt"><button class="btn block" id="btnAddSym">မှတ်တမ်းတင်မယ်</button></div></div>';

  html += '<div class="card"><h3>📊 ၇ ရက်အတွင်း အကြိမ်ရေ</h3>';
  const keys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  if (!keys.length) html += '<div class="muted">မရှိပါ</div>';
  else html += '<table><tr><th>လက္ခဏာ</th><th>အကြိမ်ရေ</th></tr>' +
    keys.map(k => '<tr><td>' + esc(k) + '</td><td><b>' + counts[k] + '</b></td></tr>').join('') + '</table>';
  html += '</div>';

  html += '<div class="card"><h3>🕘 နောက်ဆုံး မှတ်တမ်းများ</h3>';
  if (!list.length) html += '<div class="muted">မရှိသေးပါ</div>';
  list.forEach(s => {
    html += '<div class="list-item"><div class="grow"><b>' + esc(s.name) + '</b> ' +
      '<span class="tag">အဆင့် ' + s.severity + '</span>' +
      '<div class="small muted">' + fmtDateMm(s.date) + ' ' + fmtTimeMm(s.time) + (s.note ? ' · ' + esc(s.note) : '') + '</div></div>' +
      '<button class="btn small-btn danger" data-delsym="' + s.id + '">ဖျက်မယ်</button></div>';
  });
  html += '</div>';

  $('view-symptom').innerHTML = html;
  $('btnAddSym').addEventListener('click', () => {
    const name = $('syName').value.trim();
    if (!name) { toast('လက္ခဏာ ထည့်ပေးပါ'); return; }
    DB.symptoms.push({ id: uid(), profileId: p.id, date: $('syDate').value || todayStr(),
      time: $('syTime').value || nowHM(), name: name,
      severity: parseInt($('sySev').value, 10), note: $('syNote').value.trim() });
    saveDB(); renderSymptom(); toast('မှတ်တမ်းတင်ပြီးပါပြီ ✅');
  });
  $('view-symptom').querySelectorAll('[data-delsym]').forEach(b =>
    b.addEventListener('click', () => {
      DB.symptoms = DB.symptoms.filter(x => x.id !== b.dataset.delsym);
      saveDB(); renderSymptom();
    }));
}

// ============================================================
// VIEW: 🚨 အရေးပေါ် (Emergency)
// ============================================================
function renderEmergency() {
  const p = activeProfile();
  let html = '<div class="card"><h3>🚨 အရေးပေါ် အချက်အလက်</h3>' +
    '<table>' +
    '<tr><td><b>အမည်</b></td><td>' + esc(p.name) + '</td></tr>' +
    '<tr><td><b>သွေးအမျိုးအစား</b></td><td><b style="font-size:1.3rem;color:#d64545">' + esc(p.bloodType || '—') + '</b></td></tr>' +
    '<tr><td><b>ဓာတ်မတည့်မှု</b></td><td>' + (p.allergies.length ? p.allergies.map(esc).join(', ') : '—') + '</td></tr>' +
    '<tr><td><b>နာတာရှည်ရောဂါ</b></td><td>' + (p.conditions.length ? p.conditions.map(esc).join(', ') : '—') + '</td></tr>' +
    '<tr><td><b>သောက်နေသောဆေးများ</b></td><td>' + (DB.meds.filter(m => m.profileId === p.id).map(m => esc(m.name)).join(', ') || '—') + '</td></tr>' +
    '</table></div>';

  html += '<div class="card"><div class="row space-between"><h3>📞 အရေးပေါ် ဆက်သွယ်ရမည့်သူများ</h3>' +
    '<button class="btn small-btn" id="btnAddContact">＋ ထည့်မယ်</button></div>';
  if (!DB.emergencyContacts.length) html += '<div class="muted">မထည့်ရသေးပါ</div>';
  DB.emergencyContacts.forEach(c => {
    html += '<div class="list-item"><div class="grow"><b>' + esc(c.name) + '</b>' +
      '<div class="small muted">' + esc(c.relation || '') + ' · ' + esc(c.phone) + '</div></div>' +
      '<a class="btn small-btn" href="tel:' + esc(c.phone.replace(/\s/g, '')) + '">📞 ခေါ်မယ်</a>' +
      '<button class="btn small-btn danger" data-delcontact="' + c.id + '">ဖျက်မယ်</button></div>';
  });
  html += '<div class="small muted mt">💡 အရေးပေါ်အခြေအနေမှာ အထက်ပါ ခလုတ်နှိပ်ရုံနဲ့ ဖုန်းခေါ်နိုင်ပါတယ်</div></div>';

  $('view-emergency').innerHTML = html;
  $('btnAddContact').addEventListener('click', () => {
    openModal('📞 ဆက်သွယ်ရန် ထည့်မယ်',
      '<label>အမည် *</label><input id="mCName" placeholder="ဥပမာ အမေ">' +
      '<label>ဖုန်းနံပါတ် *</label><input id="mCPhone" type="tel" inputmode="tel" placeholder="ဥပမာ 09xxxxxxxxx">' +
      '<label>တော်စပ်ပုံ</label><input id="mCRel" placeholder="ဥပမာ မိခင်">' +
      '<div class="mt"><button class="btn block" id="mCSave">သိမ်းမယ်</button></div>');
    $('mCSave').addEventListener('click', () => {
      const name = $('mCName').value.trim(), phone = $('mCPhone').value.trim();
      if (!name || !phone) { toast('အမည် နှင့် ဖုန်း ထည့်ပေးပါ'); return; }
      DB.emergencyContacts.push({ id: uid(), name: name, phone: phone, relation: $('mCRel').value.trim() });
      saveDB(); closeModal(); renderEmergency(); toast('ထည့်ပြီးပါပြီ ✅');
    });
  });
  $('view-emergency').querySelectorAll('[data-delcontact]').forEach(b =>
    b.addEventListener('click', () => {
      DB.emergencyContacts = DB.emergencyContacts.filter(x => x.id !== b.dataset.delcontact);
      saveDB(); renderEmergency();
    }));
}

// ============================================================
// VIEW: 🩸 ရာသီစက် (Period Tracker)
// ============================================================
function renderPeriod() {
  const p = activeProfile();
  if (!p.periodEnabled) {
    $('view-period').innerHTML = '<div class="card"><h3>🩸 ရာသီစက် မှတ်တမ်း</h3>' +
      '<div class="info-box">ဒီ module ကို သုံးဖို့ <b>ကျန်းမာရေးဖိုင်</b> tab မှာ “ရာသီစက် မှတ်တမ်း သုံးမယ်” ကို အမှန်ခြစ်ပေးပါ။</div>' +
      '<button class="btn" id="btnEnablePeriod">ဖွင့်မယ်</button></div>';
    $('btnEnablePeriod').addEventListener('click', () => {
      p.periodEnabled = true; saveDB(); renderPeriod(); toast('ဖွင့်ပြီးပါပြီ ✅');
    });
    return;
  }
  const logs = DB.periodLog.filter(x => x.profileId === p.id).sort((a, b) => a.start < b.start ? -1 : 1);
  let predHtml = '<div class="muted">ခန့်မှန်းဖို့ မှတ်တမ်း အနည်းဆုံး ၂ ခု လိုပါတယ်</div>';
  if (logs.length >= 2) {
    const diffs = [];
    for (let i = 0; i < Math.min(3, logs.length - 1); i++) {
      diffs.push(Math.round((new Date(logs[i].start) - new Date(logs[i + 1].start)) / 86400000));
    }
    const avg = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    const next = addDays(logs[0].start, avg);
    const daysLeft = Math.round((new Date(next + 'T12:00:00') - new Date(todayStr() + 'T12:00:00')) / 86400000);
    predHtml = '<div class="info-box">📅 ပျမ်းမျှ စက်ဝန်း: <b>' + avg + ' ရက်</b><br>' +
      'နောက်တစ်ကြိမ် ခန့်မှန်း: <b>' + fmtDateMm(next) + '</b>' +
      (daysLeft >= 0 ? ' (' + daysLeft + ' ရက် အလို)' : ' (' + (-daysLeft) + ' ရက် ကျော်လွန်)') + '</div>';
  }
  let html = '<div class="card"><div class="row space-between"><h3>🩸 ရာသီစက် မှတ်တမ်း</h3>' +
    '<button class="btn small-btn" id="btnAddPeriod">＋ ထည့်မယ်</button></div>' + predHtml;
  if (!logs.length) html += '<div class="muted mt">မရှိသေးပါ</div>';
  logs.slice(0, 12).forEach(l => {
    html += '<div class="list-item"><div class="grow"><b>' + fmtDateMm(l.start) + '</b></div>' +
      '<button class="btn small-btn danger" data-delperiod="' + l.id + '">ဖျက်မယ်</button></div>';
  });
  html += '</div>';
  $('view-period').innerHTML = html;
  $('btnAddPeriod').addEventListener('click', () => {
    openModal('🩸 ရာသီစက် မှတ်တမ်း',
      '<label>စတင်သည့်နေ့</label><input id="mPDate" type="date" value="' + todayStr() + '">' +
      '<div class="mt"><button class="btn block" id="mPSave2">သိမ်းမယ်</button></div>');
    $('mPSave2').addEventListener('click', () => {
      DB.periodLog.push({ id: uid(), profileId: p.id, start: $('mPDate').value || todayStr() });
      saveDB(); closeModal(); renderPeriod(); toast('မှတ်တမ်းတင်ပြီးပါပြီ ✅');
    });
  });
  $('view-period').querySelectorAll('[data-delperiod]').forEach(b =>
    b.addEventListener('click', () => {
      DB.periodLog = DB.periodLog.filter(x => x.id !== b.dataset.delperiod);
      saveDB(); renderPeriod();
    }));
}

// ============================================================
// VIEW: 🖨️ ဆရာဝန်အစီရင်ခံစာ (Doctor Report)
// ============================================================
function renderReport() {
  const p = activeProfile();
  const bmi = calcBMI(p);
  const wl = DB.weightLog.filter(w => w.profileId === p.id).sort((a, b) => a.date < b.date ? -1 : 1);
  const lastW = wl[0];
  const meds = DB.meds.filter(m => m.profileId === p.id);
  const recentSym = DB.symptoms.filter(s => s.profileId === p.id).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 10);
  const recentSleep = DB.sleepLog.filter(s => s.profileId === p.id).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 7);
  const weekAgo = addDays(todayStr(), -7);
  let kcal7 = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(todayStr(), -i);
    kcal7 += DB.foodLog.filter(f => f.profileId === p.id && f.date === d).reduce((a, f) => a + (+f.kcal || 0), 0);
  }

  let html = '<div class="card no-print"><h3>🖨️ ဆရာဝန်ပြရန် အစီရင်ခံစာ</h3>' +
    '<div class="muted">အောက်ပါ အကျဉ်းချုပ်ကို print ထုတ်ပြီး ဆရာဝန်ထံ ယူသွားနိုင်ပါတယ်</div>' +
    '<div class="mt"><button class="btn block" id="btnPrint">🖨️ Print ထုတ်မယ် / PDF သိမ်းမယ်</button></div></div>';

  html += '<div class="card"><h3>👤 လူနာ အချက်အလက် (' + fmtDateMm(todayStr()) + ')</h3><table>' +
    '<tr><td><b>အမည်</b></td><td>' + esc(p.name) + '</td></tr>' +
    '<tr><td><b>အသက် / ကျား-မ</b></td><td>' + esc(p.age || '—') + ' / ' + (p.gender === 'male' ? 'ကျား' : p.gender === 'female' ? 'မ' : '—') + '</td></tr>' +
    '<tr><td><b>အရပ် / အလေးချိန်</b></td><td>' + esc(p.height || '—') + ' cm / ' + (lastW ? lastW.weight + ' kg (' + fmtDateMm(lastW.date) + ')' : esc(p.weight || '—') + ' kg') + '</td></tr>' +
    '<tr><td><b>BMI</b></td><td>' + (bmi ? bmi.toFixed(1) + ' (' + bmiLabel(bmi) + ')' : '—') + '</td></tr>' +
    '<tr><td><b>သွေးအမျိုးအစား</b></td><td>' + esc(p.bloodType || '—') + '</td></tr>' +
    '<tr><td><b>နာတာရှည်ရောဂါ</b></td><td>' + (p.conditions.map(esc).join(', ') || '—') + '</td></tr>' +
    '<tr><td><b>မျိုးရိုးရောဂါ</b></td><td>' + (p.familyHistory.map(esc).join(', ') || '—') + '</td></tr>' +
    '<tr><td><b>ဓာတ်မတည့်မှု</b></td><td>' + (p.allergies.map(esc).join(', ') || '—') + '</td></tr>' +
    '</table></div>';

  html += '<div class="card"><h3>💊 လက်ရှိသောက်နေသောဆေးများ</h3>';
  html += meds.length ? '<table><tr><th>ဆေး</th><th>ပမာဏ</th><th>အချိန်</th><th>အကြောင်းအရင်း</th></tr>' +
    meds.map(m => '<tr><td>' + esc(m.name) + '</td><td>' + esc(m.dosage || '—') + '</td><td>' + (m.times || []).map(fmtTimeMm).join(', ') + '</td><td>' + esc(m.reason || '—') + '</td></tr>').join('') + '</table>'
    : '<div class="muted">မရှိပါ</div>';
  html += '</div>';

  html += '<div class="card"><h3>📊 ၇ ရက်အတွင်း အကျဉ်းချုပ်</h3><table>' +
    '<tr><td><b>ပျမ်းမျှ ကယ်လိုရီ</b></td><td>' + Math.round(kcal7 / 7) + ' kcal/နေ့ (ရည်မှန်း ' + calorieTarget(p) + ')</td></tr>' +
    '<tr><td><b>ပျမ်းမျှ ရေ</b></td><td>' + Math.round([0,1,2,3,4,5,6].reduce((a,i) => a + (DB.waterLog[addDays(todayStr(),-i)] || 0), 0) / 7) + ' ml/နေ့</td></tr>' +
    '<tr><td><b>အိပ်စက်မှု</b></td><td>' + (recentSleep.length ? recentSleep.map(s => fmtDateMm(s.date) + ': ' + sleepDuration(s) + ' (အရည်အသွေး ' + s.quality + '/5' + (s.nightmare ? ', အိပ်မက်ဆိုး' : '') + ')').join('<br>') : 'မှတ်တမ်း မရှိ') + '</td></tr>' +
    '</table></div>';

  html += '<div class="card"><h3>📝 နောက်ဆုံး လက္ခဏာများ</h3>';
  html += recentSym.length ? '<table><tr><th>နေ့</th><th>လက္ခဏာ</th><th>ပြင်းထန်မှု</th></tr>' +
    recentSym.map(s => '<tr><td>' + fmtDateMm(s.date) + '</td><td>' + esc(s.name) + (s.note ? ' (' + esc(s.note) + ')' : '') + '</td><td>' + s.severity + '/5</td></tr>').join('') + '</table>'
    : '<div class="muted">မရှိပါ</div>';
  html += '</div>';

  html += '<div class="small muted">⚠️ ဒီအစီရင်ခံစာကို app မှတ်တမ်းများမှ အလိုအလျောက် ထုတ်လုပ်ထားခြင်းဖြစ်ပြီး ဆေးပညာအကြံဉာဏ် မဟုတ်ပါ။</div>';

  $('view-report').innerHTML = html;
  $('btnPrint').addEventListener('click', () => window.print());
}

// ============================================================
// VIEW: ⚙️ ဆက်တင် (Settings)
// ============================================================
function renderSettings() {
  const s = DB.settings;
  let html = '<div class="card"><h3>🤖 ကိုယ်ပိုင် AI API Keys (BYOK)</h3>' +
    '<div class="small muted mb">Key တွေကို ဒီဖုန်း/စက်ထဲမှာပဲ သိမ်းထားပါတယ် — server ကို မပို့ပါ။ AI လုပ်ဆောင်ချက်များ: ဆေးဓာတ်ပြုမှု စစ်ဆေးခြင်း၊ အစီအစဉ် ထုတ်လုပ်ခြင်း၊ ပုံမှ အစားအစာ ဆန်းစစ်ခြင်း၊ AI အကြံပြုချက်။</div>' +
    '<label>Gemini API Key</label><input id="setGemini" type="password" value="' + esc(s.geminiKey) + '" placeholder="AIza…">' +
    '<label>Gemini Model</label><input id="setGeminiModel" list="geminiModelList" value="' + esc(geminiModelName()) + '" placeholder="gemini-3.8-flash">' +
    '<datalist id="geminiModelList"><option value="gemini-3.8-flash"></option></datalist>' +
    '<div class="small muted mb">ကြိုက်တဲ့ model နာမည်ကို ရွေးချယ်နိုင် / ကိုယ်တိုင် ရိုက်ထည့်နိုင်ပါတယ်</div>' +
    '<label>OpenAI API Key</label><input id="setOpenai" type="password" value="' + esc(s.openaiKey) + '" placeholder="sk-…">' +
    '<label>Claude API Key</label><input id="setClaude" type="password" value="' + esc(s.claudeKey) + '" placeholder="sk-ant-…">' +
    '<div class="mt mb"><b>🆓 အခမဲ့ AI (OpenAI-compatible)</b>' +
    '<div class="small muted">Groq — console.groq.com မှာ အခမဲ့ key ယူလို့ရပါတယ် (ကတ်မလို, gsk_ နဲ့စပါတယ်)။ OpenRouter — openrouter.ai (အခမဲ့ model များ)။ Custom key ထည့်ထားရင် အဲဒါကို အရင်ဆုံးသုံးမယ်။</div></div>' +
    '<label>Base URL</label><input id="setCustomBase" value="' + esc(s.customBase) + '" placeholder="https://api.groq.com/openai/v1">' +
    '<label>API Key</label><input id="setCustomKey" type="password" value="' + esc(s.customKey) + '" placeholder="gsk_…">' +
    '<label>Model</label><input id="setCustomModel" value="' + esc(s.customModel) + '" placeholder="openai/gpt-oss-20b">' +
    '<label class="row mt" style="gap:8px;align-items:flex-start"><input type="checkbox" id="setPollinations" style="width:auto;margin-top:4px"' + (s.pollinations ? ' checked' : '') + '>' +
    '<span>🆓 <b>Pollinations</b> — key မလို, အခမဲ့သုံးမယ် (တခြား key မရှိရင် အရန်အဖြစ် သုံးမယ်)</span></label>' +
    '<div class="mt"><button class="btn block" id="btnSaveKeys">💾 Keys များ သိမ်းမယ်</button></div>' +
    '<div class="small muted mt">လက်ရှိ AI: <b>' + ({ gemini: 'Gemini (' + esc(geminiModelName()) + ')', openai: 'OpenAI', claude: 'Claude', custom: 'Custom (' + esc(s.customModel || 'default model') + ')', pollinations: 'Pollinations (အခမဲ့)' }[aiProvider()] || 'မရှိပါ (offline mode)') + '</b></div></div>';

  html += '<div class="card"><h3>👤 Google အကောင့်နဲ့ ဝင်ရန်</h3>' +
    '<div class="small muted mb">ကိုယ်ပိုင် Google Cloud Console မှ OAuth Client ID ထည့်ပါ။ ID မထည့်ထားရင် login မလိုအပ်ဘဲ local mode နဲ့ အလုပ်လုပ်ပါတယ်။</div>' +
    '<label>Google OAuth Client ID</label><input id="setGid" value="' + esc(s.googleClientId) + '" placeholder="xxxxx.apps.googleusercontent.com">' +
    '<div class="row wrap mt"><button class="btn secondary" id="btnSaveGid">သိမ်းမယ်</button>' +
    (s.googleClientId ? '<button class="btn" id="btnGoogleSign">🔵 Google နဲ့ ဝင်မယ်</button>' : '') + '</div>' +
    '<div id="googleBtnBox" class="mt"></div>' +
    (s.googleUser ? '<div class="ok-box mt">✅ ဝင်ထားပြီးသား: <b>' + esc(s.googleUser.name || '') + '</b> (' + esc(s.googleUser.email || '') + ') ' +
      '<button class="btn small-btn danger" id="btnGoogleOut">ထွက်မယ်</button></div>' : '') + '</div>';

  html += '<div class="card"><h3>💾 Data Backup</h3>' +
    '<div class="row wrap"><button class="btn secondary" id="btnExport">⬇️ Export (JSON)</button>' +
    '<label class="btn secondary" style="margin:0;cursor:pointer">⬆️ Import (JSON)<input id="importFile" type="file" accept=".json,application/json" style="display:none"></label></div>' +
    '<div class="small muted mt">မှတ်တမ်းအားလုံးကို ဖိုင်အဖြစ် သိမ်းနိုင် / ပြန်ထည့်နိုင်ပါတယ်</div></div>';

  html += '<div class="card"><h3>🔗 ချိတ်ဆက်မှုများ</h3>' +
    '<div class="list-item" style="opacity:.55"><div class="grow"><b>❤️ Health Connect</b><div class="small muted">ခြေလှမ်း/အိပ်ချိန် အလိုအလျောက်ဆွဲယူခြင်း</div></div>' +
    '<span class="tag">APK version မှာ ရမယ်</span></div></div>';

  html += '<div class="card"><h3>🔒 Privacy</h3>' +
    '<div class="info-box">ဒီ app ရဲ့ data အားလုံး ဒီ device ရဲ့ localStorage ထဲမှာပဲ ရှိပါတယ် — server မရှိ၊ အကောင့် မလိုအပ်ပါ။ Google login သုံးရင်တောင် ကျန်းမာရေးမှတ်တမ်းတွေကို Google ကို မပို့ပါ။</div>' +
    '<div class="small muted">ဘာသာစကား: မြန်မာ (အခုလောလောဆယ်)</div></div>';

  html += '<div class="card"><h3>🗑️ အန္တရာယ်ဇုန်</h3>' +
    '<button class="btn danger block" id="btnWipe">Data အားလုံး ဖျက်မယ်</button></div>';

  $('view-settings').innerHTML = html;

  $('btnSaveKeys').addEventListener('click', () => {
    s.geminiKey = $('setGemini').value.trim();
    s.geminiModel = $('setGeminiModel').value.trim() || 'gemini-3.8-flash';
    s.openaiKey = $('setOpenai').value.trim();
    s.claudeKey = $('setClaude').value.trim();
    s.customBase = $('setCustomBase').value.trim();
    s.customKey = $('setCustomKey').value.trim();
    s.customModel = $('setCustomModel').value.trim();
    s.pollinations = $('setPollinations').checked;
    saveDB(); toast('Keys များ သိမ်းပြီးပါပြီ ✅'); renderSettings();
  });
  $('btnSaveGid').addEventListener('click', () => {
    s.googleClientId = $('setGid').value.trim();
    saveDB(); toast('သိမ်းပြီးပါပြီ ✅'); renderSettings();
  });
  const gBtn = $('btnGoogleSign');
  if (gBtn) gBtn.addEventListener('click', googleSignIn);
  const gOut = $('btnGoogleOut');
  if (gOut) gOut.addEventListener('click', () => {
    s.googleUser = null; saveDB(); renderSettings(); toast('ထွက်ပြီးပါပြီ');
  });
  $('btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'health-app-backup-' + todayStr() + '.json';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Export လုပ်ပြီးပါပြီ ✅');
  });
  $('importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.profiles)) throw new Error('ဖိုင်ပုံစံ မမှန်ပါ');
        if (!confirm('လက်ရှိ data အားလုံး အစားထိုးမှာလား?')) return;
        DB = Object.assign(defaultDB(), parsed);
        saveDB(); refreshProfileSwitcher(); renderSettings(); toast('Import လုပ်ပြီးပါပြီ ✅');
      } catch (err) { toast('Import မအောင်မြင်ပါ: ' + err.message); }
    };
    reader.readAsText(file);
  });
  $('btnWipe').addEventListener('click', () => {
    if (!confirm('တကယ် ဖျက်မှာလား? ဒါကို ပြန်မရနိုင်ပါ!')) return;
    if (!confirm('နောက်တစ်ကြိမ် အတည်ပြုပါ — data အားလုံး ပျောက်မှာပါ')) return;
    localStorage.removeItem(STORE_KEY);
    DB = defaultDB(); saveDB(); refreshProfileSwitcher(); showTab('home');
    toast('ဖျက်ပြီးပါပြီ');
  });
}
// Google Identity Services is loaded ONLY when the user entered their own Client ID.
let gisLoading = false;
function googleSignIn() {
  const cid = DB.settings.googleClientId;
  if (!cid) { toast('အရင် Client ID ထည့်ပါ'); return; }
  const done = () => {
    try {
      google.accounts.id.initialize({
        client_id: cid,
        callback: (resp) => {
          try {
            const payload = JSON.parse(atob(resp.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            DB.settings.googleUser = { name: payload.name || '', email: payload.email || '' };
            saveDB(); renderSettings(); toast('ဝင်ရောက်ပြီးပါပြီ ✅');
          } catch (e) { toast('Login အဖြေဖတ်မရပါ'); }
        }
      });
      google.accounts.id.prompt();
    } catch (e) { toast('Google Sign-In စတင်၍မရပါ: ' + e.message); }
  };
  if (window.google && google.accounts && google.accounts.id) { done(); return; }
  if (gisLoading) { toast('ခဏစောင့်ပါ…'); return; }
  gisLoading = true;
  const sc = document.createElement('script');
  sc.src = 'https://accounts.google.com/gsi/client';
  sc.async = true; sc.defer = true;
  sc.onload = () => { gisLoading = false; done(); };
  sc.onerror = () => { gisLoading = false; toast('Google script ခေါ်၍မရပါ (internet လိုပါတယ်)'); };
  document.head.appendChild(sc);
}

// ---------------- render registry & init ----------------
const RENDER = {
  home: renderHome, profile: renderProfile, meds: renderMeds, plan: renderPlan,
  food: renderFood, remind: renderRemind, progress: renderProgress, symptom: renderSymptom,
  emergency: renderEmergency, period: renderPeriod, report: renderReport, settings: renderSettings,
};
function init() {
  loadDB();
  buildTabbar();
  refreshProfileSwitcher();
  $('profileSwitcher').addEventListener('change', (e) => switchProfile(e.target.value));
  $('btnAddProfile').addEventListener('click', () => { showTab('profile'); });
  $('modalClose').addEventListener('click', closeModal);
  $('modalOverlay').addEventListener('click', (e) => { if (e.target === $('modalOverlay')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  showTab('home');
  scheduleCheck();
  setInterval(scheduleCheck, 60000); // check reminders every minute while open
}
document.addEventListener('DOMContentLoaded', init);
