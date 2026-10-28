// 데이터 층: firebase-config.json이 있으면 Firebase, 없으면 데모(이 브라우저 안에만 저장).
const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
let mode = null, fb = null, db = null, auth = null, F = null, A = null;

export async function init() {
  if (mode) return mode;
  let cfg = null;
  try {
    const r = await fetch("/firebase-config.json", { cache: "no-store" });
    if (r.ok) cfg = await r.json();
  } catch (e) {}
  if (cfg && cfg.apiKey) {
    const appM = await import(SDK + "firebase-app.js");
    F = await import(SDK + "firebase-firestore.js");
    A = await import(SDK + "firebase-auth.js");
    fb = appM.initializeApp(cfg);
    db = F.getFirestore(fb);
    auth = A.getAuth(fb);
    mode = "firebase";
  } else {
    mode = "demo";
  }
  return mode;
}
export const isDemo = () => mode === "demo";

/* ---------- 기능 켜고 끄기 ---------- */
// 늘 켜짐: 학원 소개, 반·시간표, 오시는 길, 입회·상담 신청, 관리자 한눈에·일정, 처음 설정
export const FEAT = [
  ["report", "월말 리포트", "학생별 리포트를 쓰고 링크로 보내요"],
  ["pay", "원비 납부 표", "달마다 납부·미납을 표로 봐요"],
  ["fees", "원비 공개", "홈페이지에 반별 원비를 보여요"],
  ["teachers", "선생님 소개", "홈페이지에 선생님 카드를 보여요"],
  ["reviews", "후기", "이름을 가린 학부모 후기를 보여요"],
  ["notice", "공지 띠", "맨 위에 기한 있는 공지를 띄워요"],
  ["leveltest", "레벨테스트", "문항을 풀면 추천 반이 나와요"],
  ["makeup", "보강 신청", "학부모가 홈페이지에서 보강을 신청해요"]
];
export const on = (c, f) => !!(c && c.features && c.features[f] === true);
// 데모: 같은 학원 자료를 다른 모양으로
const DEMO_THEMES = {
  a: { layout: "split", palette: { primary: "#1E5BB8", accent: "", mode: "white" }, font: "clean", radius: "soft", density: "airy" },
  b: { layout: "magazine", palette: { primary: "#0F766E", accent: "", mode: "tint" }, font: "serif", radius: "sharp", density: "airy" },
  c: { layout: "cards", palette: { primary: "#E0622D", accent: "#7C3AED", mode: "deep" }, font: "bold", radius: "round", density: "compact" },
  d: { layout: "timetable", palette: { primary: "#7C3AED", accent: "", mode: "white" }, font: "clean", radius: "soft", density: "compact" },
  e: { layout: "center", palette: { primary: "#BE185D", accent: "", mode: "tint" }, font: "serif", radius: "round", density: "airy" },
  f: { layout: "flow", palette: { primary: "#334155", accent: "#0EA5E9", mode: "white" }, font: "bold", radius: "sharp", density: "compact" }
};
const DEMO_PRESET = { full: Object.fromEntries(FEAT.map(f => [f[0], true])), basic: Object.fromEntries(FEAT.map(f => [f[0], false])) };

/* ---------- 학원마다 다른 모양 (사진 없이): theme ---------- */
// theme: { layout, palette: { primary, accent, mode }, font, radius, density }
export const THEME = {
  layout: [["split", "나란히", "글 왼쪽, 요약 오른쪽"], ["center", "가운데", "가운데 큰 제목"], ["timetable", "시간표 먼저", "첫 화면에 반·시간표"], ["magazine", "잡지", "글 중심, 번호 붙은 장"], ["cards", "카드", "색 띠 첫 화면, 카드 묶음"], ["flow", "세로 한 줄", "PC에서도 한 줄로 흐름"]],
  mode: [["white", "흰 바탕"], ["tint", "옅은 색 바탕"], ["deep", "진한 첫 화면"]],
  font: [["clean", "단정한 고딕"], ["serif", "명조 제목"], ["bold", "굵은 고딕"]],
  radius: [["sharp", "각지게"], ["soft", "부드럽게"], ["round", "둥글게"]],
  density: [["airy", "넉넉하게"], ["compact", "촘촘하게"]]
};
export const THEME_DEFAULT = { layout: "split", palette: { primary: "#1E5BB8", accent: "", mode: "white" }, font: "clean", radius: "soft", density: "airy" };
export const themeOf = c => {
  const t = (c && c.theme) || {}, p = t.palette || {};
  return { ...THEME_DEFAULT, ...t, palette: { ...THEME_DEFAULT.palette, primary: (c && c.color) || THEME_DEFAULT.palette.primary, ...p } };
};
export const primaryOf = c => themeOf(c).palette.primary;

