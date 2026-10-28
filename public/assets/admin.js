import * as D from "./core.js";
const { esc, won, ymd, rid, maskPhone } = D;

const S = { user: null, cfg: null, tab: "home", data: {}, month: ymd(Date.now()).slice(0, 7), qf: "전체", step: 0, edit: null, studentEdit: null };
const app = document.getElementById("app");
const TABS = [["home", "한눈에"], ["inq", "상담"], ["sch", "일정"], ["stu", "학생"], ["rep", "리포트"], ["pay", "원비"], ["site", "홈페이지 정보"]];
const STATUS = ["문의", "예약", "등록"];
const TYPES = ["상담", "보강", "시험", "그 밖"];
const ic = {
  out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/></svg>',
  g: '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>'
};

const toast = t => { const d = document.createElement("div"); d.className = "toast"; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2200); };
const today = () => ymd(Date.now());
const mLabel = m => `${+m.slice(5, 7)}월`;
const clsIdx = n => { const i = (S.cfg.classes || []).findIndex(c => c.name === n); return i < 0 ? 99 : i; };
const bySC = (a, b) => clsIdx(a.cls) - clsIdx(b.cls) || a.name.localeCompare(b.name, "ko");
const stuName = id => (S.data.students.find(s => s.id === id) || {}).name || "(지운 학생)";

D.onAuth(async u => {
  S.user = u;
  if (!u) return renderLogin();
  app.innerHTML = `<div class="boot muted">불러오는 중</div>`;
  try {
    S.cfg = await D.getConfig(D.isDemo());
    await loadAll();
  } catch (e) {
    if (String(e.code || e.message).includes("permission")) return renderDenied();
    app.innerHTML = `<div class="center"><div class="card login"><h1>불러오지 못했어요</h1><p class="muted">${esc(e.message)}</p><button class="btn" onclick="location.reload()">다시 열기</button></div></div>`;
    return;
  }
  if (S.cfg && new URLSearchParams(location.search).has("setup")) S.cfg._setup = true;
  if (!S.cfg || !S.cfg.name || S.cfg._setup) { S.cfg = S.cfg && S.cfg.name ? S.cfg : await D.loadDefaults(); S.cfg._setup = true; return renderSetup(); }
  D.applyColor(S.cfg.color);
  render();
});

async function loadAll() {
  const cols = ["inquiries", "schedule", "students", "reports", "payments"];
  const r = await Promise.all(cols.map(c => D.list(c)));
  cols.forEach((c, i) => S.data[c] = r[i]);
}

/* ---------- 로그인 ---------- */
function renderLogin() {
  app.innerHTML = `<div class="center"><div class="card login">
<h1>원장님 관리 화면</h1>
<p class="muted pl">등록한 원장님 구글 계정으로만
들어올 수 있어요.</p>
<button class="btn gbtn" id="in">${ic.g}구글 계정으로 들어가기</button>
${D.isDemo() ? `<p class="note">데모 화면이에요. 누르면 가짜 학원 자료로 둘러봐요.</p>` : ""}
<a class="btn ghost sm" href="/">홈페이지로 돌아가기</a></div></div>`;
  document.getElementById("in").onclick = () => D.signIn().catch(e => toast("로그인하지 못했어요"));
}
function renderDenied() {
  app.innerHTML = `<div class="center"><div class="card login"><h1>관리자 계정이 아니에요</h1>
<p class="muted pl">${esc(S.user.email)} 계정은
관리자로 등록되지 않았어요.</p><button class="btn" id="out">다른 계정으로 들어가기</button></div></div>`;
  document.getElementById("out").onclick = () => D.signOut();
}

/* ---------- 틀 ---------- */
function render() {
  const c = S.cfg;
  app.innerHTML = `<header class="ab"><div class="ab-in">
<a class="brand" href="/" target="_blank" rel="noopener">${c.logo ? `<img class="logo" src="${esc(c.logo)}" alt="">` : `<span class="logo logo-t">${esc(c.name[0])}</span>`}<span>${esc(c.name)}</span></a>
<a class="btn sm ghost hide-s" href="/" target="_blank" rel="noopener">${ic.ext}홈페이지</a>
<button class="btn sm ghost" id="out" aria-label="로그아웃">${ic.out}<span class="hide-s">로그아웃</span></button></div>
<nav class="tabs" role="tablist">${TABS.map(([k, t]) => `<button role="tab" class="tab${S.tab === k ? " on" : ""}" data-tab="${k}">${t}</button>`).join("")}</nav></header>
${D.isDemo() ? `<div class="demo-bar pl">데모예요. 가짜 학원·가짜 학생 자료예요.
바꾼 것은 이 브라우저에만 남아요.</div>` : ""}
<main class="main" id="main"></main>`;
  document.getElementById("out").onclick = () => D.signOut();
  app.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { S.tab = b.dataset.tab; S.edit = null; render(); scrollTo(0, 0); });
  const on = app.querySelector(".tab.on"); if (on) on.scrollIntoView({ inline: "center", block: "nearest" });
  ({ home, inq, sch, stu, rep, pay, site })[S.tab](document.getElementById("main"));
}

