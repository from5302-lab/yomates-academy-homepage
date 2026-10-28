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

/* ---------- 학원 정보 ---------- */
export async function loadDefaults() {
  const r = await fetch("/academy.json", { cache: "no-store" });
  return r.ok ? r.json() : {};
}
// fallback: 아직 관리자 화면에서 저장하기 전이면 academy.json 값으로 홈페이지를 그린다(관리자 화면은 false).
export async function getConfig(fallback = true) {
  await init();
  if (mode === "demo") {
    const s = localStorage.getItem("ah:config");
    if (s) return JSON.parse(s);
    const d = await loadDefaults();
    return d.name ? d : null;
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
  if (mode === "demo") {
    const list = demoList("inquiries");
    list.unshift({ ...row, id: rid(8), createdAt: Date.now() });
    return demoSave("inquiries", list);
  }
  await F.addDoc(F.collection(db, "inquiries"), { ...row, createdAt: F.serverTimestamp() });
}

/* ---------- 원장님 전용 모음 ---------- */
// 모음: inquiries, schedule, students, reports, payments
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
export function applyColor(c) {
  if (c && /^#[0-9a-f]{6}$/i.test(c)) document.documentElement.style.setProperty("--pri", c);
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
      { id: "q3", name: "서○○ (가짜)", grade: "초5", phone: "01000000013", time: "평일 14:00~15:00", memo: "", status: "등록", createdAt: Date.now() - 5 * 86400e3 }
    ],
    schedule: [
      { id: "e1", type: "상담", date: day(0), time: "14:30", title: "신규 상담 · 초3 학부모" },
      { id: "e2", type: "보강", date: day(0), time: "17:10", title: "초등 리딩 B · 최도현" },
      { id: "e3", type: "상담", date: day(1), time: "10:30", title: "신규 상담 · 한○○" },
      { id: "e4", type: "시험", date: day(3), time: "19:00", title: "중등 내신 · 단원 평가" },
      { id: "e5", type: "보강", date: day(5), time: "15:00", title: "초등 리딩 A · 이서준" }
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