/* 색 계산: 주 색 하나에서 팔레트를 만들고 글자 대비 4.5:1을 맞춘다 */
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = a => "#" + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
function rgb2hsl([r, g, b]) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s * 100, l * 100]; }
function hsl2rgb([h, s, l]) { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return [f(0) * 255, f(8) * 255, f(4) * 255]; }
const hsl = (h, s, l) => rgb2hex(hsl2rgb([((h % 360) + 360) % 360, s, l]));
const lum = h => { const c = hex2rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
function darkenTo(hex, against, ratio) { let [h, s, l] = rgb2hsl(hex2rgb(hex)); let c = hex; while (contrast(c, against) < ratio && l > 5) { l -= 2; c = hsl(h, s, l); } return c; }
export function palette(t) {
  const p = t.palette, base = /^#[0-9a-f]{6}$/i.test(p.primary || "") ? p.primary.toUpperCase() : "#1E5BB8";
  const [h, s0] = rgb2hsl(hex2rgb(base)); const s = Math.max(s0, 18);
  const bg = p.mode === "tint" ? hsl(h, Math.min(s, 45), 98) : "#FFFFFF";
  const pri = darkenTo(base, "#FFFFFF", 4.5);               // 흰 글자를 올리는 버튼 색
  const priDeep = darkenTo(hsl(h, Math.min(s, 70), 26), "#FFFFFF", 8);
  const ink = hsl(h, Math.min(s, 28), 12), sub = darkenTo(hsl(h, Math.min(s, 14), 42), bg, 4.5);
  const soft = hsl(h, Math.min(s, 40), 96), line = hsl(h, Math.min(s, 22), 88);
  const priSoft = hsl(h, Math.min(s, 70), 94), priLine = hsl(h, Math.min(s, 55), 80);
  const accBase = /^#[0-9a-f]{6}$/i.test(p.accent || "") ? p.accent : hsl(h + 38, Math.min(Math.max(s, 55), 80), 46);
  const acc = darkenTo(accBase, "#FFFFFF", 4.5); const [ah, as] = rgb2hsl(hex2rgb(acc));
  return { bg, pri, "pri-deep": priDeep, "pri-soft": priSoft, "pri-line": priLine, acc, "acc-soft": hsl(ah, Math.min(as, 70), 94), ink, sub, soft, line,
    _check: { "흰 글자/주 색": contrast("#FFFFFF", pri), "본문/바탕": contrast(ink, bg), "흐린 글자/바탕": contrast(sub, bg), "흰 글자/보조 색": contrast("#FFFFFF", acc) } };
}
export function applyTheme(c) {
  const t = themeOf(c), h = document.documentElement, P = palette(t);
  for (const [k, v] of Object.entries(P)) if (k[0] !== "_") h.style.setProperty("--" + k, v);
  h.dataset.layout = t.layout; h.dataset.mode = t.palette.mode; h.dataset.font = t.font; h.dataset.corner = t.radius; h.dataset.density = t.density;
  return P;
}
export const applyLook = applyTheme;
// 로고 그림에서 주 색 뽑기: 너무 밝거나 어둡거나 흐린 색은 빼고 가장 많은 색
export function colorFromImage(src) {
  return new Promise(res => {
    const img = new Image(); img.onload = () => {
      const cv = document.createElement("canvas"); cv.width = cv.height = 48; const x = cv.getContext("2d"); x.drawImage(img, 0, 0, 48, 48);
      const d = x.getImageData(0, 0, 48, 48).data, bins = {};
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 200) continue; const r = d[i], g = d[i + 1], b = d[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx < 40 || mn > 215 || mx - mn < 40) continue;
        const k = (r >> 4) + "," + (g >> 4) + "," + (b >> 4); (bins[k] = bins[k] || [0, 0, 0, 0]); bins[k][0] += r; bins[k][1] += g; bins[k][2] += b; bins[k][3]++;
      }
      const top = Object.values(bins).sort((a, b) => b[3] - a[3])[0];
      if (!top) return res(null);
      let [r, g, b] = top.slice(0, 3).map(v => v / top[3]);
      const L = (0.299 * r + 0.587 * g + 0.114 * b); if (L > 150) { const f = 150 / L; r *= f; g *= f; b *= f; } // 흰 글자가 읽히게 어둡게
      res("#" + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase());
    }; img.onerror = () => res(null); img.src = src;
  });
}