/* ---------- 한눈에 ---------- */
function home(m) {
  const t = today(), wk = ymd(Date.now() + 6 * 864e5);
  const ev = upcoming(t, wk);
  const todayN = ev.filter(e => e.date === t).length;
  const inq = S.data.inquiries; const newQ = inq.filter(q => q.status === "문의");
  const st = S.data.students;
  const reps = S.data.reports.filter(r => r.month === S.month);
  const sent = reps.filter(r => r.sentAt).length;
  const unpaid = st.filter(s => !payOf(s.id, S.month).paid);
  m.innerHTML = `<div class="stats">
${stat("오늘 일정", todayN + "건", "sch")}${stat("새 상담 문의", newQ.length + "건", "inq", newQ.length ? "pri" : "")}
${stat(mLabel(S.month) + " 리포트 보냄", `${sent} / ${st.length}명`, "rep")}${stat(mLabel(S.month) + " 원비 미납", unpaid.length + "명", "pay", unpaid.length ? "warn" : "")}</div>
<div class="cols">
<section class="card panel"><div class="ph"><h2>이번 주 일정</h2><button class="btn xs" data-go="sch">일정 넣기</button></div>${dayList(ev, t)}</section>
<div class="stack">
<section class="card panel"><div class="ph"><h2>상담 신청</h2><button class="btn xs" data-go="inq">전체 보기</button></div>
<div class="funnel">${STATUS.map(s => `<div><b>${inq.filter(q => q.status === s).length}</b><span>${s}</span></div>`).join("")}</div>
${inq.filter(q => q.status !== "등록").sort((a, b) => b.createdAt - a.createdAt).slice(0, 3).map(q => qRow(q, true)).join("") || `<p class="empty-t">새 신청이 없어요.</p>`}</section>
<section class="card panel"><div class="ph"><h2>${mLabel(S.month)} 리포트</h2><button class="btn xs" data-go="rep">쓰러 가기</button></div>
${bar(sent, st.length, "보냄")}<p class="small muted">${st.length - reps.length}명 안 씀 · ${reps.length - sent}명 써 두고 안 보냄</p></section>
<section class="card panel"><div class="ph"><h2>${mLabel(S.month)} 원비</h2><button class="btn xs" data-go="pay">표 보기</button></div>
${bar(st.length - unpaid.length, st.length, "납부")}
${unpaid.length ? `<ul class="mini">${unpaid.map(s => `<li><span>${esc(s.name)} <em class="muted">${esc(s.cls)}</em></span><b class="num">${won(s.fee)}</b></li>`).join("")}</ul>` : `<p class="empty-t">모두 냈어요.</p>`}</section>
</div></div>`;
  m.querySelectorAll("[data-go]").forEach(b => b.onclick = () => { S.tab = b.dataset.go; render(); scrollTo(0, 0); });
  bindQ(m);
}
const stat = (l, v, go, tone = "") => `<button class="card stat ${tone}" data-go="${go}"><span>${l}</span><b>${v}</b></button>`;
const bar = (a, b, l) => `<div class="bar"><div class="bar-t"><span>${l} ${a}명</span><span class="muted">전체 ${b}명</span></div><div class="bar-g"><i style="width:${b ? Math.round(a / b * 100) : 0}%"></i></div></div>`;
function upcoming(from, to) {
  const ev = S.data.schedule.filter(e => e.date >= from && e.date <= to);
  return ev.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
function dayList(ev, t) {
  if (!ev.length) return `<p class="empty-t">이번 주 일정이 없어요.</p>`;
  const by = {}; ev.forEach(e => (by[e.date] = by[e.date] || []).push(e));
  const W = "일월화수목금토";
  return Object.entries(by).map(([d, l]) => `<div class="day${d === t ? " today" : ""}"><div class="day-h"><b>${+d.slice(5, 7)}월 ${+d.slice(8)}일 (${W[new Date(d + "T00:00").getDay()]})</b>${d === t ? `<span class="tag pri">오늘</span>` : ""}</div>
${l.map(e => `<div class="ev"><span class="ev-t num">${esc(e.time || "")}</span><span class="tag ${e.type === "시험" ? "warn" : e.type === "상담" ? "pri" : ""}">${esc(e.type)}</span><span class="ev-n">${esc(e.title)}</span>${S.tab === "sch" ? `<button class="btn xs ghost" data-delev="${e.id}">지우기</button>` : ""}</div>`).join("")}</div>`).join("");
}

/* ---------- 상담 ---------- */
function qRow(q, compact) {
  const d = q.createdAt ? new Date(q.createdAt) : null;
  return `<div class="q${compact ? " compact" : ""}"><div class="q-top"><b>${esc(q.name)}</b><span class="tag">${esc(q.grade)}</span><span class="q-d muted">${d ? `${d.getMonth() + 1}/${d.getDate()} 신청` : ""}</span></div>
<div class="q-meta"><a href="tel:${esc(q.phone)}">${esc(fmtPhone(q.phone))}</a><span class="muted">${esc(q.time)}</span></div>
${q.memo && !compact ? `<p class="q-memo">${esc(q.memo)}</p>` : ""}
<div class="seg" role="group" aria-label="상태">${STATUS.map(s => `<button class="${q.status === s ? "on" : ""}" data-q="${q.id}" data-s="${s}">${s}</button>`).join("")}</div>
${q.status === "예약" && !compact ? `<div class="q-when"><input class="in" type="datetime-local" data-when="${q.id}" value="${esc((q.when || "").replace(" ", "T"))}"><span class="muted small">고르면 일정에 들어가요</span></div>` : ""}
${!compact ? `<div class="q-del"><button class="btn xs ghost" data-qdel="${q.id}">신청 지우기</button></div>` : ""}</div>`;
}
const fmtPhone = p => { const d = String(p || "").replace(/\D/g, ""); return d.length === 11 ? d.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3") : d.length === 10 ? d.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3") : p; };
function inq(m) {
  const all = S.data.inquiries.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const l = S.qf === "전체" ? all : all.filter(q => q.status === S.qf);
  const old = all.filter(q => q.createdAt && Date.now() - q.createdAt > 365 * 864e5);
  m.innerHTML = `<div class="toolbar"><div class="seg wide">${["전체", ...STATUS].map(s => `<button class="${S.qf === s ? "on" : ""}" data-qf="${s}">${s} ${s === "전체" ? all.length : all.filter(q => q.status === s).length}</button>`).join("")}</div></div>
${old.length ? `<div class="note warnish"><span>보관 기간 1년이 지난 신청이 ${old.length}건 있어요.</span><button class="btn xs" id="oldDel">지우기</button></div>` : ""}
<div class="qgrid">${l.map(q => `<div class="card">${qRow(q)}</div>`).join("") || `<div class="card panel"><p class="empty-t">이 상태의 신청이 없어요.</p></div>`}</div>`;
  m.querySelectorAll("[data-qf]").forEach(b => b.onclick = () => { S.qf = b.dataset.qf; inq(m); });
  const od = document.getElementById("oldDel"); if (od) od.onclick = async () => { for (const q of old) await D.del("inquiries", q.id); await loadAll(); toast(`${old.length}건 지웠어요`); inq(m); };
  bindQ(m);
}
function bindQ(m) {
  m.querySelectorAll("[data-q]").forEach(b => b.onclick = async () => {
    const q = S.data.inquiries.find(x => x.id === b.dataset.q); q.status = b.dataset.s;
    await D.put("inquiries", q.id, { status: q.status });
    if (q.status === "등록") toast("등록으로 바꿨어요. 학생 탭에서 명단에 넣어 주세요");
    render();
  });
  m.querySelectorAll("[data-when]").forEach(i => i.onchange = async () => {
    const q = S.data.inquiries.find(x => x.id === i.dataset.when); const v = i.value.replace("T", " ");
    await D.put("inquiries", q.id, { when: v }); q.when = v;
    const ev = { type: "상담", date: v.slice(0, 10), time: v.slice(11, 16), title: `신규 상담 · ${q.name} (${q.grade})` };
    await D.put("schedule", "inq_" + q.id, ev); await loadAll(); toast("일정에 넣었어요");
  });
  m.querySelectorAll("[data-qdel]").forEach(b => b.onclick = async () => { if (!confirm("이 신청을 지울까요?")) return; await D.del("inquiries", b.dataset.qdel); await loadAll(); render(); });
}