/* ---------- 학원 정보 ---------- */
export async function loadDefaults() {
  const r = await fetch("/academy.json", { cache: "no-store" });
  return r.ok ? r.json() : {};
}
// fallback: 아직 관리자 화면에서 저장하기 전이면 academy.json 값으로 홈페이지를 그린다(관리자 화면은 false).
export async function getConfig(fallback = true) {
  await init();
  if (mode === "demo") {
    const pre = new URLSearchParams(location.search).get("demo");
    const s = localStorage.getItem("ah:config");
    let c = s ? JSON.parse(s) : await loadDefaults();
    if (!c || !c.name) return null;
    const tp = new URLSearchParams(location.search).get("theme");
    if (DEMO_THEMES[tp]) { c = { ...c, theme: DEMO_THEMES[tp] }; localStorage.setItem("ah:config", JSON.stringify(c)); }
    if (DEMO_PRESET[pre]) { c = { ...c, features: { ...DEMO_PRESET[pre] } }; localStorage.setItem("ah:config", JSON.stringify(c)); }
    return c;
  }
  const snap = await F.getDoc(F.doc(db, "site", "config"));
  if (snap.exists()) return snap.data();
  if (!fallback) return null;
  const d = await loadDefaults().catch(() => ({}));
  return d.name ? d : null;
}
export async function saveConfig(c) {
  await init();
  const clean = JSON.parse(JSON.stringify(c));
  delete clean.admins; delete clean._help;
  if (mode === "demo") return localStorage.setItem("ah:config", JSON.stringify(clean));
  await F.setDoc(F.doc(db, "site", "config"), clean);
}

/* ---------- 상담 신청 (누구나 쓰기) ---------- */
export async function addInquiry(d) {
  await init();
  const row = { name: d.name, grade: d.grade, phone: d.phone, time: d.time, memo: d.memo || "", consent: true, status: "문의" };
  if (d.level) { row.level = d.level; row.source = "레벨테스트"; }
  if (mode === "demo") {
    const list = demoList("inquiries");
    list.unshift({ ...row, id: rid(8), createdAt: Date.now() });
    return demoSave("inquiries", list);
  }
  await F.addDoc(F.collection(db, "inquiries"), { ...row, createdAt: F.serverTimestamp() });
}

/* ---------- 보강 신청 (보강 신청을 켠 학원만, 누구나 쓰기) ---------- */
export async function addMakeup(d) {
  await init();
  const row = { name: d.name, cls: d.cls, missed: d.missed, want: d.want, phone: d.phone, consent: true, status: "신청" };
  if (mode === "demo") {
    const list = demoList("makeups"); list.unshift({ ...row, id: rid(8), createdAt: Date.now() }); return demoSave("makeups", list);
  }
  await F.addDoc(F.collection(db, "makeups"), { ...row, createdAt: F.serverTimestamp() });
}

/* ---------- 원장님 전용 모음 ---------- */
// 모음: inquiries, schedule, students, reports, payments, makeups
export async function list(col) {
  await init();
  if (mode === "demo") return demoList(col);
  const snap = await F.getDocs(F.collection(db, col));
  return snap.docs.map(d => {
    const v = d.data();
    if (v.createdAt && v.createdAt.toMillis) v.createdAt = v.createdAt.toMillis();
    return { ...v, id: d.id };
  });
}
export async function put(col, id, data) {
  await init();
  const v = { ...data }; delete v.id;
  if (mode === "demo") {
    const l = demoList(col); const i = l.findIndex(x => x.id === id);
    if (i >= 0) l[i] = { ...l[i], ...v, id }; else l.push({ ...v, id });
    return demoSave(col, l);
  }
  await F.setDoc(F.doc(db, col, id), v, { merge: true });
}
export async function del(col, id) {
  await init();
  if (mode === "demo") return demoSave(col, demoList(col).filter(x => x.id !== id));
  await F.deleteDoc(F.doc(db, col, id));
}
export async function getReport(token) {
  await init();
  if (mode === "demo") return demoList("reports").find(r => r.id === token) || null;
  const s = await F.getDoc(F.doc(db, "reports", token));
  return s.exists() ? s.data() : null;
}

/* ---------- 로그인 ---------- */
export async function onAuth(cb) {
  await init();
  if (mode === "demo") return cb(sessionStorage.getItem("ah:demoUser") ? { email: "demo@example.com", demo: true } : null);
  A.onAuthStateChanged(auth, cb);
}
export async function signIn() {
  await init();
  if (mode === "demo") { sessionStorage.setItem("ah:demoUser", "1"); return location.reload(); }
  await A.signInWithPopup(auth, new A.GoogleAuthProvider());
}
export async function signOut() {
  await init();
  if (mode === "demo") { sessionStorage.removeItem("ah:demoUser"); return location.reload(); }
  await A.signOut(auth);
}

/* ---------- 도구 ---------- */
export function rid(n = 20) {
  const a = "abcdefghijkmnpqrstuvwxyz23456789"; const b = new Uint8Array(n);
  crypto.getRandomValues(b); return [...b].map(x => a[x % a.length]).join("");
}
export const won = n => (Number(n) || 0).toLocaleString("ko-KR") + "원";
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const ymd = d => { const x = new Date(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
export function applyColor(c) { // 예전 이름: 학원 정보를 받으면 theme 전체, 색 문자열이면 주 색만
  if (c && typeof c === "object") return applyTheme(c);
  if (c && /^#[0-9a-f]{6}$/i.test(c)) applyTheme({ theme: { palette: { primary: c } } });
}
export function maskPhone(p) { const d = String(p || "").replace(/\D/g, ""); return d.length >= 10 ? d.slice(0, 3) + "-****-" + d.slice(-4) : p; }

function demoList(col) {
  const s = localStorage.getItem("ah:" + col);
  if (s) return JSON.parse(s);
  const seed = demoSeed()[col] || [];
  demoSave(col, seed); return seed;
}
function demoSave(col, l) { localStorage.setItem("ah:" + col, JSON.stringify(l)); }

// 데모 자료: 모두 가짜 학생, 가짜 번호다.
function demoSeed() {
  const t = new Date(); const day = k => ymd(new Date(t.getFullYear(), t.getMonth(), t.getDate() + k));
  const ym = ymd(t).slice(0, 7);
  const S = [
    ["s1", "김하윤", "초4", "초등 리딩 A", "01000000001", 220000],
    ["s2", "이서준", "초4", "초등 리딩 A", "01000000002", 220000],
    ["s3", "박지아", "초6", "초등 리딩 B", "01000000003", 240000],
    ["s4", "최도현", "초5", "초등 리딩 B", "01000000004", 240000],
    ["s5", "정유나", "중2", "중등 내신", "01000000005", 280000],
    ["s6", "강민재", "중1", "중등 내신", "01000000006", 280000]
  ].map(([id, name, grade, cls, parentPhone, fee]) => ({ id, name, grade, cls, parentPhone, fee }));
  return {
    students: S,
    inquiries: [
      { id: "q1", name: "윤○○ (가짜)", grade: "초3", phone: "01000000011", time: "평일 19:00~20:00", memo: "", status: "문의", createdAt: Date.now() - 3600e3 },
      { id: "q2", name: "한○○ (가짜)", grade: "중1", phone: "01000000012", time: "토요일 10:00~12:00", memo: "내신반 시간 문의", status: "예약", when: day(1) + " 10:30", createdAt: Date.now() - 86400e3 },
      { id: "q4", name: "문○○ (가짜)", grade: "초5", phone: "01000000014", time: "평일 14:00~15:00", memo: "", status: "문의", source: "레벨테스트", level: "6/8점 · Level 2 · 추천 초등 리딩 B", createdAt: Date.now() - 2 * 3600e3 },
      { id: "q3", name: "서○○ (가짜)", grade: "초5", phone: "01000000013", time: "평일 14:00~15:00", memo: "", status: "등록", createdAt: Date.now() - 5 * 86400e3 }
    ],
    schedule: [
      { id: "e1", type: "상담", date: day(0), time: "14:30", title: "신규 상담 · 초3 학부모" },
      { id: "e2", type: "보강", date: day(0), time: "17:10", title: "초등 리딩 B · 최도현" },
      { id: "e3", type: "상담", date: day(1), time: "10:30", title: "신규 상담 · 한○○" },
      { id: "e4", type: "시험", date: day(3), time: "19:00", title: "중등 내신 · 단원 평가" },
      { id: "e5", type: "보강", date: day(5), time: "15:00", title: "초등 리딩 A · 이서준" }
    ],
    makeups: [
      { id: "m1", name: "이서준", cls: "초등 리딩 A", missed: day(-2), want: "금요일 16시 이후", phone: "01000000002", status: "신청", createdAt: Date.now() - 5 * 3600e3 }
    ],
    reports: [
      { id: "demor1abcdefghijkmnpq", studentId: "s1", student: "김하윤", cls: "초등 리딩 A", month: ym, done: "Magic Tree House 1~3권을 소리 내어 읽었어요.\n새 단어 60개를 익혔어요.", numbers: "읽은 쪽수: 214쪽\n단어 시험 평균: 92점\n출석: 12회 중 12회", good: "모르는 단어를 앞뒤 문장으로\n먼저 짐작해 보는 습관이 생겼어요.", next: "4~5권을 끝까지 읽고\n줄거리를 세 문장으로 말해 봐요.", home: "자기 전 10분,\n오늘 읽은 장면을 물어봐 주세요.", sentAt: Date.now() - 3600e3, academy: "한빛영어학원" }
    ],
    payments: [
      { id: ym + "_s1", month: ym, studentId: "s1", paid: true, paidAt: day(-6) },
      { id: ym + "_s2", month: ym, studentId: "s2", paid: true, paidAt: day(-4) },
      { id: ym + "_s3", month: ym, studentId: "s3", paid: true, paidAt: day(-3) },
      { id: ym + "_s5", month: ym, studentId: "s5", paid: true, paidAt: day(-2) }
    ]
  };
}