/* ---------- 일정 ---------- */
function sch(m) {
  const t = today();
  const ev = upcoming(t, ymd(Date.now() + 60 * 864e5));
  m.innerHTML = `<div class="cols"><section class="card panel"><div class="ph"><h2>일정 넣기</h2></div>
<form class="grid-form" id="ef"><label class="field"><span>종류</span><select class="sel" name="type">${TYPES.map(x => `<option>${x}</option>`).join("")}</select></label>
<label class="field"><span>날짜</span><input class="in" type="date" name="date" value="${t}" required></label>
<label class="field"><span>시간</span><input class="in" type="time" name="time" value="15:00"></label>
<label class="field full"><span>내용</span><input class="in" name="title" placeholder="예: 초등 리딩 A · 보강" required></label>
<button class="btn pri full">넣기</button></form></section>
<section class="card panel"><div class="ph"><h2>앞으로 60일</h2></div>${dayList(ev, t)}</section></div>`;
  document.getElementById("ef").onsubmit = async e => { e.preventDefault(); const v = Object.fromEntries(new FormData(e.target)); if (!v.title.trim()) return; await D.put("schedule", rid(12), v); await loadAll(); toast("일정에 넣었어요"); sch(m); };
  m.querySelectorAll("[data-delev]").forEach(b => b.onclick = async () => { await D.del("schedule", b.dataset.delev); await loadAll(); sch(m); });
}

/* ---------- 학생 ---------- */
function stu(m) {
  const cl = (S.cfg.classes || []).map(c => c.name);
  const e = S.studentEdit || {};
  const st = S.data.students.slice().sort(bySC);
  m.innerHTML = `<div class="cols wide-l"><section class="card panel"><div class="ph"><h2>반·학생 명단 <span class="muted">${st.length}명</span></h2></div>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>이름</th><th>학년</th><th>반</th><th>학부모 연락처</th><th class="r">원비</th><th></th></tr></thead><tbody>
${st.map(s => `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.grade)}</td><td>${esc(s.cls)}</td><td class="num muted">${esc(maskPhone(s.parentPhone))}</td><td class="r num">${won(s.fee)}</td>
<td class="r act"><button class="btn xs ghost" data-se="${s.id}">고치기</button><button class="btn xs ghost" data-sd="${s.id}">지우기</button></td></tr>`).join("") || `<tr><td colspan="6" class="empty-t">아직 학생이 없어요.</td></tr>`}</tbody></table></div></section>
<div class="stack"><section class="card panel"><div class="ph"><h2>${e.id ? "학생 고치기" : "학생 넣기"}</h2></div>
<form class="grid-form" id="sf"><label class="field"><span>이름</span><input class="in" name="name" value="${esc(e.name || "")}" required></label>
<label class="field"><span>학년</span><input class="in" name="grade" value="${esc(e.grade || "")}" placeholder="초4"></label>
<label class="field"><span>반</span><select class="sel" name="cls">${cl.map(c => `<option${e.cls === c ? " selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
<label class="field"><span>원비 (원)</span><input class="in" name="fee" inputmode="numeric" value="${esc(e.fee || "")}" placeholder="반 원비"></label>
<label class="field full"><span>학부모 연락처</span><input class="in" name="parentPhone" type="tel" value="${esc(fmtPhone(e.parentPhone || ""))}" placeholder="010-0000-0000"></label>
<button class="btn pri full">${e.id ? "고친 것 저장" : "넣기"}</button>${e.id ? `<button type="button" class="btn full" id="sc">그만 고치기</button>` : ""}</form></section>
<section class="card panel"><div class="ph"><h2>한꺼번에 넣기</h2><a class="btn xs" id="tpl">${ic.dl}양식</a></div>
<p class="small muted pl">구글 시트에서 양식대로 적고
줄을 복사해 붙여 넣거나, CSV 파일을 올려요.</p>
<textarea class="in" id="paste" rows="4" placeholder="이름, 학년, 반, 학부모 연락처, 원비"></textarea>
<div class="row2"><button class="btn sm" id="pasteGo">붙여 넣은 줄 넣기</button><label class="btn sm">CSV 파일 올리기<input type="file" accept=".csv,text/csv" id="csv" hidden></label></div></section></div></div>`;
  const cfgFee = n => ((S.cfg.classes || []).find(c => c.name === n) || {}).fee || 0;
  document.getElementById("sf").onsubmit = async ev => {
    ev.preventDefault(); const v = Object.fromEntries(new FormData(ev.target));
    const row = { name: v.name.trim(), grade: v.grade.trim(), cls: v.cls, parentPhone: v.parentPhone.replace(/\D/g, ""), fee: +String(v.fee).replace(/\D/g, "") || cfgFee(v.cls) };
    await D.put("students", e.id || rid(12), row); S.studentEdit = null; await loadAll(); toast("저장했어요"); stu(m);
  };
  const sc = document.getElementById("sc"); if (sc) sc.onclick = () => { S.studentEdit = null; stu(m); };
  m.querySelectorAll("[data-se]").forEach(b => b.onclick = () => { S.studentEdit = S.data.students.find(s => s.id === b.dataset.se); stu(m); });
  m.querySelectorAll("[data-sd]").forEach(b => b.onclick = async () => { if (!confirm("이 학생을 명단에서 지울까요?")) return; await D.del("students", b.dataset.sd); await loadAll(); stu(m); });
  document.getElementById("tpl").onclick = () => downloadCsv("학생명단_양식.csv", [["이름", "학년", "반", "학부모 연락처", "원비"], ["홍길동", "초4", cl[0] || "", "010-0000-0000", cfgFee(cl[0])]], true);
  const importRows = async rows => {
    rows = rows.filter(r => r[0] && !/^이름$/.test(r[0].trim()));
    for (const r of rows) {
      const [name, grade, cls, phone, fee] = r.map(x => (x || "").trim());
      const ex = S.data.students.find(s => s.name === name && s.cls === cls);
      await D.put("students", ex ? ex.id : rid(12), { name, grade, cls, parentPhone: phone.replace(/\D/g, ""), fee: +fee.replace(/\D/g, "") || cfgFee(cls) });
    }
    await loadAll(); toast(`${rows.length}명 넣었어요`); stu(m);
  };
  document.getElementById("pasteGo").onclick = () => importRows(parseTable(document.getElementById("paste").value));
  document.getElementById("csv").onchange = async ev => { const f = ev.target.files[0]; if (f) importRows(parseTable(await f.text())); };
}
function parseTable(txt) {
  txt = txt.replace(/^﻿/, "").trim(); if (!txt) return [];
  const sep = txt.includes("\t") ? "\t" : ",";
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"' && txt[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && txt[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  row.push(cell); rows.push(row); return rows;
}
function downloadCsv(name, rows, bom) {
  const s = rows.map(r => r.map(x => { x = String(x ?? ""); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }).join(",")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([(bom ? "﻿" : "") + s + "\n"], { type: "text/csv;charset=utf-8" })); a.download = name; a.click();
}

/* ---------- 리포트 ---------- */
const RF = [["done", "이번 달 한 것"], ["numbers", "숫자", "읽은 쪽수: 214쪽\n단어 시험 평균: 92점"], ["good", "잘한 것"], ["next", "다음 달 목표"], ["home", "집에서 도와주실 것"]];
function monthPick() { return `<label class="field mpick"><span class="sr">달</span><input class="in" type="month" id="mon" value="${S.month}"></label>`; }
function bindMonth(m, fn) { const i = document.getElementById("mon"); i.onchange = () => { S.month = i.value || S.month; S.edit = null; fn(m); }; }
const repOf = (sid, mo) => S.data.reports.find(r => r.studentId === sid && r.month === mo);
const link = r => location.origin + "/r/?t=" + r.id;
function rep(m) {
  const st = S.data.students.slice().sort(bySC);
  const reps = S.data.reports.filter(r => r.month === S.month);
  const toSend = reps.filter(r => !r.sentAt && phoneOf(r.studentId));
  const ed = S.edit && st.find(s => s.id === S.edit);
  const r = ed ? repOf(ed.id, S.month) || {} : null;
  m.innerHTML = `<div class="toolbar">${monthPick()}<div class="tb-r"><button class="btn sm pri" id="csvRep"${toSend.length ? "" : " disabled"}>${ic.dl}보낼 목록 CSV ${toSend.length}건</button></div></div>
<p class="small muted csv-hint pl">CSV는 번호,내용 두 칸이에요.
요메이트에 "이 파일로 리포트 문자 보내 줘"라고 맡기면 솔라피로 보내요.</p>
<div class="cols wide-r"><section class="card panel"><div class="ph"><h2>${mLabel(S.month)} 학생별 <span class="muted">${reps.filter(x => x.sentAt).length}/${st.length} 보냄</span></h2></div>
<ul class="slist">${st.map(s => { const x = repOf(s.id, S.month); const tg = !x ? `<span class="tag">안 씀</span>` : x.sentAt ? `<span class="tag ok">보냄</span>` : `<span class="tag pri">써 둠</span>`; return `<li><button class="${S.edit === s.id ? "on" : ""}" data-ed="${s.id}"><span><b>${esc(s.name)}</b><em class="muted">${esc(s.cls)}</em></span>${tg}</button></li>`; }).join("") || `<li class="empty-t">학생 탭에서 명단을 먼저 넣어 주세요.</li>`}</ul></section>
<section class="card panel">${ed ? `<div class="ph"><h2>${esc(ed.name)} · ${mLabel(S.month)} 리포트</h2></div>
<form class="rform" id="rf">${RF.map(([k, l, ph]) => `<label class="field"><span>${l}</span><textarea class="in" name="${k}" rows="3"${ph ? ` placeholder="${esc(ph)}"` : ""}>${esc(r[k] || "")}</textarea></label>`).join("")}
<div class="row2"><button class="btn pri">저장</button>${r.id ? `<a class="btn" href="${link(r)}" target="_blank" rel="noopener">${ic.ext}학부모 화면</a>` : ""}</div>
${r.id ? `<div class="linkbox"><input class="in" readonly value="${esc(link(r))}" aria-label="리포트 주소"><button type="button" class="btn sm" id="cp">${ic.copy}복사</button></div>
<div class="sentrow">${r.sentAt ? `<span class="tag ok">보냄 ${new Date(r.sentAt).getMonth() + 1}/${new Date(r.sentAt).getDate()}</span><button type="button" class="btn xs ghost" id="unsent">안 보냄으로</button>` : `<span class="tag">아직 안 보냄</span><button type="button" class="btn xs" id="sent">보냄으로 표시</button>`}</div>` : ""}
</form>` : `<div class="pick-hint"><p class="muted pl">왼쪽에서 학생을 고르면
리포트 칸 다섯 개가 열려요.</p></div>`}</section></div>`;
  bindMonth(m, rep);
  m.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => { S.edit = b.dataset.ed; rep(m); if (innerWidth < 960) document.getElementById("rf")?.scrollIntoView({ behavior: "smooth" }); });
  const f = document.getElementById("rf");
  if (f) {
    f.onsubmit = async e => { e.preventDefault(); const v = Object.fromEntries(new FormData(f)); const id = r.id || rid(20);
      await D.put("reports", id, { ...v, studentId: ed.id, student: ed.name, cls: ed.cls, month: S.month, academy: S.cfg.name, sentAt: r.sentAt || null }); await loadAll(); toast("저장했어요"); rep(m); };
    const cp = document.getElementById("cp"); if (cp) cp.onclick = () => navigator.clipboard.writeText(link(r)).then(() => toast("주소를 복사했어요"));
    const se = document.getElementById("sent"); if (se) se.onclick = async () => { await D.put("reports", r.id, { sentAt: Date.now() }); await loadAll(); rep(m); };
    const un = document.getElementById("unsent"); if (un) un.onclick = async () => { await D.put("reports", r.id, { sentAt: null }); await loadAll(); rep(m); };
  }
  document.getElementById("csvRep").onclick = async () => {
    downloadCsv(`리포트문자_${S.month}.csv`, [["번호", "내용"], ...toSend.map(x => [phoneOf(x.studentId), `[${S.cfg.name}] ${x.student} 학생 ${mLabel(S.month)} 리포트예요.\\n${link(x)}`])]);
    if (confirm(`${toSend.length}건을 CSV로 내려받았어요.\n요메이트가 보낸 뒤 '보냄'으로 표시할까요?`)) { for (const x of toSend) await D.put("reports", x.id, { sentAt: Date.now() }); await loadAll(); rep(m); }
  };
}
const phoneOf = sid => (S.data.students.find(s => s.id === sid) || {}).parentPhone || "";

/* ---------- 원비 ---------- */
const payOf = (sid, mo) => S.data.payments.find(p => p.studentId === sid && p.month === mo) || {};
function pay(m) {
  const st = S.data.students.slice().sort(bySC);
  const paid = st.filter(s => payOf(s.id, S.month).paid), un = st.filter(s => !payOf(s.id, S.month).paid);
  const sum = l => l.reduce((a, s) => a + (+s.fee || 0), 0);
  m.innerHTML = `<div class="toolbar">${monthPick()}<div class="tb-r"><button class="btn sm pri" id="csvPay"${un.filter(s => s.parentPhone).length ? "" : " disabled"}>${ic.dl}미납 안내 CSV ${un.filter(s => s.parentPhone).length}건</button></div></div>
<div class="stats two"><div class="card stat ok"><span>납부 ${paid.length}명</span><b class="num">${won(sum(paid))}</b></div><div class="card stat ${un.length ? "warn" : ""}"><span>미납 ${un.length}명</span><b class="num">${won(sum(un))}</b></div></div>
<section class="card panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>이름</th><th>반</th><th class="r">원비</th><th>상태</th><th>낸 날</th></tr></thead><tbody>
${st.map(s => { const p = payOf(s.id, S.month); return `<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.cls)}</td><td class="r num">${won(s.fee)}</td>
<td><div class="seg sm"><button class="${p.paid ? "on" : ""}" data-pay="${s.id}" data-v="1">납부</button><button class="${!p.paid ? "on warn" : ""}" data-pay="${s.id}" data-v="0">미납</button></div></td>
<td class="num muted">${p.paid && p.paidAt ? `${+p.paidAt.slice(5, 7)}/${+p.paidAt.slice(8)}` : ""}</td></tr>`; }).join("") || `<tr><td colspan="5" class="empty-t">학생 탭에서 명단을 먼저 넣어 주세요.</td></tr>`}</tbody></table></div></section>`;
  bindMonth(m, pay);
  m.querySelectorAll("[data-pay]").forEach(b => b.onclick = async () => { const sid = b.dataset.pay, v = b.dataset.v === "1";
    await D.put("payments", S.month + "_" + sid, { month: S.month, studentId: sid, paid: v, paidAt: v ? today() : null }); await loadAll(); pay(m); });
  document.getElementById("csvPay").onclick = () => downloadCsv(`원비안내_${S.month}.csv`, [["번호", "내용"], ...un.filter(s => s.parentPhone).map(s => [s.parentPhone, `[${S.cfg.name}] ${s.name} 학생 ${mLabel(S.month)} 원비 ${won(s.fee)} 안내드려요.\\n이미 내셨다면 이 문자는 넘겨 주세요.`])]);
}

/* ---------- 홈페이지 정보 (처음 설정과 같은 칸) ---------- */
const STEPS = [["학원", ["name", "tagline", "intro", "logo", "color"]], ["위치·연락", ["address", "parking", "phone", "regNo"]], ["반·원비", ["classes", "feeNote"]], ["선생님·상담", ["teachers", "consultSlots"]], ["확인", []]];
const COLORS = ["#1E5BB8", "#0F766E", "#7C3AED", "#C2410C", "#BE185D", "#1F2937"];
const FIELDS = {
  name: ["학원 이름", "in"], tagline: ["한 줄 소개", "ta", "줄을 나눌 곳에서 엔터를 눌러요"], intro: ["학원 소개", "ta"], logo: ["로고", "logo"], color: ["주 색", "color"],
  address: ["주소", "in"], parking: ["주차", "ta"], phone: ["대표 번호", "in"], regNo: ["교습소·학원 등록번호", "in", "예: 교습소 등록 제0000호"],
  feeNote: ["원비 안내 한 줄", "in", "예: 교재비는 실비로 따로 받습니다"],
  notice: ["위쪽 공지 띠", "notice"],
  classes: ["반·시간표·원비", "rows", [["name", "반 이름"], ["grade", "대상", "초3~초4"], ["days", "요일", "월·수·금"], ["time", "시간", "15:00~15:50"], ["seats", "정원", "8", "num"], ["fee", "한 달 원비(원)", "220000", "num"]], "반"],
  teachers: ["선생님", "rows", [["name", "이름"], ["role", "맡은 것"], ["line", "한 줄 소개", "", "ta"]], "선생님"],
  consultSlots: ["상담 가능 시간", "list", "평일 19:00~20:00"],
  reviews: ["학부모 후기", "rows", [["who", "누구", "초4 학부모 김○○"], ["text", "후기", "", "ta"]], "후기"]
};
function fieldHtml(k) {
  const [label, type, a, b] = FIELDS[k]; const c = S.cfg; const v = c[k];
  if (type === "in") return `<label class="field"><span>${label}</span><input class="in" data-k="${k}" value="${esc(v || "")}"${a ? ` placeholder="${esc(a)}"` : ""}></label>`;
  if (type === "ta") return `<label class="field"><span>${label}</span><textarea class="in" data-k="${k}" rows="3"${a ? ` placeholder="${esc(a)}"` : ""}>${esc(v || "")}</textarea></label>`;
  if (type === "color") return `<div class="field"><span>${label}</span><div class="swatches">${COLORS.map(x => `<button type="button" class="sw${(v || "").toLowerCase() === x.toLowerCase() ? " on" : ""}" style="background:${x}" data-color="${x}" aria-label="${x}"></button>`).join("")}<label class="sw-pick"><input type="color" data-k="color" value="${esc(v || "#1E5BB8")}"><span>직접 고르기</span></label></div></div>`;
  if (type === "logo") return `<div class="field"><span>${label}</span><div class="logo-row">${v ? `<img class="logo lg" src="${esc(v)}" alt="">` : `<span class="logo lg logo-t">${esc((c.name || "학")[0])}</span>`}<label class="btn sm">그림 올리기<input type="file" accept="image/*" id="logoF" hidden></label>${v ? `<button type="button" class="btn sm ghost" id="logoX">빼기</button>` : ""}</div><p class="small muted">없으면 학원 이름 첫 글자로 보여요.</p></div>`;
  if (type === "notice") { const n = v || {}; return `<div class="field"><span>${label}</span><div class="row2"><input class="in" data-n="text" value="${esc(n.text || "")}" placeholder="예: 11월 신규반 2자리 남았어요"><input class="in" type="date" data-n="until" value="${esc(n.until || "")}" aria-label="끝나는 날"></div><p class="small muted">끝나는 날이 지나면 저절로 내려가요.</p></div>`; }
  if (type === "list") return `<div class="field"><span>${label}</span>${(v || []).map((x, i) => `<div class="li-row"><input class="in" data-l="${k}" data-i="${i}" value="${esc(x)}" placeholder="${esc(a)}"><button type="button" class="btn sm ghost" data-ldel="${k}" data-i="${i}">빼기</button></div>`).join("")}<button type="button" class="btn sm add" data-ladd="${k}">+ 시간 더하기</button></div>`;
  if (type === "rows") return `<div class="field"><span>${label}</span>${k === "classes" ? `<div class="note">원비는 교육청에 게시한 금액 그대로 적어요.</div>` : ""}${(v || []).map((row, i) => `<div class="rowcard"><div class="rc-grid">${a.map(([f, l, ph, t]) => t === "ta" ? `<label class="field full"><span>${l}</span><textarea class="in" rows="2" data-r="${k}" data-i="${i}" data-f="${f}"${ph ? ` placeholder="${esc(ph)}"` : ""}>${esc(row[f] ?? "")}</textarea></label>` : `<label class="field"><span>${l}</span><input class="in" data-r="${k}" data-i="${i}" data-f="${f}"${t === "num" ? ' inputmode="numeric" data-num="1"' : ""} value="${esc(row[f] ?? "")}"${ph ? ` placeholder="${esc(ph)}"` : ""}></label>`).join("")}</div><div class="rc-act"><button type="button" class="btn xs ghost" data-rdel="${k}" data-i="${i}">이 ${b} 빼기</button></div></div>`).join("")}<button type="button" class="btn sm add" data-radd="${k}">+ ${b} 더하기</button></div>`;
}
function bindFields(root, rerender) {
  const c = S.cfg;
  root.querySelectorAll("[data-k]").forEach(i => i.oninput = () => { c[i.dataset.k] = i.value; if (i.dataset.k === "color") D.applyColor(i.value); });
  root.querySelectorAll("[data-color]").forEach(b => b.onclick = () => { c.color = b.dataset.color; D.applyColor(c.color); rerender(); });
  root.querySelectorAll("[data-n]").forEach(i => i.oninput = () => { c.notice = c.notice || {}; c.notice[i.dataset.n] = i.value; });
  root.querySelectorAll("[data-l]").forEach(i => i.oninput = () => { c[i.dataset.l][+i.dataset.i] = i.value; });
  root.querySelectorAll("[data-ladd]").forEach(b => b.onclick = () => { (c[b.dataset.ladd] = c[b.dataset.ladd] || []).push(""); rerender(); });
  root.querySelectorAll("[data-ldel]").forEach(b => b.onclick = () => { c[b.dataset.ldel].splice(+b.dataset.i, 1); rerender(); });
  root.querySelectorAll("[data-r]").forEach(i => i.oninput = () => { const v = i.dataset.num ? +i.value.replace(/\D/g, "") || "" : i.value; c[i.dataset.r][+i.dataset.i][i.dataset.f] = v; });
  root.querySelectorAll("[data-radd]").forEach(b => b.onclick = () => { (c[b.dataset.radd] = c[b.dataset.radd] || []).push({}); rerender(); });
  root.querySelectorAll("[data-rdel]").forEach(b => b.onclick = () => { c[b.dataset.rdel].splice(+b.dataset.i, 1); rerender(); });
  const lf = root.querySelector("#logoF"); if (lf) lf.onchange = async () => { const f = lf.files[0]; if (!f) return; c.logo = await shrink(f, 256); rerender(); };
  const lx = root.querySelector("#logoX"); if (lx) lx.onclick = () => { c.logo = ""; rerender(); };
}
function shrink(file, px) {
  return new Promise(res => { const img = new Image(); img.onload = () => { const s = Math.min(1, px / Math.max(img.width, img.height)); const cv = document.createElement("canvas"); cv.width = img.width * s; cv.height = img.height * s; cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height); res(cv.toDataURL("image/png")); }; img.src = URL.createObjectURL(file); });
}
function jsonTools() {
  return `<div class="row2 json"><button type="button" class="btn sm" id="jIn">JSON 파일로 채우기</button><button type="button" class="btn sm" id="jOut">${ic.dl}JSON 내려받기</button><input type="file" accept=".json,application/json" id="jF" hidden></div>`;
}
function bindJson(rerender) {
  document.getElementById("jIn").onclick = () => document.getElementById("jF").click();
  document.getElementById("jF").onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const j = JSON.parse(await f.text()); Object.assign(S.cfg, j); D.applyColor(S.cfg.color); toast("JSON 값으로 채웠어요"); rerender(); } catch (x) { toast("JSON 파일을 읽지 못했어요"); } };
  document.getElementById("jOut").onclick = () => { const c = { ...S.cfg }; delete c._setup; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(c, null, 2)], { type: "application/json" })); a.download = "academy.json"; a.click(); };
}
function site(m) {
  const keys = ["name", "tagline", "intro", "logo", "color", "notice", "address", "parking", "phone", "regNo", "classes", "feeNote", "teachers", "consultSlots", "reviews"];
  const draw = () => {
    m.innerHTML = `<div class="toolbar">${jsonTools()}<div class="tb-r"><a class="btn sm" href="/" target="_blank" rel="noopener">${ic.ext}홈페이지 보기</a></div></div>
<div class="card panel editor">${keys.map(fieldHtml).join("")}</div>
<div class="savebar"><button class="btn pri" id="save">홈페이지에 저장</button></div>`;
    bindFields(m, draw); bindJson(draw);
    document.getElementById("save").onclick = async () => { await D.saveConfig(S.cfg); toast("홈페이지에 저장했어요"); };
  };
  draw();
}

/* ---------- 처음 설정 ---------- */
function renderSetup() {
  D.applyColor(S.cfg.color);
  const draw = () => {
    const [title, keys] = STEPS[S.step]; const last = S.step === STEPS.length - 1; const c = S.cfg;
    app.innerHTML = `<div class="setup"><div class="setup-hd"><p class="eyebrow">처음 설정 · ${S.step + 1}/${STEPS.length}</p><h1>${title}</h1>
<ol class="steps">${STEPS.map((s, i) => `<li class="${i < S.step ? "done" : i === S.step ? "on" : ""}"><span>${i + 1}</span><em>${s[0]}</em></li>`).join("")}</ol></div>
${S.step === 0 ? `<div class="note pl">요메이트가 장부 값으로 미리 채워 두었으면
맞는지 보고 다음만 누르면 돼요.</div>${jsonTools()}` : ""}
<div class="card panel editor">${last ? summary(c) : keys.map(fieldHtml).join("")}</div>
<div class="setup-nav">${S.step ? `<button class="btn" id="prev">이전</button>` : `<span></span>`}<button class="btn pri" id="next">${last ? "홈페이지에 올리기" : "다음"}</button></div>
${D.isDemo() ? "" : `<p class="small muted center-t">${esc(S.user.email)}로 들어왔어요.</p>`}</div>`;
    bindFields(app, draw); if (S.step === 0) bindJson(draw);
    const p = document.getElementById("prev"); if (p) p.onclick = () => { S.step--; draw(); scrollTo(0, 0); };
    document.getElementById("next").onclick = async () => {
      if (S.step === 0 && !(c.name || "").trim()) return toast("학원 이름을 적어 주세요");
      if (!last) { S.step++; draw(); scrollTo(0, 0); return; }
      delete c._setup; await D.saveConfig(c); S.cfg = await D.getConfig(false) || c; toast("홈페이지에 올렸어요"); S.tab = "home"; render();
    };
  };
  draw();
}
function summary(c) {
  const row = (l, v) => `<div class="sum-r"><span class="muted">${l}</span><span class="pl">${v}</span></div>`;
  return `<div class="sum">${row("학원", esc(c.name))}${row("한 줄 소개", esc(c.tagline || ""))}${row("주소", esc(c.address || ""))}${row("대표 번호", esc(c.phone || ""))}
${row("반", (c.classes || []).map(x => `${esc(x.name)} · ${esc(x.days || "")} ${esc(x.time || "")} · ${won(x.fee)}`).join("\n"))}
${row("선생님", (c.teachers || []).map(x => esc(x.name)).join(", "))}${row("상담 시간", (c.consultSlots || []).map(esc).join("\n"))}</div>
<p class="small muted">후기와 공지 띠는 나중에 '홈페이지 정보' 탭에서 넣어요.</p>`;
}
